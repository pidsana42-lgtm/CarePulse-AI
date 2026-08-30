import Foundation
import CoreGraphics
import CoreImage
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 4 else {
    fputs("usage: composite-mask.swift mask-source.png color-source.png output.png\n", stderr)
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
    let width = image.width
    let height = image.height
    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    let space = CGColorSpace(name: CGColorSpace.sRGB)!
    guard let context = CGContext(
        data: &pixels,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: width * 4,
        space: space,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
    ) else {
        fputs("cannot create bitmap context\n", stderr)
        exit(4)
    }
    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    return pixels
}

let maskSource = loadImage(CommandLine.arguments[1])
let colorSource = loadImage(CommandLine.arguments[2])
guard maskSource.width == colorSource.width && maskSource.height == colorSource.height else {
    fputs("source dimensions do not match\n", stderr)
    exit(5)
}

let width = maskSource.width
let height = maskSource.height
let count = width * height
let pixels = rgbaPixels(maskSource)
var candidate = [UInt8](repeating: 0, count: count)
var background = [UInt8](repeating: 0, count: count)

// Checkerboard pixels are bright and almost perfectly neutral. Foreground
// colors, glows, outlines, and shadows are intentionally excluded.
for i in 0..<count {
    let p = i * 4
    let r = Int(pixels[p])
    let g = Int(pixels[p + 1])
    let b = Int(pixels[p + 2])
    let low = min(r, min(g, b))
    let high = max(r, max(g, b))
    if low >= 216 && high - low <= 25 {
        candidate[i] = 1
    }
}

var queue = [Int32](repeating: 0, count: count)
var head = 0
var tail = 0
@inline(__always) func enqueue(_ index: Int) {
    if candidate[index] == 1 && background[index] == 0 {
        background[index] = 1
        queue[tail] = Int32(index)
        tail += 1
    }
}

for x in 0..<width {
    enqueue(x)
    enqueue((height - 1) * width + x)
}
for y in 0..<height {
    enqueue(y * width)
    enqueue(y * width + width - 1)
}
while head < tail {
    let i = Int(queue[head])
    head += 1
    let x = i % width
    if x > 0 { enqueue(i - 1) }
    if x + 1 < width { enqueue(i + 1) }
    if i >= width { enqueue(i - width) }
    if i + width < count { enqueue(i + width) }
}

var maskBytes = [UInt8](repeating: 255, count: count)
for i in 0..<count where background[i] == 1 {
    maskBytes[i] = 0
}

// Smooth the binary mask with a small separable 1-2-1 kernel. This creates a
// clean anti-aliased edge without the broad white fringe of a large blur.
var horizontal = [UInt8](repeating: 0, count: count)
var smoothMask = [UInt8](repeating: 0, count: count)
for y in 0..<height {
    for x in 0..<width {
        let i = y * width + x
        let left = Int(maskBytes[y * width + max(0, x - 1)])
        let center = Int(maskBytes[i])
        let right = Int(maskBytes[y * width + min(width - 1, x + 1)])
        horizontal[i] = UInt8((left + 2 * center + right) / 4)
    }
}
for y in 0..<height {
    for x in 0..<width {
        let i = y * width + x
        let top = Int(horizontal[max(0, y - 1) * width + x])
        let center = Int(horizontal[i])
        let bottom = Int(horizontal[min(height - 1, y + 1) * width + x])
        smoothMask[i] = UInt8((top + 2 * center + bottom) / 4)
    }
}

var outputPixels = rgbaPixels(colorSource)
for i in 0..<count {
    outputPixels[i * 4 + 3] = smoothMask[i]
}

let outputData = Data(outputPixels) as CFData
let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!
guard let provider = CGDataProvider(data: outputData),
      let finalCG = CGImage(
        width: width,
        height: height,
        bitsPerComponent: 8,
        bitsPerPixel: 32,
        bytesPerRow: width * 4,
        space: sRGB,
        bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.last.rawValue | CGBitmapInfo.byteOrder32Big.rawValue),
        provider: provider,
        decode: nil,
        shouldInterpolate: true,
        intent: .defaultIntent
      ) else {
    fputs("cannot create RGBA output\n", stderr)
    exit(7)
}

let outputURL = URL(fileURLWithPath: CommandLine.arguments[3])
guard let destination = CGImageDestinationCreateWithURL(
        outputURL as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
      ) else {
    fputs("cannot create PNG destination\n", stderr)
    exit(8)
}
CGImageDestinationAddImage(destination, finalCG, nil)
guard CGImageDestinationFinalize(destination) else {
    fputs("cannot write output PNG\n", stderr)
    exit(9)
}

let removed = background.reduce(0) { $0 + Int($1) }
print("wrote RGBA PNG; edge-connected background removed: \(String(format: "%.1f", Double(removed) * 100 / Double(count)))%")
