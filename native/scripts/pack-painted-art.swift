// Asset packing only. Painted pixels come from the committed ImageGen source atlases.
// Run from repository root: swift native/scripts/pack-painted-art.swift
import Foundation
import CoreGraphics
import ImageIO
import CryptoKit

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let source = root.appendingPathComponent("native/art-source/painted-v2")
let output = root.appendingPathComponent("native/LittleHarbour/Resources/Art")
func load(_ file: String) -> CGImage {
    let input = CGImageSourceCreateWithURL(source.appendingPathComponent(file).appendingPathExtension("png") as CFURL, nil)!
    return CGImageSourceCreateImageAtIndex(input, 0, nil)!
}
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
func cell(_ atlas: CGImage, _ index: Int, topMargin: Int = 28) -> CGImage {
    let col = index % 4, row = index / 4, cw = atlas.width / 4, ch = atlas.height / 3
    let rect = CGRect(x: max(0, col * cw - 24), y: max(0, row * ch - topMargin), width: cw + 48, height: ch + topMargin + 28).intersection(CGRect(x: 0, y: 0, width: atlas.width, height: atlas.height))
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
func sprite(_ image: CGImage, width: CGFloat = 310, height: CGFloat = 288, annex: CGImage? = nil) -> CGImage {
    let c = context(384,384); c.interpolationQuality = .high
    let scale = min(width/CGFloat(image.width),height/CGFloat(image.height))
    let w=CGFloat(image.width)*scale,h=CGFloat(image.height)*scale
    c.draw(image,in:CGRect(x:(384-w)/2,y:48,width:w,height:h))
    if let annex {
        let scale=min(126/CGFloat(annex.width),132/CGFloat(annex.height))
        c.draw(annex,in:CGRect(x:238,y:38,width:CGFloat(annex.width)*scale,height:CGFloat(annex.height)*scale))
    }
    return c.makeImage()!
}
let architecture=load("architecture"),village=load("village"),stateAtlas=load("states")
let architectureKinds=["mill","bakery","olive","fishing","pier","waterfront","lighthouse","ferry","boatyard","estate","kiln","specialist"]
let villageKinds=["field","garden","orchard","flaxgarden","home","carpenter","weaver","sailmaker","market","square","clay","boat"]
var built=[String:CGImage]()
for (i,kind) in architectureKinds.enumerated() { built[kind]=cell(architecture,i) }
for (i,kind) in villageKinds.enumerated() { built[kind]=cell(village,i) }
let states=(0..<12).map { cell(stateAtlas,$0,topMargin:$0>=8 ? 100 : 28) }
let farms:Set<String>=["field","garden","orchard","flaxgarden","clay"]
let maritime:Set<String>=["fishing","pier","ferry","boat"]
let kinds=(architectureKinds+villageKinds).sorted()
var names=[String]()
for kind in kinds {
    for phase in ["unbuilt","building","built","upgraded","ripe"] {
        let name=kind+"-"+phase
        let sourceImage:CGImage
        var annex:CGImage?=nil
        switch phase {
        case "unbuilt": sourceImage=states[farms.contains(kind) ? 2 : maritime.contains(kind) ? 1 : 0]
        case "building": sourceImage=states[farms.contains(kind) ? 5 : maritime.contains(kind) ? 4 : 3]
        case "upgraded":
            if kind == "home" { sourceImage=states[10] }
            else if kind == "boat" { sourceImage=states[11] }
            else { sourceImage=built[kind]!; annex=states[farms.contains(kind) || kind == "square" ? 8 : 9] }
        case "built": sourceImage=kind == "field" ? states[6] : built[kind]!
        default: sourceImage=built[kind]!
        }
        write(sprite(sourceImage, height: phase == "unbuilt" ? 180 : 288, annex:annex),name)
        names.append(name)
    }
}
write(sprite(states[7]),"olive-tree")
let terrain=context(1800,2700);terrain.interpolationQuality = .high;terrain.draw(load("terrain"),in:CGRect(x:0,y:0,width:1800,height:2700));write(terrain.makeImage()!,"terrain")
let sources=["architecture","village","states","terrain"].map { "native/art-source/painted-v2/"+$0+".png" } + ["native/scripts/pack-painted-art.swift", "native/art-source/painted-v2/prompts.json", "native/art-source/painted-v2/icon.png", "native/art-source/painted-v2/icon-prompt.txt"]
var hashes=[String:String]()
for f in sources { hashes[f]=SHA256.hash(data:try Data(contentsOf:root.appendingPathComponent(f))).map{String(format:"%02x",$0)}.joined() }
var outputHashes=[String:String]()
for name in names+["terrain","olive-tree"] { outputHashes[name]=SHA256.hash(data:try Data(contentsOf:output.appendingPathComponent(name+".png"))).map{String(format:"%02x",$0)}.joined() }
let manifest:[String:Any]=["source":"Painted v2 · built-in ImageGen; see native/art-source/painted-v2/README.md", "coordinateFrame":["width":320,"height":320,"anchorX":160,"anchorY":160],"textures":names,"extras":["olive-tree"],"hashes":hashes,"outputHashes":outputHashes,"version":2]
try JSONSerialization.data(withJSONObject:manifest,options:[.prettyPrinted,.sortedKeys,.withoutEscapingSlashes]).write(to:output.appendingPathComponent("manifest.json"))
print("Packed \(names.count) state textures, olive tree and terrain from committed painted sources.")
