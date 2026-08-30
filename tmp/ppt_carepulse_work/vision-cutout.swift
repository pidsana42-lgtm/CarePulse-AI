import Foundation
import CoreGraphics
import CoreImage
import ImageIO
import UniformTypeIdentifiers
import Vision

guard CommandLine.arguments.count == 3 else {
    fputs("usage: vision-cutout.swift input.png output.png\n", stderr)
    exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])

guard let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
      let cgImage = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    fputs("cannot read input image\n", stderr)
    exit(3)
}

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

do {
    try handler.perform([request])
    guard let observation = request.results?.first else {
        fputs("no foreground mask detected\n", stderr)
        exit(4)
    }

    let instances = observation.allInstances
    guard !instances.isEmpty else {
        fputs("no foreground instances detected\n", stderr)
        exit(5)
    }

    let maskBuffer = try observation.generateScaledMaskForImage(
        forInstances: instances,
        from: handler
    )

    let inputImage = CIImage(cgImage: cgImage)
    var maskImage = CIImage(cvPixelBuffer: maskBuffer)
    if maskImage.extent.width != inputImage.extent.width || maskImage.extent.height != inputImage.extent.height {
        let sx = inputImage.extent.width / maskImage.extent.width
        let sy = inputImage.extent.height / maskImage.extent.height
        maskImage = maskImage.transformed(by: CGAffineTransform(scaleX: sx, y: sy))
    }

    // A subtle blur keeps anti-aliased edges and soft glows clean without
    // creating the rough halo seen in threshold-based extraction.
    let softenedMask = maskImage
        .clampedToExtent()
        .applyingFilter("CIGaussianBlur", parameters: [kCIInputRadiusKey: 0.65])
        .cropped(to: inputImage.extent)

    let transparent = CIImage(color: CIColor(red: 0, green: 0, blue: 0, alpha: 0))
        .cropped(to: inputImage.extent)

    guard let blend = CIFilter(name: "CIBlendWithMask") else {
        fputs("cannot create blend filter\n", stderr)
        exit(6)
    }
    blend.setValue(inputImage, forKey: kCIInputImageKey)
    blend.setValue(transparent, forKey: kCIInputBackgroundImageKey)
    blend.setValue(softenedMask, forKey: kCIInputMaskImageKey)

    guard let outputImage = blend.outputImage?.cropped(to: inputImage.extent) else {
        fputs("cannot create cutout\n", stderr)
        exit(7)
    }

    let context = CIContext(options: [.useSoftwareRenderer: false])
    let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
    try context.writePNGRepresentation(
        of: outputImage,
        to: outputURL,
        format: .RGBA8,
        colorSpace: colorSpace,
        options: [:]
    )

    print("wrote transparent PNG with \(instances.count) foreground instances")
} catch {
    fputs("Vision cutout failed: \(error)\n", stderr)
    exit(8)
}
