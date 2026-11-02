// Review-only contact sheets from the packaged assets, using native macOS graphics.
import Foundation
import CoreGraphics
import CoreText
import ImageIO
let root=URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
let art=root.appendingPathComponent("native/LittleHarbour/Resources/Art")
let docs=root.appendingPathComponent("native/docs/screenshots")
func image(_ name:String)->CGImage { CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(art.appendingPathComponent(name+".png") as CFURL,nil)!,0,nil)! }
func sheet(_ names:[String], columns:Int, file:String) {
    let cell=240, header=44, rows=(names.count+columns-1)/columns,w=columns*cell,h=rows*(cell+header)
    let c=CGContext(data:nil,width:w,height:h,bitsPerComponent:8,bytesPerRow:w*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.noneSkipLast.rawValue)!
    c.setFillColor(CGColor(red:0.98,green:0.96,blue:0.91,alpha:1));c.fill(CGRect(x:0,y:0,width:w,height:h))
    for (i,name) in names.enumerated() {
        let x=(i%columns)*cell,y=h-(i/columns+1)*(cell+header)
        c.draw(image(name),in:CGRect(x:x,y:y+header,width:cell,height:cell))
        let string=NSAttributedString(string:name,attributes:[NSAttributedString.Key(kCTFontAttributeName as String):CTFontCreateWithName("AvenirNext-Medium" as CFString,17,nil),NSAttributedString.Key(kCTForegroundColorAttributeName as String):CGColor(red:0.1,green:0.25,blue:0.27,alpha:1)])
        let line=CTLineCreateWithAttributedString(string);c.textPosition=CGPoint(x:CGFloat(x)+(CGFloat(cell)-CGFloat(CTLineGetTypographicBounds(line,nil,nil,nil)))/2,y:CGFloat(y)+16);CTLineDraw(line,c)
    }
    let dest=CGImageDestinationCreateWithURL(docs.appendingPathComponent(file+".png") as CFURL,"public.png" as CFString,1,nil)!
    CGImageDestinationAddImage(dest,c.makeImage()!,nil);precondition(CGImageDestinationFinalize(dest))
}
sheet(["mill","bakery","olive","fishing","pier","waterfront","lighthouse","ferry","boatyard","estate","kiln","specialist","field","garden","orchard","flaxgarden","home","carpenter","weaver","sailmaker","market","square","clay","boat"].map{$0+"-built"},columns:6,file:"painted-building-catalog")
sheet(["mill","home","field","ferry"].flatMap{kind in ["unbuilt","building","built","upgraded","ripe"].map{kind+"-"+$0}},columns:5,file:"painted-state-catalog")
print("Created two painted art review sheets.")
