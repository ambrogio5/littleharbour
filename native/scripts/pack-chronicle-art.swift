// Deterministic atlas extraction only; all painted artwork is in the generated source.
import Foundation
import CoreGraphics
import ImageIO
import CryptoKit
let root=URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
let source=root.appendingPathComponent("native/art-source/chronicle-v1/landmarks.png")
let output=root.appendingPathComponent("native/LittleHarbour/Resources/Art")
let original=CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(source as CFURL,nil)!,0,nil)!
let alternate=CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(source.deletingLastPathComponent().appendingPathComponent("landmarks-alternate.png") as CFURL,nil)!,0,nil)!
let construction=CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(source.deletingLastPathComponent().appendingPathComponent("landmarks-construction.png") as CFURL,nil)!,0,nil)!
let names=["restoration","exhibition","seawall","belltower","garden","school","regatta","wintermarket"]
var manifest:[String:String]=[:]
for branch in 0..<3 {
for (index,name) in names.enumerated() {
 let im = branch == 2 ? construction : (index == 7 ? branch == 1 : branch == 0) ? original : alternate
 let x=index%4*im.width/4,y=index/4*im.height/2
 let cell=im.cropping(to:CGRect(x:x,y:y,width:im.width/4,height:im.height/2))!
 let c=CGContext(data:nil,width:384,height:384,bitsPerComponent:8,bytesPerRow:1536,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 // Retain atlas padding: no erasure, recolouring or invented pixels.
 c.interpolationQuality = .high
 c.draw(cell,in:CGRect(x:26,y:38,width:332,height:332))
 let target=output.appendingPathComponent("chronicle-\(name)\(branch == 2 ? "-construction" : branch == 1 ? "-alternate" : "").png")
 let dest=CGImageDestinationCreateWithURL(target as CFURL,"public.png" as CFString,1,nil)!
 CGImageDestinationAddImage(dest,c.makeImage()!,nil);precondition(CGImageDestinationFinalize(dest))
 manifest[target.lastPathComponent]=SHA256.hash(data:try Data(contentsOf:target)).map{String(format:"%02x",$0)}.joined()
}
}
try JSONSerialization.data(withJSONObject:manifest,options:[.prettyPrinted,.sortedKeys]).write(to:output.appendingPathComponent("chronicle-manifest.json"))
var sources: [String: String] = [:]
for name in ["landmarks.png", "landmarks-alternate.png", "landmarks-construction.png"] {
 let relative = "native/art-source/chronicle-v1/" + name
 sources[relative] = SHA256.hash(data: try Data(contentsOf: root.appendingPathComponent(relative))).map { String(format: "%02x", $0) }.joined()
}
try JSONSerialization.data(withJSONObject:sources,options:[.prettyPrinted,.sortedKeys]).write(to:output.appendingPathComponent("chronicle-source-manifest.json"))
print("Packed twenty-four transparent chronicle landmarks")
