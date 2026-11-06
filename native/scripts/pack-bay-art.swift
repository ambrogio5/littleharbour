// Deterministic cropping/packing of generated source pixels; no generative calls.
import Foundation
import CoreGraphics
import ImageIO
import CryptoKit

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let source = root.appendingPathComponent("native/art-source/sheltered-bay-v1")
let output = root.appendingPathComponent("native/LittleHarbour/Resources/Art")
func load(_ name: String) -> CGImage {
    CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(source.appendingPathComponent(name + ".png") as CFURL, nil)!, 0, nil)!
}
func write(_ image: CGImage, _ name: String) {
    let dest = CGImageDestinationCreateWithURL(output.appendingPathComponent(name + ".png") as CFURL, "public.png" as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, image, nil); precondition(CGImageDestinationFinalize(dest))
}
var names = [String]()
let terrain = load("terrain")
precondition(terrain.width == 1536 && terrain.height == 1024)
// Six exact adjoining tiles retain source detail without scaling or approximated joins.
for row in 0..<2 { for col in 0..<3 {
    let name = "bay-ground-\(col)-\(row)"
    write(terrain.cropping(to: CGRect(x: col * 512, y: row * 512, width: 512, height: 512))!, name); names.append(name)
} }
let props = load("props")
for (i, name) in ["cargo", "nets", "bench", "timber"].enumerated() {
    let w = props.width / 2, h = props.height / 2
    write(props.cropping(to: CGRect(x: i % 2 * w, y: i / 2 * h, width: w, height: h))!, "bay-" + name); names.append("bay-" + name)
}
write(load("paving"), "bay-paving"); names.append("bay-paving")
func hash(_ url: URL) throws -> String { SHA256.hash(data: try Data(contentsOf: url)).map { String(format: "%02x", $0) }.joined() }
var sources = [String:String](), outputs = [String:String]()
for file in ["terrain", "props", "paving", "approved-concept"] {
    sources["native/art-source/sheltered-bay-v1/" + file + ".png"] = try hash(source.appendingPathComponent(file + ".png"))
}
for name in names { outputs[name] = try hash(output.appendingPathComponent(name + ".png")) }
let data = try JSONSerialization.data(withJSONObject: ["version": 1, "hashes": sources, "outputHashes": outputs], options: [.prettyPrinted, .sortedKeys])
try data.write(to: output.appendingPathComponent("bay-manifest.json"))
print("Packed six registered terrain tiles, four transparent props and close-view paving.")
