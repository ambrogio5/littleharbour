import XCTest
import UIKit
@testable import LittleHarbour

@MainActor final class PresentationTests: XCTestCase {
    func testSiteSelectionRoutesToUsefulWorkAndMatchesRecipeArguments() throws {
        let engine = try EngineRuntime()
        let url = Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json")!
        try engine.load(Data(contentsOf: url))
        let s = try engine.snapshot()
        let recipes = ["mill":"mill", "bakery":"bakery", "fishing":"fishing", "olive":"press", "boatyard":"saw", "estate":"wine", "kiln":"tiles", "claypit":"clay"]
        for (id, recipe) in recipes {
            guard let entity = s.entities.first(where: { $0.id == id && $0.stage == "built" }) else { continue }
            XCTAssertEqual(entity.category, "Production", id)
            let action = HarbourAction(id: "[\"start\",[\"\(recipe)\"]]", category: "Production", title: "localized title", detail: "", reason: "", enabled: true, destructive: false, goal: nil)
            XCTAssertTrue(action.belongs(to: entity), id)
            let other = HarbourAction(id: "[\"start\",[\"unrelated\"]]", category: "Production", title: "", detail: "", reason: "", enabled: false, destructive: false, goal: nil)
            XCTAssertFalse(other.belongs(to: entity), id)
        }
        let fresh = try EngineRuntime().snapshot()
        XCTAssertEqual(fresh.entities.first { $0.id == "pier" }?.category, "Build")
        let mill = try XCTUnwrap(fresh.entities.first { $0.id == "mill" })
        let matching = fresh.actions.filter { $0.category == mill.category && $0.belongs(to: mill) }
        XCTAssertEqual(matching.count, 1)
        XCTAssertEqual(matching.first?.verb, "Start production")
    }
    func testFixedShoreRegistrationDoesNotMoveSavedNeighbourhoodPlots() throws {
        let s = try EngineRuntime().snapshot(), scene = HarbourScene(size: CGSize(width: 400, height: 700))
        for entity in s.entities where entity.id.hasPrefix("plot") {
            XCTAssertEqual(scene.mapPosition(entity).x, entity.x)
            XCTAssertEqual(scene.mapPosition(entity).y, 2700 - entity.y)
        }
        let pier = try XCTUnwrap(s.entities.first { $0.id == "pier" })
        XCTAssertEqual(scene.mapPosition(pier).x, 1150)
        XCTAssertEqual(scene.mapPosition(pier).y, 380)
    }
    func testPaintedStatesArePackagedDistinctAndTransparent() throws {
        func bytes(_ name: String) throws -> Data { try Data(contentsOf: XCTUnwrap(Bundle.main.url(forResource: name, withExtension: "png"))) }
        for kind in ["mill", "home", "boat", "field", "ferry"] {
            let image = try XCTUnwrap(UIImage(named: kind + "-built")?.cgImage)
            XCTAssertNotEqual(image.alphaInfo, .none)
            XCTAssertEqual(image.width, 384)
            XCTAssertNotEqual(try bytes(kind + "-unbuilt"), try bytes(kind + "-building"))
            XCTAssertNotEqual(try bytes(kind + "-building"), try bytes(kind + "-built"))
            XCTAssertNotEqual(try bytes(kind + "-built"), try bytes(kind + "-upgraded"))
        }
        XCTAssertNotEqual(try bytes("field-built"), try bytes("field-ripe"))
        XCTAssertNotNil(Bundle.main.url(forResource: "olive-tree", withExtension: "png"))
    }
}
