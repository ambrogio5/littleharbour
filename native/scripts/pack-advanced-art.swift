// Grid extraction and sizing only. Painted pixels come from the committed generated atlas.
import Foundation
import CoreGraphics
import ImageIO
import CryptoKit
let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let sourcePath = "native/art-source/advanced-workshops-v1/atlas.png"
let source = root.appendingPathComponent(sourcePath)
let output = root.appendingPathComponent("native/LittleHarbour/Resources/Art")
let atlas = CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(source as CFURL, nil)!, 0, nil)!
let names = ["mill", "bakery", "fishing", "olive", "boatyard", "estate", "kitchen", "kiln", "preserving", "weaver", "carpenter", "sailmaker"]
var hashes: [String: String] = [:]
for (index, name) in names.enumerated() {
    let rect = CGRect(x: index % 4 * atlas.width / 4, y: index / 4 * atlas.height / 3, width: atlas.width / 4, height: atlas.height / 3)
    let cell = atlas.cropping(to: rect)!
    let context = CGContext(data: nil, width: 384, height: 384, bitsPerComponent: 8, bytesPerRow: 1536, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    context.interpolationQuality = .high
    let scale = min(310 / CGFloat(cell.width), 288 / CGFloat(cell.height))
    let w = CGFloat(cell.width) * scale, h = CGFloat(cell.height) * scale
    context.draw(cell, in: CGRect(x: (384-w)/2, y: 32, width: w, height: h))
    let pixels = context.data!.assumingMemoryBound(to: UInt8.self)
    precondition((0..<(384*384)).filter { pixels[$0*4+3] == 0 }.count > 384*384/4, "Atlas must contain genuine transparency")
    let file = "advanced-" + name + ".png", target = output.appendingPathComponent(file)
    let destination = CGImageDestinationCreateWithURL(target as CFURL, "public.png" as CFString, 1, nil)!
    CGImageDestinationAddImage(destination, context.makeImage()!, nil); precondition(CGImageDestinationFinalize(destination))
    hashes[file] = SHA256.hash(data: try Data(contentsOf: target)).map { String(format: "%02x", $0) }.joined()
}
let sourceHash = SHA256.hash(data: try Data(contentsOf: source)).map { String(format: "%02x", $0) }.joined()
try JSONSerialization.data(withJSONObject: ["hashes": [sourcePath: sourceHash], "outputHashes": hashes], options: [.prettyPrinted, .sortedKeys]).write(to: output.appendingPathComponent("advanced-manifest.json"))
print("Packed twelve distinct advanced workshops")
