import XCTest

@MainActor final class HarbourUITests: XCTestCase {
    func testOpeningProductionNavigationAndSettings() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20))
        app.buttons["nav-Production"].tap()
        let harvest = app.buttons["harvest"]; XCTAssertTrue(harvest.waitForExistence(timeout: 10)); XCTAssertTrue(harvest.isEnabled); harvest.tap()
        XCTAssertFalse(harvest.isEnabled)
        XCTAssertTrue(app.staticTexts["Wheat"].exists)
        if app.buttons["Map"].exists { app.buttons["Map"].tap() }
        app.buttons["nav-Trade"].tap(); XCTAssertTrue(app.staticTexts["Trade"].firstMatch.waitForExistence(timeout: 5))
        if app.buttons["Map"].exists { app.buttons["Map"].tap() }
        app.buttons["Settings and saves"].tap(); XCTAssertTrue(app.buttons["Export native town & evolution"].waitForExistence(timeout: 5))
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "Settings"; screenshot.lifetime = .keepAlways; add(screenshot)
        app.buttons["Done"].tap()
        let map = XCTAttachment(screenshot: app.screenshot()); map.name = "Native map"; map.lifetime = .keepAlways; add(map)
    }
    func testCameraAndAccessibleSitesMenu() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["Zoom in"].waitForExistence(timeout: 20)); app.buttons["Zoom in"].tap(); app.buttons["Zoom out"].tap()
        app.buttons["Sites"].tap()
        XCTAssertTrue(app.navigationBars["Town sites"].waitForExistence(timeout: 5))
        let search = app.searchFields.firstMatch; search.tap(); search.typeText("stone")
        let directory = XCTAttachment(screenshot: app.screenshot()); directory.name = "Searchable painted site directory"; directory.lifetime = .keepAlways; add(directory)
        let site = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Stone mill")).firstMatch
        XCTAssertTrue(site.waitForExistence(timeout: 5)); site.tap()
        XCTAssertTrue(app.staticTexts["Stone mill"].waitForExistence(timeout: 5))
    }
    func testRealSaveSurvivesTerminationAndRelaunch() throws {
        let app = XCUIApplication(); app.launchArguments = ["--persistence-testing", "--reset-test-town"]; app.launch()
        XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20)); app.buttons["nav-Production"].tap()
        let harvest = app.buttons["harvest"]; XCTAssertTrue(harvest.waitForExistence(timeout: 10)); harvest.tap()
        let wheat = app.staticTexts["stock-count-wheat"]
        XCTAssertTrue(wheat.waitForExistence(timeout: 5)); let savedWheat = wheat.label
        XCTAssertGreaterThan(Int(savedWheat) ?? 0, 0)
        if app.buttons["Map"].exists { app.buttons["Map"].tap() }
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap()
        let map = app.otherElements["world-map"], initialZoom = app.otherElements["world-map"].value as? String
        app.buttons["Zoom in"].tap()
        XCTAssertNotEqual(map.value as? String, initialZoom, "Paused zoom still updates its accessibility value")
        let savedZoom = map.value as? String
        app.terminate(); app.launchArguments = ["--persistence-testing"]; app.launch()
        XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20))
        XCTAssertEqual(app.otherElements["world-map"].value as? String, savedZoom, "The map restores alongside the saved town")
        app.buttons["nav-Production"].tap()
        XCTAssertTrue(app.staticTexts["stock-count-wheat"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.staticTexts["stock-count-wheat"].label, savedWheat)
    }

    func testPinchPanAndLandscapeLayout() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        let map = app.otherElements["world-map"]
        XCTAssertTrue(map.waitForExistence(timeout: 20))
        let originalZoom = map.value as? String
        map.pinch(withScale: 1.5, velocity: 1)
        XCTAssertNotEqual(map.value as? String, originalZoom)
        map.swipeLeft()
        XCUIDevice.shared.orientation = .landscapeLeft
        defer { XCUIDevice.shared.orientation = .portrait }
        let settled = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            let frame = app.windows.firstMatch.frame
            return frame.width > frame.height && app.buttons["nav-Trade"].isHittable
        }, object: app)
        XCTAssertEqual(XCTWaiter.wait(for: [settled], timeout: 10), .completed)
        app.buttons["nav-Trade"].tap()
        XCTAssertTrue(app.staticTexts["Trade"].firstMatch.waitForExistence(timeout: 5))
        let screenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); screenshot.name = "Landscape town and inspector"; screenshot.lifetime = .keepAlways; add(screenshot)
    }

    func testDevelopedTownFerryUsesRealFleetAndProducesInspectableArt() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        let fixture = Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json")!
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: fixture, encoding: .utf8)
        app.launch()
        XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20))
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap()
        app.buttons["Town"].tap(); app.buttons["Ferry"].tap()
        XCTAssertTrue(app.staticTexts["Ferry"].firstMatch.waitForExistence(timeout: 5))
        let service = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Pietra Cove passenger service")).firstMatch
        // A developed town's inventory can push the service below the visible inspector.
        for _ in 0..<8 {
            if service.exists && service.isHittable { break }
            app.scrollViews.firstMatch.swipeUp()
        }
        XCTAssertTrue(service.exists); XCTAssertTrue(service.isEnabled); service.tap()
        XCTAssertTrue(app.staticTexts.matching(identifier: "voyage-status").firstMatch.waitForExistence(timeout: 5))
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "Developed town with real passenger service"; screenshot.lifetime = .keepAlways; add(screenshot)
    }

    func testReadyFilterSearchAndSiteContext() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20)); app.buttons["nav-Production"].tap()
        app.segmentedControls.buttons["Ready now"].tap()
        XCTAssertTrue(app.buttons["harvest"].waitForExistence(timeout: 5))
        let search = app.textFields["Search actions"]; search.tap(); search.typeText("nothing-matches")
        XCTAssertTrue(app.staticTexts["No matching actions"].waitForExistence(timeout: 5))
        app.buttons["Clear search"].tap()
        XCTAssertTrue(app.buttons["harvest"].exists)
        if app.buttons["Map"].exists { app.buttons["Map"].tap() } else { app.buttons["nav-Production"].tap() }
        app.buttons["Sites"].tap()
        let mill = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Stone mill")).firstMatch
        XCTAssertTrue(mill.waitForExistence(timeout: 5)); mill.tap()
        XCTAssertTrue(app.staticTexts["Stone mill"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.switches["site-filter"].exists)
        XCTAssertFalse(app.buttons["harvest"].exists)
        let keyboardDismissed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.keyboards.firstMatch)
        XCTAssertEqual(XCTWaiter.wait(for: [keyboardDismissed], timeout: 5), .completed, "Selecting a site must restore the map area after action search")
        let screenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); screenshot.name = "Painted site inspector"; screenshot.lifetime = .keepAlways; add(screenshot)
    }

    func testLargeTextStillReachesSettingsAndActions() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing", "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]; app.launch()
        XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20)); XCTAssertTrue(app.buttons["nav-Production"].isHittable)
        app.buttons["nav-Production"].tap()
        let harvest = app.buttons["harvest"]
        for _ in 0..<10 { if harvest.exists && harvest.isHittable { break }; app.scrollViews.firstMatch.swipeUp() }
        XCTAssertTrue(harvest.isHittable); harvest.tap()
        let feedbackGone = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.buttons["Dismiss message"])
        XCTAssertEqual(XCTWaiter.wait(for: [feedbackGone], timeout: 8), .completed)
        let screenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); screenshot.name = "Accessibility text production"; screenshot.lifetime = .keepAlways; add(screenshot)
        if app.buttons["Map"].exists { app.buttons["Map"].tap() }
        app.buttons["Settings and saves"].tap()
        XCTAssertTrue(app.navigationBars["Settings & saves"].waitForExistence(timeout: 5))
    }

    func testPaintedDevelopedMapAndNavigation() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        let fixture = Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json")!
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: fixture, encoding: .utf8)
        app.launch()
        XCTAssertTrue(app.buttons["Explore"].waitForExistence(timeout: 20))
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap()
        app.buttons["Explore"].tap()
        let explore = XCTAttachment(screenshot: app.screenshot()); explore.name = "Painted district guide"; explore.lifetime = .keepAlways; add(explore)
        app.buttons["Home harbour"].tap()
        let coast = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); coast.name = "Painted developed harbour"; coast.lifetime = .keepAlways; add(coast)
        app.buttons["Explore"].tap(); app.buttons["explore-all"].tap()
        let town = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); town.name = "Painted whole town"; town.lifetime = .keepAlways; add(town)
        app.buttons["Explore"].tap(); app.buttons["Working coast"].tap()
        let fleet = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); fleet.name = "Distinct painted working fleet"; fleet.lifetime = .keepAlways; add(fleet)
        app.buttons["nav-Build"].tap()
        XCTAssertTrue(app.staticTexts["Build"].firstMatch.waitForExistence(timeout: 5))
        if app.buttons["Map"].exists { app.buttons["Map"].tap() }
        app.buttons["Town"].tap()
        let activities = XCTAttachment(screenshot: app.screenshot()); activities.name = "Painted town activities"; activities.lifetime = .keepAlways; add(activities)
        let journal = app.buttons["Town journal"]; XCTAssertTrue(journal.waitForExistence(timeout: 5)); journal.tap()
        XCTAssertTrue(app.staticTexts["Town activity"].waitForExistence(timeout: 5))
    }

    func testNewTownRequiresConfirmationAndOffersRecoveryBackup() throws {
        let app = XCUIApplication(); app.launchArguments = ["--persistence-testing", "--reset-test-town"]; app.launch()
        XCTAssertTrue(app.buttons["Settings and saves"].waitForExistence(timeout: 20)); app.buttons["Settings and saves"].tap()
        let newTown = app.buttons["new-town"]
        for _ in 0..<5 { if newTown.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(newTown.isHittable); newTown.tap()
        XCTAssertTrue(app.alerts["Replace this town?"].waitForExistence(timeout: 5))
        app.alerts.buttons["Cancel"].tap(); newTown.tap()
        app.alerts.buttons["Replace with backup"].tap()
        XCTAssertTrue(app.staticTexts["Town ready. Your previous save is kept in Recovery backups."].waitForExistence(timeout: 5))
        let restore = app.buttons["Review restore"].firstMatch
        for _ in 0..<6 { if restore.exists && restore.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(restore.isHittable)
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "Save recovery and dated backups"; screenshot.lifetime = .keepAlways; add(screenshot)
    }

    func testPrivacyIsAvailableOfflineAndLabelsAreAccessible() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["Settings and saves"].waitForExistence(timeout: 20)); app.buttons["Settings and saves"].tap()
        let privacy = app.buttons["Privacy policy"]
        // Older iOS reports partly clipped List rows as hittable, including under
        // the home indicator. Scroll the whole target into the usable viewport.
        func fullyVisible() -> Bool {
            guard privacy.exists, privacy.isHittable else { return false }
            return privacy.frame.minY > app.navigationBars.firstMatch.frame.maxY + 8
                && privacy.frame.maxY < app.windows.firstMatch.frame.maxY - 50
        }
        for _ in 0..<12 {
            if fullyVisible() { break }
            if privacy.exists && privacy.frame.minY < app.navigationBars.firstMatch.frame.maxY + 8 { app.swipeDown(velocity: .slow) }
            else { app.swipeUp(velocity: .slow) }
        }
        XCTAssertTrue(fullyVisible()); privacy.tap()
        XCTAssertTrue(app.navigationBars["Privacy policy"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "Your town belongs to you")).firstMatch.exists)
        try app.performAccessibilityAudit(for: [.sufficientElementDescription, .trait])
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "Offline privacy policy"; screenshot.lifetime = .keepAlways; add(screenshot)
    }

    func testGuideGivesOneNextActionAndTracksProduction() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["objective"].waitForExistence(timeout: 20)); app.buttons["objective"].tap()
        XCTAssertTrue(app.staticTexts["next-step-title"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["next-step-title"].label, "Harvest & replant")
        XCTAssertFalse(app.textFields["Search actions"].exists)
        let before = XCTAttachment(screenshot: app.screenshot()); before.name = "Elena clear next step"; before.lifetime = .keepAlways; add(before)
        let harvest = app.buttons["harvest"]; XCTAssertTrue(harvest.isHittable); harvest.tap()
        XCTAssertEqual(app.staticTexts["next-step-title"].label, "Mill flour")
        XCTAssertFalse(app.buttons["harvest"].exists)
        let after = XCTAttachment(screenshot: app.screenshot()); after.name = "Guide follows the real production chain"; after.lifetime = .keepAlways; add(after)
    }
    func testActivityNavigationSwitchesWithoutReturningToMap() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20)); app.buttons["nav-Production"].tap()
        let trade = app.buttons["inspector-nav-Trade"].exists ? app.buttons["inspector-nav-Trade"] : app.buttons["nav-Trade"]
        trade.tap(); XCTAssertTrue(app.staticTexts["Trade"].firstMatch.waitForExistence(timeout: 5))
        let build = app.buttons["inspector-nav-Build"].exists ? app.buttons["inspector-nav-Build"] : app.buttons["nav-Build"]
        build.tap(); XCTAssertTrue(app.staticTexts["Build"].firstMatch.waitForExistence(timeout: 5))
        let next = app.buttons["toolbar-next-step"].exists ? app.buttons["toolbar-next-step"] : app.buttons["objective"]
        next.tap(); XCTAssertEqual(app.staticTexts["next-step-title"].label, "Harvest & replant")
    }
    func testPausedGuideExplainsHowToResumeAndWholeTownFits() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["fit-town"].waitForExistence(timeout: 20)); app.buttons["fit-town"].tap()
        let map = app.otherElements["world-map"], fitted = map.value as? String
        app.buttons["Zoom out"].tap(); XCTAssertNotEqual(map.value as? String, fitted)
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap(); app.buttons["objective"].tap()
        let resume = app.buttons["guidance-resume"]
        for _ in 0..<4 { if resume.isHittable { break }; app.scrollViews.firstMatch.swipeUp() }
        XCTAssertTrue(resume.isHittable); resume.tap(); XCTAssertFalse(resume.exists)
    }

    func testBoatFirstMissionsAndDenseLandscape() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        let fixture = Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json")!
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: fixture, encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20))
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap()
        XCUIDevice.shared.orientation = .landscapeLeft
        defer { XCUIDevice.shared.orientation = .portrait }
        let landscape = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in app.windows.firstMatch.frame.width > app.windows.firstMatch.frame.height }, object: app)
        XCTAssertEqual(XCTWaiter.wait(for: [landscape], timeout: 10), .completed)
        // The map meets the toolbar and dock; no empty feedback inset reserves a row.
        let mapFrame = app.otherElements["world-map"].frame
        let dockFrame = app.buttons["nav-Production"].frame
        let settingsFrame = app.buttons["Settings and saves"].frame
        XCTAssertLessThanOrEqual(dockFrame.minY - mapFrame.maxY, 3)
        XCTAssertLessThanOrEqual(mapFrame.minY - settingsFrame.maxY, 5)
        XCTAssertGreaterThan(mapFrame.height, app.windows.firstMatch.frame.height * 0.65)
        XCTAssertLessThanOrEqual(app.windows.firstMatch.frame.maxY - dockFrame.maxY, 40, "Only the system home area should remain below the dock")
        app.buttons["fit-town"].tap()
        app.buttons["Town"].tap(); app.buttons["Fleet"].tap()
        let boat = app.buttons["boat-selector-1"]
        XCTAssertTrue(boat.waitForExistence(timeout: 5)); boat.tap()
        XCTAssertFalse(app.staticTexts["voyage-status"].exists, "Selecting a boat only previews missions")
        let overview = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); overview.name = "Dense landscape and expanded coastline"; overview.lifetime = .keepAlways; add(overview)
        let mission = app.buttons["action-[\"startVoyage\",[1,\"quarry\",1]]"]
        for _ in 0..<8 { if mission.exists && mission.isHittable { break }; app.scrollViews.firstMatch.swipeUp() }
        XCTAssertTrue(mission.isEnabled); mission.tap()
        for _ in 0..<8 { if boat.isHittable { break }; app.scrollViews.firstMatch.swipeDown() }
        XCTAssertTrue(boat.label.contains("At sea")); XCTAssertFalse(app.buttons["boat-selector-0"].label.contains("At sea"))
        let sailing = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); sailing.name = "Independent second boat mission"; sailing.lifetime = .keepAlways; add(sailing)
    }
    func testInlineAutomationAndOptionalAmbitions() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        let fixture = Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json")!
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: fixture, encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20))
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap()
        app.buttons["Town"].tap(); app.buttons["town-ambitions"].tap()
        XCTAssertTrue(app.staticTexts["Choose what your harbour becomes"].waitForExistence(timeout: 5))
        let goals = XCTAttachment(screenshot: app.screenshot()); goals.name = "Three optional town ambitions"; goals.lifetime = .keepAlways; add(goals)
        let industry = app.buttons["direction-industry"]
        for _ in 0..<12 { if industry.exists && industry.isHittable { break }; app.scrollViews.firstMatch.swipeUp() }
        XCTAssertTrue(industry.isEnabled); industry.tap()
        let target = app.buttons["automation-field-24"]
        for _ in 0..<12 { if target.exists && target.isHittable { break }; app.scrollViews.firstMatch.swipeUp() }
        XCTAssertTrue(target.isEnabled); target.tap()
        // The ambition advances to flour; the wheat target is stored by the real engine.
        XCTAssertTrue(app.staticTexts["Set a stock target for flour"].waitForExistence(timeout: 5))
        let automation = XCTAttachment(screenshot: app.screenshot()); automation.name = "Automation inside the workshop"; automation.lifetime = .keepAlways; add(automation)
    }

    func testCircuitAndFerryPreviewsKeepTheChosenBoat() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        let fixture = Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json")!
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: fixture, encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20))
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap()
        app.buttons["Town"].tap(); app.buttons["Fleet"].tap()
        let boat = app.buttons["boat-selector-1"]
        XCTAssertTrue(boat.waitForExistence(timeout: 5)); boat.tap()
        XCTAssertTrue(boat.isSelected, "The whole boat card must select its berth")
        let type = app.segmentedControls["mission-type"]
        for _ in 0..<8 { if type.isHittable { break }; app.scrollViews.firstMatch.swipeUp() }
        type.buttons["Circuit"].tap()
        let circuit = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Berth 2: quarry 1"))
        for _ in 0..<8 { if circuit.firstMatch.exists && circuit.firstMatch.isHittable { break }; app.scrollViews.firstMatch.swipeUp() }
        XCTAssertEqual(circuit.count, 1); XCTAssertTrue(circuit.firstMatch.isEnabled)
        for _ in 0..<8 { if type.isHittable { break }; app.scrollViews.firstMatch.swipeDown() }
        type.buttons["Ferry"].tap()
        let ferry = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Berth 2: Pietra Cove passenger service"))
        for _ in 0..<8 { if ferry.firstMatch.exists && ferry.firstMatch.isHittable { break }; app.scrollViews.firstMatch.swipeUp() }
        XCTAssertEqual(ferry.count, 1); XCTAssertTrue(ferry.firstMatch.isEnabled)
        XCTAssertFalse(app.staticTexts["voyage-status"].exists, "Changing mission type must never launch a voyage")
    }

}
