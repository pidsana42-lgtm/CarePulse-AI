import Foundation
import Vision
import AppKit

func recognizeText(from imagePath: String) -> String {
    let url = URL(fileURLWithPath: imagePath)
    guard let image = NSImage(contentsOf: url),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        return ""
    }

    var recognizedLines: [String] = []
    let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    let request = VNRecognizeTextRequest { (request, error) in
        guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
        for observation in observations {
            guard let topCandidate = observation.topCandidates(1).first else { continue }
            recognizedLines.append(topCandidate.string)
        }
    }

    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    if #available(macOS 13.0, *) {
        request.recognitionLanguages = ["th-TH", "en-US"]
    } else {
        request.recognitionLanguages = ["en-US"]
    }

    do {
        try requestHandler.perform([request])
    } catch {
        return ""
    }

    return recognizedLines.joined(separator: "\n")
}

let args = CommandLine.arguments
if args.count > 1 {
    let path = args[1]
    let text = recognizeText(from: path)
    print(text)
} else {
    print("")
}
