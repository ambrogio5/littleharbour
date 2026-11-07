import XCTest
import UIKit
import SwiftUI
@testable import LittleHarbour

@MainActor final class PresentationTests: XCTestCase {
    func testAppearancePaletteKeepsTextReadableInBothModes() {
        func luminance(_ color: Color, _ style: UIUserInterfaceStyle) -> Double {
            let resolved = UIColor(color).resolvedColor(with: UITraitCollection(userInterfaceStyle: style))
            var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
            resolved.getRed(&r, green: &g, blue: &b, alpha: &a)
            func linear(_ value: CGFloat) -> Double { let v = Double(value); return v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
            return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
        }
        for style in [UIUserInterfaceStyle.light, .dark] {
            for background in [HarbourTheme.paper, HarbourTheme.surface] {
                for foreground in [HarbourTheme.ink, HarbourTheme.muted, HarbourTheme.sea] {
                    let a = luminance(foreground, style), b = luminance(background, style)
                    XCTAssertGreaterThanOrEqual((max(a, b) + 0.05) / (min(a, b) + 0.05), 4.5)
                }
            }
            let fill = luminance(HarbourTheme.action, style)
            XCTAssertGreaterThanOrEqual(1.05 / (fill + 0.05), 4.5)
        }
        XCTAssertLessThan(luminance(HarbourTheme.paper, .dark), luminance(HarbourTheme.paper, .light))
        XCTAssertNil(HarbourAppearance.system.colorScheme)
        XCTAssertEqual(HarbourAppearance.dark.colorScheme, .dark)
        XCTAssertEqual(HarbourAppearance.light.colorScheme, .light)
    }
    func testFestivalDecorationTracksSavedStagesWithoutMovingTheCourtyard() throws {
        let engine = try EngineRuntime(), scene = HarbourScene(size: CGSize(width: 900, height: 600))
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "festival-opening", withExtension: "json"))
        try engine.load(Data(contentsOf: url)); let before = try engine.snapshot()
        scene.apply(before, selected: "courtyard")
        let court = try XCTUnwrap(scene.world.childNode(withName: "courtyard"))
        let position = court.position, preparing = try XCTUnwrap(court.childNode(withName: "festival-decoration"))
        let count = preparing.children.count
        XCTAssertEqual(before.entities.first { $0.id == "courtyard" }?.category, "Festival")
        XCTAssertTrue(try engine.call("act", ["[\"festivalCelebrate\",[\"food\"]]"]).toBool())
        scene.apply(try engine.snapshot(), selected: "courtyard")
        XCTAssertEqual(court.position, position)
        XCTAssertGreaterThan(try XCTUnwrap(court.childNode(withName: "festival-decoration")).children.count, count)
        let saved = try engine.save(); try engine.load(saved); scene.apply(try engine.snapshot(), selected: nil)
        XCTAssertNotNil(court.childNode(withName: "festival-decoration"))
        try engine.call("reset", [false]); scene.apply(try engine.snapshot(), selected: nil)
        XCTAssertNil(court.childNode(withName: "festival-decoration"))
    }
    func testSiteSelectionRoutesToUsefulWorkAndMatchesRecipeArguments() throws {
        let engine = try EngineRuntime()
        let url = Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json")!
        try engine.load(Data(contentsOf: url))
        let s = try engine.snapshot()
        let recipes = ["mill":"mill", "bakery":"bakery", "fishing":"fishing", "olive":"press", "boatyard":"saw", "estate":"wine", "kiln":"tiles", "claypit":"clay"]
        for (id, recipe) in recipes {
            guard let entity = s.entities.first(where: { $0.id == id && $0.stage == "built" }) else { continue }
            XCTAssertEqual(entity.category, "Production", id)
            let action = HarbourAction(id: "[\"start\",[\"\(recipe)\"]]", category: "Production", title: "localized title", detail: "", reason: "", enabled: true, destructive: false, goal: nil, partner: nil)
            XCTAssertTrue(action.belongs(to: entity), id)
            let other = HarbourAction(id: "[\"start\",[\"unrelated\"]]", category: "Production", title: "", detail: "", reason: "", enabled: false, destructive: false, goal: nil, partner: nil)
            XCTAssertFalse(other.belongs(to: entity), id)
        }
        let fresh = try EngineRuntime().snapshot()
        XCTAssertEqual(fresh.entities.first { $0.id == "pier" }?.category, "Build")
        let mill = try XCTUnwrap(fresh.entities.first { $0.id == "mill" })
        let matching = fresh.actions.filter { $0.category == mill.category && $0.belongs(to: mill) }
        XCTAssertEqual(matching.count, 1)
        XCTAssertEqual(matching.first?.verb, "Start production")
    }
    func testBayRegistrationMovesOnlyPresentationAndKeepsEveryPlotSelectable() throws {
        let engine = try EngineRuntime()
        try engine.load(Data(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "crews-ready", withExtension: "json"))))
        let saved = try engine.save(), snapshot = try engine.snapshot()
        let scene = HarbourScene(size: CGSize(width: 900, height: 600))
        scene.apply(snapshot, selected: nil); scene.zoom(0.1)
        for entity in snapshot.entities {
            let p = scene.mapPosition(entity)
            XCTAssertTrue(BayLayout.bounds.contains(p), entity.id)
            XCTAssertEqual(scene.site(at: p)?.id, entity.id, "The real site must own its touch target: " + entity.id)
            if entity.id.hasPrefix("plot") { XCTAssertNotEqual(p.x, entity.x) }
        }
        XCTAssertEqual(try engine.save(), saved)
        let terrain = try XCTUnwrap(scene.world.childNode(withName: "sheltered-bay"))
        XCTAssertEqual(terrain.children.filter { $0.name?.hasPrefix("bay-terrain") == true }.count, 6)
        XCTAssertNil(scene.world.childNode(withName: "landscape-surround"))
    }
    func testStreetFacingSurvivesConstructionAndBusinessChanges() throws {
        func plot(_ id: String, kind: String, stage: String, level: Int) -> WorldEntity {
            WorldEntity(id: id, zone: "neighbourhood", kind: kind, label: "Plot", stage: stage,
                        x: 270, y: 1030, level: level, ripe: nil, tab: nil, select: nil, artwork: nil)
        }
        for id in ["plot0", "plot1", "plot2", "plot3", "plot4", "plot5"] {
            let empty = plot(id, kind: "home", stage: "unbuilt", level: 0)
            for kind in ["home", "carpenter", "weaver", "sailmaker", "flaxgarden", "square"] {
                for (stage, level) in [("building", 0), ("built", 1), ("built", 2)] {
                    let entity = plot(id, kind: kind, stage: stage, level: level)
                    XCTAssertEqual(BayLayout.position(entity), BayLayout.position(empty))
                    XCTAssertEqual(BayLayout.placement(entity), BayLayout.placement(empty))
                }
            }
        }
        let left = plot("plot0", kind: "home", stage: "built", level: 1)
        let right = plot("plot2", kind: "home", stage: "built", level: 1)
        XCTAssertLessThan(BayLayout.placement(left).xScale, 0)
        XCTAssertGreaterThan(BayLayout.placement(right).xScale, 0)
        XCTAssertLessThan(BayLayout.groundDetail(left, x: 105, y: 0).x, BayLayout.ground(left).x)
        XCTAssertGreaterThan(BayLayout.groundDetail(right, x: 105, y: 0).x, BayLayout.ground(right).x)
        // Clear approach to both stair flights in the painted terrace, in source pixels.
        for id in ["plot0", "plot1", "plot2", "plot3", "plot4", "plot5"] {
            let p = try XCTUnwrap(BayLayout.anchors[id])
            let footprint = CGRect(x: p.x - 48, y: p.y - 16, width: 96, height: 32)
            XCTAssertFalse(footprint.intersects(CGRect(x: 815, y: 220, width: 115, height: 125)))
            XCTAssertFalse(footprint.intersects(CGRect(x: 1175, y: 355, width: 100, height: 70)))
        }
    }
    func testMarketSlotKeepsEveryBusinessOnThePavedSquare() throws {
        var positions = Set<String>()
        for business in ["fishmonger", "kitchen", "exchange", "provisioner"] {
            let entity = WorldEntity(id: business, zone: "market", kind: "market", label: business, stage: "built",
                                     x: 1230, y: 1530, level: 2, ripe: nil, tab: nil, select: nil, artwork: nil)
            let ground = BayLayout.ground(entity)
            let source = CGPoint(x: ground.x / BayLayout.units, y: (BayLayout.size.height - ground.y) / BayLayout.units)
            XCTAssertTrue(CGRect(x: 1000, y: 375, width: 100, height: 50).contains(source), "Market must be below the terrace wall")
            positions.insert("\(ground.x),\(ground.y)")
        }
        XCTAssertEqual(positions.count, 1, "Changing business must not move the market out of its slot")
    }
    func testScaledFacadesKeepGroundDepthAndReachableTouchTargets() throws {
        let engine = try EngineRuntime()
        try engine.load(Data(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "crews-ready", withExtension: "json"))))
        let saved = try engine.save(), snapshot = try engine.snapshot()
        let scene = HarbourScene(size: CGSize(width: 900, height: 600))
        scene.apply(snapshot, selected: "plot0"); scene.zoom(0.1)
        for entity in snapshot.entities where entity.kind != "boat" {
            let sprite = try XCTUnwrap(scene.world.childNode(withName: entity.id))
            XCTAssertEqual(sprite.zRotation, 0, "Walls must remain vertical")
            XCTAssertGreaterThan(sprite.yScale, 0)
            XCTAssertEqual(sprite.position.y - BayLayout.groundOffset * sprite.yScale, BayLayout.ground(entity).y, accuracy: 0.001)
            XCTAssertEqual(sprite.zPosition, BayLayout.size.height - BayLayout.ground(entity).y, accuracy: 0.001)
            XCTAssertEqual(scene.site(at: sprite.position)?.id, entity.id)
        }
        // A mirrored roof remains selectable away from the centre, at close zoom.
        let house = try XCTUnwrap(scene.world.childNode(withName: "plot0"))
        XCTAssertLessThan(house.xScale, 0)
        XCTAssertEqual(scene.site(at: CGPoint(x: house.position.x - 70, y: house.position.y + 50))?.id, "plot0")
        let boat = try XCTUnwrap(scene.world.childNode(withName: "boat0"))
        XCTAssertEqual(boat.xScale, 1); XCTAssertEqual(boat.yScale, 1)
        scene.apply(snapshot, selected: "plot4")
        XCTAssertEqual(house.xScale, -1, "Repeated snapshots must not toggle the facing")
        XCTAssertEqual(try engine.save(), saved)
    }
    func testBayBoatLanesStayInOpenWaterAndRejoinTheCorrectBerth() {
        for slot in 0..<3 {
            for progress in stride(from: 0.0, through: 1.0, by: 0.025) {
                let trip = Boat.Trip(left: (1-progress)*100, duration: 100, route: "quarry", ferry: false)
                let p = VesselPose.at(slot: slot, trip: trip).position
                XCTAssertTrue(BayLayout.bounds.contains(p))
                let x = p.x / 2.5, y = (2560-p.y)/2.5
                XCTAssertGreaterThan(y, 590); XCTAssertLessThan(y, 975)
                XCTAssertTrue(y < 730 || x < 1040, "Keep southbound boats west of the lighthouse breakwater")
            }
            let done = Boat.Trip(left: 0, duration: 100, route: "quarry", ferry: false)
            XCTAssertEqual(VesselPose.at(slot: slot, trip: done).position.x, BayLayout.berth(slot).x, accuracy: 0.001)
            XCTAssertEqual(VesselPose.at(slot: slot, trip: done).position.y, BayLayout.berth(slot).y, accuracy: 0.001)
        }
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
    func testManualCameraSurvivesResizeAndRestoresWithoutChangingTown() throws {
        let domain = "LittleHarbour.CameraTests." + UUID().uuidString
        let preferences = try XCTUnwrap(UserDefaults(suiteName: domain))
        defer { preferences.removePersistentDomain(forName: domain) }
        let engine = try EngineRuntime(), snapshot = try engine.snapshot(), savedTown = try engine.save()
        let scene = HarbourScene(size: CGSize(width: 800, height: 1000))
        scene.configureViewport(preferences: preferences); scene.apply(snapshot, selected: nil)
        scene.focus("market"); scene.zoom(0.5); scene.pan(by: CGPoint(x: -80, y: 120)); scene.persistViewport()
        let position = scene.cameraNode.position, scale = scene.cameraNode.xScale
        scene.size = CGSize(width: 1000, height: 800)
        XCTAssertEqual(scene.cameraNode.position.x, position.x, accuracy: 0.01)
        XCTAssertEqual(scene.cameraNode.position.y, position.y, accuracy: 0.01)
        XCTAssertEqual(scene.cameraNode.xScale, scale, accuracy: 0.01)
        let restored = HarbourScene(size: CGSize(width: 800, height: 1000))
        restored.configureViewport(preferences: preferences); restored.apply(snapshot, selected: nil)
        XCTAssertEqual(restored.cameraNode.position.x, position.x, accuracy: 0.01)
        XCTAssertEqual(restored.cameraNode.position.y, position.y, accuracy: 0.01)
        XCTAssertEqual(restored.cameraNode.xScale, scale, accuracy: 0.01)
        XCTAssertEqual(try engine.save(), savedTown)
    }
    func testWholeTownRefitsAfterResizeAndBadPreferencesFallBack() throws {
        let domain = "LittleHarbour.CameraTests." + UUID().uuidString
        let preferences = try XCTUnwrap(UserDefaults(suiteName: domain))
        defer { preferences.removePersistentDomain(forName: domain) }
        preferences.set(Data("broken".utf8), forKey: "mapViewport")
        let scene = HarbourScene(size: CGSize(width: 800, height: 1000))
        scene.configureViewport(preferences: preferences); scene.apply(try EngineRuntime().snapshot(), selected: nil)
        XCTAssertEqual(MapViewport.decode(preferences.data(forKey: "mapViewport"))?.region, "inland")
        scene.focus("all"); let portraitScale = scene.cameraNode.xScale
        scene.size = CGSize(width: 1000, height: 500)
        XCTAssertGreaterThan(scene.cameraNode.xScale, portraitScale)
        XCTAssertEqual(scene.cameraNode.position.x, 1920, accuracy: 0.01, "A wide view stays inside the continuous bay terrain")
        XCTAssertGreaterThanOrEqual(scene.cameraNode.position.y - scene.size.height * scene.cameraNode.yScale / 2, 0)
        XCTAssertEqual(MapViewport.decode(preferences.data(forKey: "mapViewport"))?.region, "all")
    }
    func testCameraPreferencesRejectUnknownVersionsAndUnsafeCoordinates() throws {
        for value in [
            MapViewport(version: 5, x: 900, y: 1350, scale: 1, region: nil),
            MapViewport(version: 1, x: -1, y: 1350, scale: 1, region: nil),
            MapViewport(version: 1, x: 900, y: 1350, scale: 0, region: nil),
            MapViewport(version: 1, x: 900, y: 1350, scale: 1, region: "unknown")
        ] { XCTAssertNil(MapViewport.decode(try JSONEncoder().encode(value))) }
        XCTAssertNil(MapViewport.decode(Data(repeating: 32, count: 1025)))
        XCTAssertFalse(MapViewport(version: 1, x: .infinity, y: 1350, scale: 1, region: nil).isValid)
    }

    func testPausedCameraRestoresWhenLayoutArrivesAfterSnapshot() throws {
        let domain = "LittleHarbour.CameraTests." + UUID().uuidString
        let preferences = try XCTUnwrap(UserDefaults(suiteName: domain))
        defer { preferences.removePersistentDomain(forName: domain) }
        let viewport = MapViewport(version: 4, x: 900, y: 1350, scale: 2, region: nil)
        preferences.set(try JSONEncoder().encode(viewport), forKey: "mapViewport")
        let engine = try EngineRuntime(); try engine.call("speed", [0])
        let scene = HarbourScene(size: .zero)
        scene.configureViewport(preferences: preferences); scene.apply(try engine.snapshot(), selected: nil)
        var announcedScale: CGFloat?
        scene.onZoomChange = { announcedScale = $0 }
        scene.size = CGSize(width: 400, height: 700)
        XCTAssertEqual(scene.cameraNode.xScale, 2)
        XCTAssertEqual(scene.cameraNode.position.y, 1350, accuracy: 0.01)
        XCTAssertEqual(announcedScale, 2)
    }

    func testLegacyCameraRecentresByDistrictWithoutChangingTown() throws {
        let domain = "LittleHarbour.CameraTests." + UUID().uuidString
        let preferences = try XCTUnwrap(UserDefaults(suiteName: domain))
        defer { preferences.removePersistentDomain(forName: domain) }
        let old = MapViewport(version: 3, x: -2000, y: 3000, scale: 3, region: "market")
        preferences.set(try JSONEncoder().encode(old), forKey: "mapViewport")
        let engine = try EngineRuntime(), saved = try engine.save()
        let scene = HarbourScene(size: CGSize(width: 900, height: 600))
        scene.configureViewport(preferences: preferences); scene.apply(try engine.snapshot(), selected: nil)
        let migrated = try XCTUnwrap(MapViewport.decode(preferences.data(forKey: "mapViewport")))
        XCTAssertEqual(migrated.version, 4); XCTAssertEqual(migrated.region, "market")
        XCTAssertTrue(BayLayout.bounds.contains(scene.cameraNode.position))
        XCTAssertEqual(try engine.save(), saved)
    }
    func testSelectedMapLabelWinsCollisionsRegardlessOfEntityOrder() {
        let overlapping = CGRect(x: 0, y: 0, width: 120, height: 40)
        let candidates: [MapLabelLayout.Candidate] = [
            .init(id: "ordinary", frame: overlapping, priority: 10),
            .init(id: "ready", frame: overlapping, priority: 20),
            .init(id: "selected", frame: overlapping, priority: 100),
            .init(id: "separate", frame: CGRect(x: 200, y: 0, width: 120, height: 40), priority: 10)
        ]
        XCTAssertEqual(MapLabelLayout.visible(candidates), ["selected", "separate"])
        XCTAssertEqual(MapLabelLayout.visible(Array(candidates.reversed())), ["selected", "separate"])
        XCTAssertEqual(MapLabelLayout.visible(Array(candidates.prefix(2))), ["ready"])
    }
    func testEveryEconomicResourceHasPackagedPaintedArtwork() throws {
        for item in Array(goodsNames.keys) + ["coins"] {
            let url = try XCTUnwrap(Bundle.main.url(forResource: "good-" + item, withExtension: "png"), item)
            let image = try XCTUnwrap(UIImage(contentsOfFile: url.path)?.cgImage)
            XCTAssertEqual(image.width, 192, item); XCTAssertEqual(image.height, 192, item)
            XCTAssertNotEqual(image.alphaInfo, .none, item)
        }
    }
    func testSiteDirectoryCameraTargetsTheActualBuilding() throws {
        let snapshot = try EngineRuntime().snapshot(), scene = HarbourScene(size: CGSize(width: 400, height: 700))
        scene.apply(snapshot, selected: nil); scene.focus("all")
        let mill = try XCTUnwrap(snapshot.entities.first { $0.id == "mill" })
        scene.focusSite(mill)
        XCTAssertLessThanOrEqual(scene.cameraNode.xScale, 1.6001)
        XCTAssertEqual(scene.cameraNode.position.x, scene.mapPosition(mill).x, accuracy: 0.01)
        // Keep the full viewport on the map if the site's centre is near an edge.
        XCTAssertLessThan(abs(scene.cameraNode.position.y - scene.mapPosition(mill).y), 560)
    }

    func testWiderMapMigratesOldViewportAndKeepsEconomyUnchanged() throws {
        let old = MapViewport(version: 1, x: 900, y: 1350, scale: 8, region: nil)
        XCTAssertEqual(MapViewport.decode(try JSONEncoder().encode(old)), old)
        let edge = MapViewport(version: 2, x: -250, y: 3000, scale: 16, region: nil)
        XCTAssertEqual(MapViewport.decode(try JSONEncoder().encode(edge)), edge)
        let engine = try EngineRuntime(), before = try engine.save()
        let scene = HarbourScene(size: CGSize(width: 400, height: 700))
        scene.apply(try engine.snapshot(), selected: nil)
        XCTAssertLessThanOrEqual(scene.cameraNode.position.y + scene.size.height * scene.cameraNode.yScale / 2, 2560.01, "Hillside shortcut stays inside the authored ground")
        scene.zoom(100)
        XCTAssertEqual(scene.cameraNode.xScale, 2560 / 700, accuracy: 0.01)
        XCTAssertEqual(scene.cameraNode.position.y, 1280, accuracy: 0.01)
        scene.zoom(0.01); XCTAssertEqual(scene.cameraNode.xScale, 0.5, accuracy: 0.001); scene.pan(by: CGPoint(x: 100000, y: 100000))
        XCTAssertGreaterThanOrEqual(scene.cameraNode.position.x - scene.size.width * scene.cameraNode.xScale / 2, 0)
        XCTAssertLessThanOrEqual(scene.cameraNode.position.y + scene.size.height * scene.cameraNode.yScale / 2, 2560)
        XCTAssertEqual(try engine.save(), before)
    }
    func testPeopleFollowTownDevelopmentPauseAndReducedMotion() throws {
        let engine = try EngineRuntime(), scene = HarbourScene(size: CGSize(width: 400, height: 700))
        scene.apply(try engine.snapshot(), selected: nil)
        XCTAssertEqual(TownResident.routes(in: try engine.snapshot()).count, 2)
        let farmer = try XCTUnwrap(scene.world.childNode(withName: "resident-farmer")), initial = farmer.position
        scene.update(1); scene.update(1.1); XCTAssertNotEqual(farmer.position, initial)
        try engine.call("speed", [0]); scene.apply(try engine.snapshot(), selected: nil)
        let paused = farmer.position; scene.update(2); scene.update(3); XCTAssertEqual(farmer.position, paused)
        try engine.call("speed", [1]); scene.reduceMotion = true; scene.apply(try engine.snapshot(), selected: nil)
        let still = farmer.position; scene.update(4); scene.update(5); XCTAssertEqual(farmer.position, still)
        try engine.load(Data(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json"))))
        scene.apply(try engine.snapshot(), selected: nil)
        XCTAssertGreaterThan(TownResident.routes(in: try engine.snapshot()).count, 2)
        XCTAssertNotNil(scene.world.childNode(withName: "resident-docker"))
        XCTAssertNotNil(scene.world.childNode(withName: "resident-trader"))
    }
    func testBuildingRoofsCanBeSelectedAndEmptySeaCannot() throws {
        let snapshot = try EngineRuntime().snapshot(), scene = HarbourScene(size: CGSize(width: 400, height: 700))
        scene.apply(snapshot, selected: nil); scene.zoom(0.2)
        let mill = try XCTUnwrap(snapshot.entities.first { $0.id == "mill" }), position = scene.mapPosition(mill)
        XCTAssertEqual(scene.site(at: CGPoint(x: position.x, y: position.y + 120))?.id, "mill")
        XCTAssertNil(scene.site(at: CGPoint(x: -250, y: -300)))
    }
    func testGuidePeopleAndDistinctFleetArtworkArePackaged() throws {
        var data = Set<Data>()
        for name in ["guide-elena", "person-farmer", "person-docker", "person-vendor", "vessel-cutter", "vessel-cutter-upgraded", "vessel-coaster", "vessel-coaster-upgraded"] {
            let url = try XCTUnwrap(Bundle.main.url(forResource: name, withExtension: "png"))
            let bytes = try Data(contentsOf: url); data.insert(bytes)
            let image = try XCTUnwrap(UIImage(data: bytes)?.cgImage)
            XCTAssertEqual(image.width, 512); XCTAssertNotEqual(image.alphaInfo, .none)
        }
        for direction in ["outbound", "homebound"] {
            for hull in ["vessel-cutter", "vessel-coaster", "vessel-cutter-upgraded", "vessel-coaster-upgraded"] {
                let url = try XCTUnwrap(Bundle.main.url(forResource: hull + "-" + direction, withExtension: "png"))
                let bytes = try Data(contentsOf: url); data.insert(bytes)
                let image = try XCTUnwrap(UIImage(data: bytes)?.cgImage)
                XCTAssertEqual(image.width, 512); XCTAssertNotEqual(image.alphaInfo, .none)
            }
        }
        XCTAssertEqual(data.count, 16)
    }

    func testNavigatingBoatsFaceTheirTravelDirectionAndResetAtBerth() throws {
        for slot in 0..<2 {
            let engine = try EngineRuntime(), scene = HarbourScene(size: CGSize(width: 800, height: 1000))
            try engine.load(Data(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json"))))
            XCTAssertTrue(try engine.call("act", ["[\"startVoyage\",[\(slot),\"quarry\",1]]"]).toBool())
            let duration = try XCTUnwrap(engine.snapshot().boats[slot]?.trip?.duration)
            try engine.call("tick", [duration * 0.25]); let outbound = try engine.snapshot()
            scene.apply(outbound, selected: "boat\(slot)")
            let sprite = try XCTUnwrap(scene.world.childNode(withName: "boat\(slot)"))
            XCTAssertTrue((sprite.userData?["texture"] as? String)?.hasSuffix("-homebound") == true)
            let outward = try XCTUnwrap(outbound.boats[slot]?.trip), pose = VesselPose.at(slot: slot, trip: outward)
            XCTAssertEqual(sprite.position.x, pose.position.x, accuracy: 0.001)
            XCTAssertEqual(sprite.position.y, pose.position.y, accuracy: 0.001)
            let later = Boat.Trip(left: outward.left - 0.01, duration: duration, route: "quarry", ferry: false)
            let movement = VesselPose.at(slot: slot, trip: later).position
            XCTAssertGreaterThan((movement.x - pose.position.x) * cos(pose.heading) + (movement.y - pose.position.y) * sin(pose.heading), 0)
            XCTAssertEqual(try XCTUnwrap(sprite.childNode(withName: "wake")).zRotation, pose.heading - .pi / 2, accuracy: 0.001)
            try engine.call("tick", [duration * 0.5]); scene.apply(try engine.snapshot(), selected: nil)
            XCTAssertTrue((sprite.userData?["texture"] as? String)?.hasSuffix("-outbound") == true)
            let back = VesselPose.at(slot: slot, trip: try XCTUnwrap(engine.snapshot().boats[slot]?.trip))
            XCTAssertEqual(back.heading - pose.heading, .pi, accuracy: 0.001)
            XCTAssertEqual(sprite.zRotation, 0, "Directional views keep masts upright; never rotate the painted billboard")
            try engine.call("speed", [0]); let paused = sprite.position
            try engine.call("tick", [10]); scene.apply(try engine.snapshot(), selected: nil); XCTAssertEqual(sprite.position, paused)
            scene.reduceMotion = true; scene.apply(try engine.snapshot(), selected: nil)
            XCTAssertNil(sprite.childNode(withName: "wake"))
            XCTAssertEqual(sprite.userData?["texture"] as? String, try engine.snapshot().boats[slot]?.artwork)
            scene.reduceMotion = false; try engine.call("speed", [1]); try engine.call("tick", [duration]); scene.apply(try engine.snapshot(), selected: nil)
            XCTAssertNil(try engine.snapshot().boats[slot]?.trip); XCTAssertNil(sprite.childNode(withName: "wake"))
            XCTAssertEqual(sprite.userData?["texture"] as? String, try engine.snapshot().boats[slot]?.artwork)
        }
    }

}
