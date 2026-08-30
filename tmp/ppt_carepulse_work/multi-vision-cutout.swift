import Foundation
import CoreGraphics
import CoreVideo
import ImageIO
import UniformTypeIdentifiers
import Vision

guard CommandLine.arguments.count == 4 else {
    fputs("usage: multi-vision-cutout.swift vision-source.png color-source.png output.png\n", stderr)
    exit(2)
}

func loadImage(_ path: String) -> CGImage {
    let url = URL(fileURLWithPath: path) as CFURL
    guard let source = CGImageSourceCreateWithURL(url, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        fputs("cannot read image: \(path)\n", stderr)
        exit(3)
    }
    return image
}

func rgbaPixels(_ image: CGImage) -> [UInt8] {
    var pixels = [UInt8](repeating: 0, count: image.width * image.height * 4)
    let space = CGColorSpace(name: CGColorSpace.sRGB)!
    let context = CGContext(
        data: &pixels,
        width: image.width,
        height: image.height,
        bitsPerComponent: 8,
        bytesPerRow: image.width * 4,
        space: space,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
    )!
    context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
    return pixels
}

let visionSource = loadImage(CommandLine.arguments[1])
let colorSource = loadImage(CommandLine.arguments[2])
let width = visionSource.width
let height = visionSource.height
guard colorSource.width == width && colorSource.height == height else {
    fputs("source dimensions do not match\n", stderr)
    exit(4)
}

var mask = [UInt8](repeating: 0, count: width * height)

// Top-left pixel coordinates. Each crop makes a single illustration group
// salient enough for Vision to preserve its internal white surfaces.
let topLeftCrops: [(String, CGRect)] = [
    ("robot", CGRect(x: 70, y: 35, width: 610, height: 330)),
    ("search", CGRect(x: 0, y: 250, width: 650, height: 330)),
    ("government", CGRect(x: 0, y: 505, width: 620, height: 436)),
    ("carepulse", CGRect(x: 535, y: 100, width: 650, height: 650)),
    ("family", CGRect(x: 1190, y: 145, width: 482, height: 455)),
    ("outcomes", CGRect(x: 1010, y: 545, width: 662, height: 396))
]

func mergeVisionMask(cropName: String, topLeftRect: CGRect) throws {
    // CGImage crop rectangles use a lower-left origin.
    let cgRect = CGRect(
        x: topLeftRect.origin.x,
        y: CGFloat(height) - topLeftRect.origin.y - topLeftRect.height,
        width: topLeftRect.width,
        height: topLeftRect.height
    ).integral
    guard let crop = visionSource.cropping(to: cgRect) else { return }

    let request = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(cgImage: crop, options: [:])
    try handler.perform([request])
    guard let observation = request.results?.first, !observation.allInstances.isEmpty else {
        print("\(cropName): no instances")
        return
    }
    let buffer = try observation.generateScaledMaskForImage(
        forInstances: observation.allInstances,
        from: handler
    )
    CVPixelBufferLockBaseAddress(buffer, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(buffer, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddress(buffer) else { return }
    let bufferWidth = CVPixelBufferGetWidth(buffer)
    let bufferHeight = CVPixelBufferGetHeight(buffer)
    let rowBytes = CVPixelBufferGetBytesPerRow(buffer)
    let bytes = base.assumingMemoryBound(to: UInt8.self)

    let outX = Int(topLeftRect.origin.x)
    let outY = Int(topLeftRect.origin.y)
    let outW = Int(topLeftRect.width)
    let outH = Int(topLeftRect.height)
    for y in 0..<outH {
        let sy = min(bufferHeight - 1, y * bufferHeight / outH)
        for x in 0..<outW {
            let sx = min(bufferWidth - 1, x * bufferWidth / outW)
            let value = bytes[sy * rowBytes + sx]
            let gx = outX + x
            let gy = outY + y
            if gx >= 0 && gx < width && gy >= 0 && gy < height {
                let index = gy * width + gx
                if value > mask[index] { mask[index] = value }
            }
        }
    }
    print("\(cropName): \(observation.allInstances.count) instance(s)")
}

do {
    for (name, rect) in topLeftCrops {
        try mergeVisionMask(cropName: name, topLeftRect: rect)
    }
} catch {
    fputs("Vision masking failed: \(error)\n", stderr)
    exit(5)
}

// Preserve thin colored routes, outlines, glows, and small symbols that an
// instance segmentation model can miss. Neutral checkerboard pixels score 0.
let visionPixels = rgbaPixels(visionSource)
for i in 0..<(width * height) {
    let p = i * 4
    let r = Int(visionPixels[p])
    let g = Int(visionPixels[p + 1])
    let b = Int(visionPixels[p + 2])
    let high = max(r, max(g, b))
    let low = min(r, min(g, b))
    let chroma = high - low
    let darkness = 248 - high
    let score = max(chroma * 5, darkness * 4)
    let alpha = UInt8(max(0, min(255, score - 32)))
    if alpha > mask[i] { mask[i] = alpha }
}

// Tight 1-2-1 feather for clean anti-aliasing.
var horizontal = [UInt8](repeating: 0, count: width * height)
var smooth = [UInt8](repeating: 0, count: width * height)
for y in 0..<height {
    for x in 0..<width {
        let i = y * width + x
        horizontal[i] = UInt8((
            Int(mask[y * width + max(0, x - 1)]) +
            2 * Int(mask[i]) +
            Int(mask[y * width + min(width - 1, x + 1)])
        ) / 4)
    }
}
for y in 0..<height {
    for x in 0..<width {
        let i = y * width + x
        smooth[i] = UInt8((
            Int(horizontal[max(0, y - 1) * width + x]) +
            2 * Int(horizontal[i]) +
            Int(horizontal[min(height - 1, y + 1) * width + x])
        ) / 4)
    }
}

var output = rgbaPixels(colorSource)
for i in 0..<(width * height) { output[i * 4 + 3] = smooth[i] }
let outputData = Data(output) as CFData
let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
guard let provider = CGDataProvider(data: outputData),
      let outputImage = CGImage(
        width: width,
        height: height,
        bitsPerComponent: 8,
        bitsPerPixel: 32,
        bytesPerRow: width * 4,
        space: colorSpace,
        bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.last.rawValue | CGBitmapInfo.byteOrder32Big.rawValue),
        provider: provider,
        decode: nil,
        shouldInterpolate: true,
        intent: .defaultIntent
      ),
      let destination = CGImageDestinationCreateWithURL(
        URL(fileURLWithPath: CommandLine.arguments[3]) as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
      ) else {
    fputs("cannot create output image\n", stderr)
    exit(6)
}
CGImageDestinationAddImage(destination, outputImage, nil)
guard CGImageDestinationFinalize(destination) else {
    fputs("cannot write output image\n", stderr)
    exit(7)
}
print("wrote \(width)x\(height) transparent PNG")
