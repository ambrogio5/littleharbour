// Deterministic packaging only; preserves generated painted pixels and alpha.
import Foundation
import CoreGraphics
import ImageIO
import CryptoKit
let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let output = root.appendingPathComponent("native/LittleHarbour/Resources/Art")
let input = CGImageSourceCreateWithURL(root.appendingPathComponent("native/art-source/resources-v1/atlas.png") as CFURL, nil)!
let atlas = CGImageSourceCreateImageAtIndex(input, 0, nil)!
func context(_ w: Int, _ h: Int) -> CGContext {
    CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
}
func write(_ image: CGImage, _ name: String) {
    let target = CGImageDestinationCreateWithURL(output.appendingPathComponent(name + ".png") as CFURL, "public.png" as CFString, 1, nil)!
    CGImageDestinationAddImage(target, image, nil); precondition(CGImageDestinationFinalize(target))
}
// Generator atlases have approximate grid gutters. An overlapping crop plus a largest
// alpha-connected-component extraction keeps the full object and discards neighbouring
// sprites/isolated pixel debris. It does not invent or recolour any painted detail.
func cell(_ atlas: CGImage, _ index: Int, topMargin: Int = 64) -> CGImage {
    let col = index % 4, row = index / 4, cw = atlas.width / 4, ch = atlas.height / 6
    let rect = CGRect(x: max(0, col * cw - 24), y: max(0, row * ch - topMargin), width: cw + 48, height: ch + topMargin + 64).intersection(CGRect(x: 0, y: 0, width: atlas.width, height: atlas.height))
    let image = atlas.cropping(to: rect)!, w = image.width, h = image.height
    let c = context(w,h); c.draw(image, in: CGRect(x:0,y:0,width:w,height:h))
    let pixels = c.data!.assumingMemoryBound(to: UInt8.self)
    var visited = [Bool](repeating:false,count:w*h), largest = [Int]()
    for p in 0..<(w*h) where !visited[p] && pixels[p*4+3] > 24 {
        var queue = [p]; visited[p] = true; var head = 0
        while head < queue.count {
            let n = queue[head]; head += 1
            for next in [n-w,n+w,n%w > 0 ? n-1 : -1,n%w < w-1 ? n+1 : -1] where next >= 0 && next < w*h {
                if !visited[next] && pixels[next*4+3] > 24 { visited[next] = true; queue.append(next) }
            }
        }
        if queue.count > largest.count { largest = queue }
    }
    precondition(largest.count > 500, "Missing sprite \(index)")
    var keep = [Bool](repeating:false,count:w*h)
    for n in largest {
        for dy in -1...1 { for dx in -1...1 {
            let x=n%w+dx,y=n/w+dy
            if x>=0 && x<w && y>=0 && y<h { keep[y*w+x]=true }
        } }
    }
    var minX=w,minY=h,maxX=0,maxY=0
    for n in 0..<(w*h) {
        if !keep[n] { pixels[n*4]=0; pixels[n*4+1]=0; pixels[n*4+2]=0; pixels[n*4+3]=0 }
        else if pixels[n*4+3] > 16 { minX=min(minX,n%w);maxX=max(maxX,n%w);minY=min(minY,n/w);maxY=max(maxY,n/w) }
    }
    return c.makeImage()!.cropping(to: CGRect(x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1))!
}

let goods = ["wheat","flour","bread","fish","olives","oil","grapes","wine","wood","planks","stone","clay","tiles","jars","flax","cloth","sails","boatparts","fruit","vegetables","preserves","provisions","furniture","coins"]
for (index, good) in goods.enumerated() {
    let image = cell(atlas, index), c = context(192,192)
    c.interpolationQuality = .high
    let scale = min(172 / CGFloat(image.width),172 / CGFloat(image.height))
    let width = CGFloat(image.width) * scale, height = CGFloat(image.height) * scale
    c.draw(image, in: CGRect(x:(192-width)/2,y:(192-height)/2,width:width,height:height))
    write(c.makeImage()!, "good-" + good)
}
func hash(_ path: String) throws -> String { SHA256.hash(data:try Data(contentsOf:root.appendingPathComponent(path))).map{String(format:"%02x",$0)}.joined() }
let sourcePaths = ["native/art-source/resources-v1/atlas.png","native/art-source/resources-v1/prompt.txt","native/scripts/pack-resource-art.swift"]
let hashes = try Dictionary(uniqueKeysWithValues:sourcePaths.map{($0,try hash($0))})
let outputHashes = try Dictionary(uniqueKeysWithValues:goods.map{("good-"+$0,try hash("native/LittleHarbour/Resources/Art/good-"+$0+".png"))})
let manifest: [String:Any] = ["version":1,"size":192,"goods":goods,"hashes":hashes,"outputHashes":outputHashes]
try JSONSerialization.data(withJSONObject:manifest,options:[.prettyPrinted,.sortedKeys,.withoutEscapingSlashes]).write(to:output.appendingPathComponent("resource-manifest.json"))
print("Packed 24 painted resource icons with preserved alpha.")
