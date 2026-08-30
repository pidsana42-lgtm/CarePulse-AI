import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
    fputs("usage: make-transparent.swift input.png output.png\n", stderr)
    exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1]) as CFURL
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2]) as CFURL

guard let source = CGImageSourceCreateWithURL(inputURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    fputs("cannot read input image\n", stderr)
    exit(3)
}

let width = image.width
let height = image.height
let pixelCount = width * height
var pixels = [UInt8](repeating: 0, count: pixelCount * 4)

guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
      let context = CGContext(
        data: &pixels,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: width * 4,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
      ) else {
    fputs("cannot create bitmap context\n", stderr)
    exit(4)
}

context.translateBy(x: 0, y: CGFloat(height))
context.scaleBy(x: 1, y: -1)
context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

var candidate = [UInt8](repeating: 0, count: pixelCount)
var background = [UInt8](repeating: 0, count: pixelCount)

// ImageGen's failed transparency pass produced a neutral checkerboard.
// Treat only very bright, near-neutral pixels as possible background.
for i in 0..<pixelCount {
    let p = i * 4
    let r = Int(pixels[p])
    let g = Int(pixels[p + 1])
    let b = Int(pixels[p + 2])
    let low = min(r, min(g, b))
    let high = max(r, max(g, b))
    if low >= 220 && high - low <= 22 {
        candidate[i] = 1
    }
}

var queue = [Int32](repeating: 0, count: pixelCount)
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
    if i + width < pixelCount { enqueue(i + width) }
}

// Make edge-connected neutral background transparent. Feather only the first
// foreground pixel so the cutout remains smooth at presentation scale.
for i in 0..<pixelCount {
    let p = i * 4
    if background[i] == 1 {
        pixels[p] = 0
        pixels[p + 1] = 0
        pixels[p + 2] = 0
        pixels[p + 3] = 0
        continue
    }
    let x = i % width
    var edge = false
    if x > 0 && background[i - 1] == 1 { edge = true }
    if x + 1 < width && background[i + 1] == 1 { edge = true }
    if i >= width && background[i - width] == 1 { edge = true }
    if i + width < pixelCount && background[i + width] == 1 { edge = true }
    if edge { pixels[p + 3] = 210 }
}

let outputData = Data(pixels) as CFData
guard let provider = CGDataProvider(data: outputData),
      let outputImage = CGImage(
        width: width,
        height: height,
        bitsPerComponent: 8,
        bitsPerPixel: 32,
        bytesPerRow: width * 4,
        space: colorSpace,
        bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue),
        provider: provider,
        decode: nil,
        shouldInterpolate: true,
        intent: .defaultIntent
      ),
      let destination = CGImageDestinationCreateWithURL(outputURL, UTType.png.identifier as CFString, 1, nil) else {
    fputs("cannot create output image\n", stderr)
    exit(5)
}

CGImageDestinationAddImage(destination, outputImage, nil)
guard CGImageDestinationFinalize(destination) else {
    fputs("cannot write output image\n", stderr)
    exit(6)
}

let removed = background.reduce(0) { $0 + Int($1) }
let percent = Double(removed) * 100.0 / Double(pixelCount)
print("wrote \(width)x\(height) RGBA PNG; transparent background: \(String(format: "%.1f", percent))%")
