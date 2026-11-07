import XCTest

@MainActor final class HarbourUITests: XCTestCase {
    private func workflowFixture() throws -> [String: Any] {
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "task-ready", withExtension: "json"))
        return try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
    }
    private func workflowApp(_ raw: [String: Any]) throws -> XCUIApplication {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing", "-ui-test-appearance", "dark"]
        app.launchEnvironment["LH_TEST_TOWN"] = String(decoding: try JSONSerialization.data(withJSONObject: raw), as: UTF8.self)
        app.launch(); XCTAssertTrue(app.buttons["map-goals"].waitForExistence(timeout: 20)); app.buttons["map-goals"].tap()
        return app
    }
    func testSupplyPlanOpensTheExactWorkshopControl() throws {
        XCUIDevice.shared.orientation = .portrait
        var raw = try workflowFixture(), c = raw["chronicle"] as! [String: Any], offers = c["offers"] as! [[String: Any]]
        let i = offers.firstIndex { $0["kind"] as? Int == 0 }!
        offers[i]["accepted"] = true; c["offers"] = offers; c["pin"] = "year:" + (offers[i]["id"] as! String); raw["chronicle"] = c
        var town = raw["town"] as! [String: Any], stock = town["stock"] as! [String: Any]
        stock["planks"] = 0; stock["tiles"] = 0; town["stock"] = stock; raw["town"] = town
        let app = try workflowApp(raw)
        let prepare = app.buttons["task-prepare-supplies"]; XCTAssertTrue(reveal(prepare, in: app)); prepare.tap()
        let queue = app.buttons["plan-queue-production"]; XCTAssertTrue(queue.waitForExistence(timeout: 5)); XCTAssertTrue(queue.isHittable); XCTAssertTrue(queue.isEnabled)
        let workshop = app.buttons["plan-workshop-saw"]
        // On iPad the plan is a centered sheet above the still-visible inspector.
        // Scroll its own container; touching the inspector can dismiss the sheet.
        let planScroll = app.scrollViews.containing(.button, identifier: "plan-queue-production").firstMatch
        XCTAssertTrue(planScroll.waitForExistence(timeout: 5))
        for _ in 0..<6 {
            if workshop.exists && workshop.isHittable && planScroll.frame.contains(workshop.frame) { break }
            planScroll.swipeUp()
        }
        XCTAssertTrue(workshop.isHittable); XCTAssertTrue(planScroll.frame.contains(workshop.frame)); workshop.tap()
        XCTAssertTrue(app.buttons["action-[\"start\",[\"saw\"]]"].waitForExistence(timeout: 5))
        let start = app.buttons["action-[\"start\",[\"saw\"]]"]
        let visible = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == true"), object: start)
        XCTAssertEqual(XCTWaiter.wait(for: [visible], timeout: 5), .completed, "Workshop link must expose the actual production button without scrolling")
        XCTAssertTrue(app.staticTexts["FROM YOUR SUPPLY PLAN"].exists)
        XCTAssertTrue(app.segmentedControls["production-view"].buttons["Make"].isSelected)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Supply plan opens exact workshop"; shot.lifetime = .keepAlways; add(shot)
        let targets = app.segmentedControls["production-view"].buttons["Stock targets"]; XCTAssertTrue(reveal(targets, in: app)); targets.tap()
        XCTAssertFalse(app.staticTexts["FROM YOUR SUPPLY PLAN"].exists, "Stock management must show the whole catalog again")
    }
    func testHarbourNowReviewsOtherWorkWithoutSpending() throws {
        XCUIDevice.shared.orientation = .portrait
        var raw = try workflowFixture(), c = raw["chronicle"] as! [String: Any], offers = c["offers"] as! [[String: Any]]
        for i in offers.indices where offers[i]["kind"] as? Int != 2 { offers[i]["accepted"] = true }
        c["offers"] = offers; c["pin"] = "year:request-2"; raw["chronicle"] = c
        let app = try workflowApp(raw)
        let overview = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Active tasks & work")).firstMatch
        XCTAssertTrue(reveal(overview, in: app)); overview.tap()
        let other = app.buttons["review-task-request-5"]; XCTAssertTrue(reveal(other, in: app)); other.tap()
        XCTAssertTrue(app.staticTexts["next-task-instruction"].label.contains("Deliver"))
        let delivery = app.buttons["action-[\"chronicleDeliver\",[\"request-5\"]]"]
        XCTAssertTrue(delivery.exists); XCTAssertTrue(delivery.isEnabled, "Review must not deliver automatically")
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Review ready work from Harbour now"; shot.lifetime = .keepAlways; add(shot)
    }
    func testVoyageChecklistRecognizesTripsAlreadyUnderway() throws {
        XCUIDevice.shared.orientation = .landscapeLeft
        defer { XCUIDevice.shared.orientation = .portrait }
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "task-voyages", withExtension: "json"))
        let app = try workflowApp(try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any]))
        XCTAssertTrue(app.staticTexts["next-task-instruction"].label.contains("task boats to return"))
        let status = app.staticTexts["task-boat-status-0"]; XCTAssertTrue(reveal(status, in: app)); XCTAssertTrue(status.label.contains("Counts on return"))
        let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); shot.name = "Qualifying voyage checklist"; shot.lifetime = .keepAlways; add(shot)
        app.buttons["map-goals"].tap()
        let view = app.buttons["task-choose-boat"]; XCTAssertTrue(reveal(view, in: app)); XCTAssertEqual(view.label, "View boats underway"); view.tap()
        XCTAssertTrue(app.staticTexts["voyage-status"].waitForExistence(timeout: 5))
    }
    func testExactTaskIsVisibleInLandscapeAndOpensPassengerControls() throws {
        XCUIDevice.shared.orientation = .landscapeLeft
        defer { XCUIDevice.shared.orientation = .portrait }
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing", "-ui-test-appearance", "dark"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "task-ready", withExtension: "json")), encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["map-goals"].waitForExistence(timeout: 20)); app.buttons["map-goals"].tap()
        let accept = app.buttons["action-[\"chronicleAccept\",[\"request-2\"]]"]
        XCTAssertTrue(accept.waitForExistence(timeout: 5)); XCTAssertTrue(accept.isHittable, "The exact next action must be visible without scrolling")
        XCTAssertEqual(app.staticTexts["next-task-instruction"].label, "Accept this request to start")
        let horizon = app.segmentedControls["goal-horizon"]; XCTAssertTrue(reveal(horizon, in: app)); horizon.buttons["People"].tap()
        app.buttons["map-goals"].tap()
        XCTAssertTrue(horizon.buttons["Today"].isSelected)
        XCTAssertTrue(accept.isHittable, "Goals shortcut must return to the exact task from another section")
        let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); shot.name = "Exact next task in landscape"; shot.lifetime = .keepAlways; add(shot)
        accept.tap()
        let choose = app.buttons["task-choose-boat"]; XCTAssertTrue(choose.waitForExistence(timeout: 5))
        let tappable = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == true"), object: choose)
        XCTAssertEqual(XCTWaiter.wait(for: [tappable], timeout: 5), .completed); choose.tap()
        XCTAssertTrue(app.buttons["boat-selector-0"].waitForExistence(timeout: 5))
        let mission = app.segmentedControls["mission-type"]; XCTAssertTrue(reveal(mission, in: app)); XCTAssertTrue(mission.buttons["Ferry"].isSelected)
        XCTAssertTrue(app.buttons["action-[\"startFerryService\",[0,\"quarry\"]]"].exists)
    }
    func testShelteredBayLandmarksZoomAndSiteInteraction() throws {
        XCUIDevice.shared.orientation = .landscapeLeft
        defer { XCUIDevice.shared.orientation = .portrait }
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "crews-ready", withExtension: "json")), encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["Explore"].waitForExistence(timeout: 20))
        // A cold simulator launch may restore portrait after the pre-launch rotation.
        XCUIDevice.shared.orientation = .portrait
        XCUIDevice.shared.orientation = .landscapeLeft
        let landscape = NSPredicate { _, _ in app.frame.width > app.frame.height }
        expectation(for: landscape, evaluatedWith: app)
        waitForExpectations(timeout: 10)
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap()
        if app.buttons["map-expand"].exists { app.buttons["map-expand"].tap() }
        app.buttons["Explore"].tap(); app.buttons["Home harbour"].tap()
        let bay = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); bay.name = "Sheltered Bay working waterfront"; bay.lifetime = .keepAlways; add(bay)
        app.buttons["Explore"].tap()
        let neighbourhood = app.buttons["explore-neighbourhood"]
        if !neighbourhood.exists { app.collectionViews.firstMatch.swipeUp() }
        XCTAssertTrue(neighbourhood.waitForExistence(timeout: 5)); neighbourhood.tap()
        let village = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); village.name = "Street facing terrace groups"; village.lifetime = .keepAlways; add(village)
        app.buttons["Sites"].tap()
        let search = app.searchFields.firstMatch; XCTAssertTrue(search.waitForExistence(timeout: 5)); search.tap(); search.typeText("Bakery")
        let bakery = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Bakery")).firstMatch
        XCTAssertTrue(bakery.waitForExistence(timeout: 5)); bakery.tap()
        XCTAssertTrue(app.staticTexts["Bakery"].firstMatch.waitForExistence(timeout: 5))
        XCTAssertTrue(app.switches["site-filter"].exists)
        if app.buttons["Map"].exists { app.buttons["Map"].tap() } else { app.buttons["nav-Production"].tap() }
        XCTAssertTrue(app.buttons["Zoom in"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.buttons["map-expand"].label, "Show activity panel", "Directory keyboard must not collapse the expanded map")
        app.buttons["Zoom in"].tap()
        let detail = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); detail.name = "Sheltered Bay bakery close view"; detail.lifetime = .keepAlways; add(detail)
        app.buttons["Explore"].tap(); app.buttons["explore-all"].tap()
        let overview = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); overview.name = "Sheltered Bay overview"; overview.lifetime = .keepAlways; add(overview)
    }
    func testCrewOverviewLandscapeOpensTheDecoratingBench() throws {
        XCUIDevice.shared.orientation = .landscapeLeft
        defer { XCUIDevice.shared.orientation = .portrait }
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "crews-ready", withExtension: "json")), encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["map-goals"].waitForExistence(timeout: 20)); app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap(); app.buttons["map-goals"].tap()
        let horizon = app.segmentedControls["goal-horizon"]; XCTAssertTrue(reveal(horizon, in: app)); horizon.buttons["People"].tap()
        let menu = app.buttons["crew-menu-0"]; XCTAssertTrue(reveal(menu, in: app)); menu.tap()
        let bench = app.buttons["crew-option-0-bench"]; XCTAssertTrue(bench.waitForExistence(timeout: 5)); bench.tap()
        let link = app.buttons["crew-workplace-0"]; XCTAssertTrue(reveal(link, in: app)); link.tap()
        XCTAssertTrue(horizon.buttons["Projects"].isSelected)
        let group = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Harbour crews")).firstMatch
        XCTAssertTrue(reveal(group, in: app)); group.tap()
        let release = app.buttons["crew-assign-0-bench"]; XCTAssertTrue(reveal(release, in: app)); XCTAssertTrue(release.isEnabled)
        let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); shot.name = "Landscape crew and decorating bench"; shot.lifetime = .keepAlways; add(shot)
    }
    func testCrewAssignmentUsesRealWorkplacesAndLocksWhileWorkIsUnderway() throws {
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "crews-ready", withExtension: "json")), encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["map-goals"].waitForExistence(timeout: 20))
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap(); app.buttons["map-goals"].tap()
        let horizon = app.segmentedControls["goal-horizon"]; XCTAssertTrue(reveal(horizon, in: app)); horizon.buttons["People"].tap()
        let menu = app.buttons["crew-menu-0"]; XCTAssertTrue(reveal(menu, in: app)); menu.tap()
        let workshops = app.buttons["crew-workshops-0"]; XCTAssertTrue(workshops.waitForExistence(timeout: 5)); workshops.tap()
        let choice = app.buttons["crew-option-0-station:mill"]
        XCTAssertTrue(choice.waitForExistence(timeout: 5)); choice.tap()
        XCTAssertTrue(app.staticTexts["crew-overview-0"].label.lowercased().contains("mill"))
        let work = app.buttons["crew-workplace-0"]; XCTAssertTrue(reveal(work, in: app)); work.tap()
        let group = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Harbour crews")).firstMatch
        XCTAssertTrue(reveal(group, in: app)); group.tap()
        let release = app.buttons["crew-assign-0-station:mill"]
        XCTAssertTrue(reveal(release, in: app)); XCTAssertTrue(release.isEnabled)
        let mill = app.buttons["action-[\"start\",[\"mill\"]]"]
        XCTAssertTrue(reveal(mill, in: app)); XCTAssertTrue(mill.isEnabled); mill.tap()
        XCTAssertTrue(reveal(release, in: app)); XCTAssertFalse(release.isEnabled)
        XCTAssertTrue(app.staticTexts["crew-status-0-station:mill"].label.contains("Finish active batches"))
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Crew working at the selected mill"; shot.lifetime = .keepAlways; add(shot)
        let map = app.buttons["Map"]; if map.exists { map.tap() }
        app.buttons["map-goals"].tap(); XCTAssertTrue(reveal(horizon, in: app)); horizon.buttons["People"].tap()
        let second = app.buttons["crew-menu-1"]; XCTAssertTrue(reveal(second, in: app)); second.tap()
        let boats = app.buttons["crew-boats-1"]; XCTAssertTrue(boats.waitForExistence(timeout: 5)); boats.tap()
        let boat = app.buttons["crew-option-1-boat:0"]; XCTAssertTrue(boat.waitForExistence(timeout: 5)); boat.tap()
        let boatWork = app.buttons["crew-workplace-1"]; XCTAssertTrue(reveal(boatWork, in: app)); boatWork.tap()
        XCTAssertTrue(app.buttons["boat-selector-0"].waitForExistence(timeout: 5))
        let boatGroup = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Harbour crews")).firstMatch
        XCTAssertTrue(reveal(boatGroup, in: app)); boatGroup.tap()
        XCTAssertTrue(reveal(app.buttons["crew-assign-1-boat:0"], in: app))
        let fleet = XCTAttachment(screenshot: app.screenshot()); fleet.name = "Crew beside individual boat controls"; fleet.lifetime = .keepAlways; add(fleet)
    }
    func testProductionControlsStayStillWhenStartingWorkAndFeedbackDisappears() throws {
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20)); app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap(); app.buttons["nav-Production"].tap()
        let harvest = app.buttons["harvest"]
        XCTAssertTrue(reveal(harvest, in: app)); harvest.tap()
        if app.buttons["Dismiss message"].exists { app.buttons["Dismiss message"].tap() }
        let mill = app.buttons["action-[\"start\",[\"mill\"]]"]
        XCTAssertTrue(reveal(mill, in: app)); XCTAssertTrue(mill.isEnabled)
        let before = mill.frame
        mill.tap()
        let queued = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label CONTAINS %@", "2 batches"), object: app.staticTexts["production-queue-summary"])
        XCTAssertEqual(XCTWaiter.wait(for: [queued], timeout: 5), .completed)
        XCTAssertEqual(mill.frame.minY, before.minY, accuracy: 2, "Adding a job or changing availability must not shift the production button")
        let feedbackGone = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.buttons["Dismiss message"])
        XCTAssertEqual(XCTWaiter.wait(for: [feedbackGone], timeout: 8), .completed)
        XCTAssertEqual(mill.frame.minY, before.minY, accuracy: 2, "Feedback must not resize the scroll viewport")
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Stable production controls"; shot.lifetime = .keepAlways; add(shot)
    }

    func testAllStockTargetsAndUnifiedBuildingPlansAreReachable() throws {
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "long-play-ready", withExtension: "json")), encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20))
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap(); app.buttons["nav-Production"].tap()
        let view = app.segmentedControls["production-view"]
        XCTAssertTrue(reveal(view, in: app)); view.buttons["Stock targets"].tap()
        let all = app.buttons["all-stock-target-24"]
        XCTAssertTrue(reveal(all, in: app)); XCTAssertTrue(all.isEnabled); all.tap()
        let search = app.textFields["production-search"]
        XCTAssertTrue(reveal(search, in: app)); search.tap(); search.typeText("wheat\n")
        let wheat = app.buttons["stock-target-field"]
        XCTAssertTrue(reveal(wheat, in: app)); XCTAssertEqual(wheat.value as? String, "Keep 24")
        wheat.tap()
        let twelve = app.buttons["stock-target-choice-field-12"]
        XCTAssertTrue(twelve.waitForExistence(timeout: 5)); twelve.tap()
        XCTAssertEqual(wheat.value as? String, "Keep 12")
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "All production stock targets"; shot.lifetime = .keepAlways; add(shot)
        let build = app.buttons["inspector-nav-Build"].exists ? app.buttons["inspector-nav-Build"] : app.buttons["nav-Build"]
        build.tap()
        let buildingSearch = app.textFields["build-search"]
        XCTAssertTrue(reveal(buildingSearch, in: app)); buildingSearch.tap(); buildingSearch.typeText("berth\n")
        let sails = app.buttons["action-[\"refitBoatSails\",[0]]"]
        XCTAssertTrue(reveal(sails, in: app), "Boat equipment must be directly reachable from Build")
        let buildShot = XCTAttachment(screenshot: app.screenshot()); buildShot.name = "Unified building and equipment plans"; buildShot.lifetime = .keepAlways; add(buildShot)
    }

    func testGoalsNameTheOutcomeAndTheNextAction() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["map-goals"].waitForExistence(timeout: 20)); app.buttons["map-goals"].tap()
        XCTAssertTrue(app.staticTexts["goal-outcome"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["goal-next-action"].label.contains("Harvest"))
        let next = app.buttons["Go to the next action"]
        XCTAssertTrue(reveal(next, in: app)); next.tap()
        XCTAssertTrue(app.staticTexts["guidance-goal"].waitForExistence(timeout: 5))
        XCTAssertTrue(reveal(app.buttons["harvest"], in: app))
    }

    func testCoastLibraryCreatesSeparateTownAndRestoresOriginalAcrossRelaunch() throws {
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication()
        app.launchArguments = ["--ui-testing", "--coast-library-testing"]
        app.launchEnvironment["LH_TEST_LIBRARY"] = UUID().uuidString
        app.launch()
        func openLibrary() {
            XCTAssertTrue(app.buttons["Settings and saves"].waitForExistence(timeout: 20)); app.buttons["Settings and saves"].tap()
            let library = app.buttons["coast-library"]
            for _ in 0..<6 { if library.exists && library.isHittable { break }; app.swipeUp() }
            XCTAssertTrue(library.waitForExistence(timeout: 5)); library.tap()
            XCTAssertTrue(app.textFields["town-name-editor"].waitForExistence(timeout: 5))
        }
        openLibrary()
        XCTAssertEqual(app.textFields["town-name-editor"].value as? String, "Porto Lume")
        let create = app.buttons["create-coast"]
        for _ in 0..<8 { if create.exists && create.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(create.isHittable); create.tap()
        for _ in 0..<8 { if app.textFields["town-name-editor"].isHittable { break }; app.swipeDown() }
        XCTAssertEqual(app.textFields["town-name-editor"].value as? String, "A new harbour")
        let original = app.buttons["coast-original"]
        XCTAssertTrue(original.waitForExistence(timeout: 5)); original.tap()
        XCTAssertEqual(app.textFields["town-name-editor"].value as? String, "Porto Lume")
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Separate coast and preserved original"; shot.lifetime = .keepAlways; add(shot)
        app.terminate(); app.launch(); openLibrary()
        XCTAssertEqual(app.textFields["town-name-editor"].value as? String, "Porto Lume")
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "A new harbour")).firstMatch.exists)
    }

    func testCityPartnershipOpensTheSelectedBoatCityMission() throws {
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "city-ready", withExtension: "json")), encoding: .utf8)
        app.launch()
        XCTAssertTrue(app.buttons["fit-town"].waitForExistence(timeout: 20)); app.buttons["fit-town"].tap()
        let coast = XCTAttachment(screenshot: app.screenshot()); coast.name = "Completed civic coast"; coast.lifetime = .keepAlways; add(coast)
        XCTAssertTrue(app.buttons["map-goals"].waitForExistence(timeout: 20)); app.buttons["map-goals"].tap()
        let horizon = app.segmentedControls["goal-horizon"]
        XCTAssertTrue(reveal(horizon, in: app)); horizon.buttons["Projects"].tap()
        let projects = XCTAttachment(screenshot: app.screenshot()); projects.name = "City partnership after the civic projects"; projects.lifetime = .keepAlways; add(projects)
        let choose = app.buttons["choose-city-boat"]
        XCTAssertTrue(reveal(choose, in: app)); choose.tap()
        let mission = app.segmentedControls["mission-type"]
        XCTAssertTrue(reveal(mission, in: app)); XCTAssertTrue(mission.buttons["City"].isSelected)
        XCTAssertTrue(app.staticTexts["Porto Grande · city port"].exists)
        XCTAssertFalse(app.staticTexts["voyage-status"].exists, "Choosing the city mission must not spend cargo or launch a boat")
        let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); shot.name = "City partnership and individual boat mission"; shot.lifetime = .keepAlways; add(shot)
        XCUIDevice.shared.orientation = .landscapeLeft
        defer { XCUIDevice.shared.orientation = .portrait }
        let rotated = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            app.windows.firstMatch.frame.width > app.windows.firstMatch.frame.height && app.buttons.matching(identifier: "boat-selector-1").count == 1 && !app.buttons["toolbar-next-step"].exists
        }, object: app)
        XCTAssertEqual(XCTWaiter.wait(for: [rotated], timeout: 10), .completed)
        XCTAssertTrue(reveal(app.buttons["boat-selector-1"], in: app)); app.buttons["boat-selector-1"].tap()
        XCTAssertTrue(reveal(mission, in: app)); XCTAssertTrue(mission.buttons["City"].isSelected)
    }

    func testHarbourYearGoalRemainsPinnedAcrossBoatBrowsingAndRotation() throws {
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "long-play-ready", withExtension: "json")), encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20)); app.buttons["Town"].tap()
        let goals = app.buttons["town-goals"]; XCTAssertTrue(revealTownActivity(goals, in: app)); goals.tap()
        let begin = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Begin the harbour year")).firstMatch
        XCTAssertTrue(reveal(begin, in: app)); begin.tap()
        let accept = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Accept · Repair the spring landing")).firstMatch
        XCTAssertTrue(reveal(accept, in: app)); let enabled = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: accept); XCTAssertEqual(XCTWaiter.wait(for: [enabled], timeout: 5), .completed); accept.tap()
        let continueGoal = app.staticTexts["next-task-instruction"]
        XCTAssertTrue(reveal(continueGoal, in: app))
        if app.buttons["Map"].exists { app.buttons["Map"].tap() }
        app.buttons["Town"].tap(); XCTAssertTrue(revealTownActivity(app.buttons["Fleet"], in: app)); app.buttons["Fleet"].tap()
        XCTAssertTrue(app.buttons["pinned-goal"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["pinned-goal"].label.contains("Repair the spring landing"))
        XCUIDevice.shared.orientation = .landscapeLeft
        defer { XCUIDevice.shared.orientation = .portrait }
        XCTAssertTrue(app.buttons["map-goals"].waitForExistence(timeout: 10))
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); attachment.name = "Harbour year with retained goal in landscape"; attachment.lifetime = .keepAlways; add(attachment)
        app.buttons["map-goals"].tap()
        XCTAssertTrue(reveal(app.staticTexts["next-task-instruction"], in: app))
        XCTAssertTrue(app.staticTexts["YOUR NEXT TASK"].exists)
    }

    func testAdvancedWorkshopsMarketAndThirdBoatRemainReachable() throws {
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "long-play-ready", withExtension: "json")), encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20))
        app.buttons["Town"].tap()
        let refits = app.buttons["Refits"]
        XCTAssertTrue(revealTownActivity(refits, in: app)); refits.tap()
        let speed = app.buttons["refit-profile-speed"]
        XCTAssertTrue(speed.waitForExistence(timeout: 10))
        XCTAssertTrue(reveal(speed, in: app)); XCTAssertTrue(app.buttons["refit-profile-yield"].exists)
        let original = app.buttons["refit-profile-original"]
        XCTAssertTrue(reveal(original, in: app)); XCTAssertTrue(original.isEnabled)
        XCTAssertGreaterThanOrEqual(original.frame.height, 44)
        original.tap()
        let originalSelected = XCTNSPredicateExpectation(predicate: NSPredicate(format: "selected == true"), object: original)
        XCTAssertEqual(XCTWaiter.wait(for: [originalSelected], timeout: 5), .completed)
        let restore = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Restore original setup")).firstMatch
        XCTAssertTrue(reveal(restore, in: app)); XCTAssertTrue(restore.isEnabled)
        let refitShot = XCTAttachment(screenshot: app.screenshot()); refitShot.name = "Advanced refit choices"; refitShot.lifetime = .keepAlways; add(refitShot)
        if app.buttons["Map"].exists { app.buttons["Map"].tap() }; XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 5)); app.buttons["Town"].tap()
        let market = app.buttons["Market"]
        XCTAssertTrue(revealTownActivity(market, in: app)); market.tap()
        let businesses = app.buttons["market-business"]
        XCTAssertTrue(businesses.waitForExistence(timeout: 10))
        XCTAssertTrue(reveal(businesses, in: app)); businesses.tap()
        let exchangeOption = app.buttons["Plot 3 · Craft exchange"]
        XCTAssertTrue(exchangeOption.waitForExistence(timeout: 5))
        // iOS 18.5 can report an invalid AX activation point for this visible
        // native menu row. Tap its observed centre rather than invoking AX auto-scroll.
        XCTAssertGreaterThan(exchangeOption.frame.height, 1)
        XCTAssertTrue(app.windows.firstMatch.frame.contains(exchangeOption.frame))
        exchangeOption.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertTrue(reveal(app.buttons["market-automation"], in: app))
        XCTAssertTrue(app.buttons["market-automation"].label.contains("Craft exchange"))
        let marketShot = XCTAttachment(screenshot: app.screenshot()); marketShot.name = "Individual market business"; marketShot.lifetime = .keepAlways; add(marketShot)
        if app.buttons["Map"].exists { app.buttons["Map"].tap() }; XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 5)); app.buttons["Town"].tap()
        XCTAssertTrue(revealTownActivity(app.buttons["Fleet"], in: app)); app.buttons["Fleet"].tap()
        let third = app.buttons["boat-selector-2"]
        XCTAssertTrue(third.waitForExistence(timeout: 10))
        XCTAssertTrue(reveal(third, in: app)); third.tap()
        XCTAssertTrue(reveal(app.segmentedControls["mission-type"], in: app))
        XCUIDevice.shared.orientation = .landscapeLeft
        defer { XCUIDevice.shared.orientation = .portrait }
        let landscape = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            let frame = app.windows.firstMatch.frame
            return frame.width > frame.height && third.isHittable && app.segmentedControls["mission-type"].exists
        }, object: app)
        XCTAssertEqual(XCTWaiter.wait(for: [landscape], timeout: 10), .completed)
        XCTAssertTrue(reveal(third, in: app))
        let boatShot = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); boatShot.name = "Three boats in landscape"; boatShot.lifetime = .keepAlways; add(boatShot)
    }

    /// SwiftUI List is a collection/table on older iOS. A row beyond the sheet's
    /// visible bounds can still report hittable, so use real frames and held drags,
    /// just as the inspector helper does for its separate ScrollView.
    private func revealTownActivity(_ element: XCUIElement, in app: XCUIApplication) -> Bool {
        let bar = app.navigationBars["Town activities"]
        guard bar.waitForExistence(timeout: 5) else { return false }
        let list = app.scrollViews["town-activity-grid"]
        guard list.waitForExistence(timeout: 5) else { return false }
        for _ in 0..<20 {
            guard list.exists, bar.exists else {
                let lost = XCTAttachment(screenshot: app.screenshot()); lost.name = "Activity grid left during reveal"; lost.lifetime = .keepAlways; add(lost)
                return false
            }
            let frame = list.frame, window = app.windows.firstMatch.frame
            let top = max(frame.minY, bar.frame.maxY) + 8, bottom = min(frame.maxY, window.maxY - 34) - 8
            guard bottom - top > 60 else { return false }
            let target = element.exists ? element.frame : nil
            if element.exists, element.isHittable, let target, target.minY >= top, target.maxY <= bottom { return true }
            let upward = target.map { $0.maxY > bottom } ?? true
            let maximumStep = min(300, (bottom - top) * 0.4)
            let overrun = target.map { upward ? $0.maxY - bottom : top - $0.minY }
            let step = overrun.map { min(maximumStep, max(24, $0 + 12)) } ?? maximumStep
            // Keep both ends inside the visible intersection. Start in the grid's
            // empty 16-point leading inset: an XCTest press-and-drag that begins on
            // a plain SwiftUI button can activate that button on older iOS instead
            // of scrolling (the retained CI capture opened Goals during the drag).
            let origin = app.windows.firstMatch.coordinate(withNormalizedOffset: .zero)
            let start = origin.withOffset(CGVector(dx: min(window.maxX - 8, max(window.minX + 8, frame.minX + 8)) - window.minX, dy: (top + bottom) / 2 - window.minY))
            start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 0, dy: upward ? -step : step)), withVelocity: .default, thenHoldForDuration: 0.3)
        }
        return false
    }

    private func siteSearch(in app: XCUIApplication) -> XCUIElement {
        let search = app.searchFields.firstMatch
        // Newer compact system sheets collapse searchable into a Search button.
        if !search.waitForExistence(timeout: 1), app.buttons["Search"].exists { app.buttons["Search"].tap() }
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        return search
    }
    func testTownTileDragDoesNotNavigateButDeliberateTapDoes() {
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication()
        for largeText in [false, true] {
            app.launchArguments = ["--ui-testing"] + (largeText ? ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"] : [])
            app.launch(); XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20)); app.buttons["Town"].tap()
            let goal = app.buttons["town-goals"], grid = app.scrollViews["town-activity-grid"]
            XCTAssertTrue(revealTownActivity(goal, in: app))
            let start = goal.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
            start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 0, dy: -110)), withVelocity: .default, thenHoldForDuration: 0.3)
            XCTAssertTrue(grid.exists, "Dragging through a tile must keep the activity menu open")
            XCTAssertTrue(revealTownActivity(goal, in: app)); goal.tap()
            XCTAssertTrue(app.staticTexts["Goals"].firstMatch.waitForExistence(timeout: 5), "A deliberate tap must still open the chosen activity")
            XCTAssertFalse(grid.exists, "The chosen activity replaces the menu on both phone and iPad")
            app.terminate()
        }
    }

    func testBottomControlsUseAvailableHeight() {
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        func checkBottom(_ identifier: String, name: String) {
            let button = app.buttons[identifier]
            XCTAssertTrue(button.waitForExistence(timeout: 20))
            let positioned = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
                let gap = app.windows.firstMatch.frame.maxY - button.frame.maxY
                return gap >= 10 && gap <= 16
            }, object: nil)
            XCTAssertEqual(XCTWaiter.wait(for: [positioned], timeout: 5), .completed,
                           "Bottom controls must use the spare strip while clearing the home gesture. Window: \(app.windows.firstMatch.frame); button: \(button.frame)")
            XCTAssertGreaterThanOrEqual(button.frame.height, 44)
            XCTAssertTrue(button.isHittable)
            let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
        }
        checkBottom("nav-Production", name: "Bottom spacing map")
        app.buttons["nav-Production"].tap()
        if app.buttons["inspector-nav-Production"].waitForExistence(timeout: 2) {
            checkBottom("inspector-nav-Production", name: "Bottom spacing activity")
            app.buttons["inspector-nav-Trade"].tap()
            XCTAssertTrue(app.buttons["inspector-nav-Trade"].isSelected)
            app.buttons["Map"].tap()
        }
    }
    /// The part of the inspector's scroll view a finger can really reach: below the
    /// sheet's navigation bar and above the Production/Trade/Build inset, the feedback
    /// banner and the home area. Those bars are SwiftUI safe-area insets drawn over the
    /// scroll view, so XCUITest still reports content beneath them as hittable and a tap
    /// there lands on the bar instead of the control. iPhone 16 Pro and smaller phones
    /// expose this; Pro Max screens happened to fit the same content.
    private func usableInspectorArea(_ app: XCUIApplication) -> (top: CGFloat, bottom: CGFloat) {
        let scroll = app.scrollViews.firstMatch.frame, window = app.windows.firstMatch.frame
        var top = scroll.minY, bottom = min(scroll.maxY, window.maxY - 34)
        let bar = app.navigationBars.firstMatch
        if bar.exists, bar.frame.maxY > top, bar.frame.maxY < scroll.midY { top = bar.frame.maxY }
        let nextStep = app.buttons["toolbar-next-step"]
        if nextStep.exists { top = max(top, nextStep.frame.maxY + 2) }
        // Read transient overlays from one immutable hierarchy. The toast can expire
        // between a live `exists` and `frame` lookup, which makes XCTest fail even
        // though the app correctly removed it. Keep its occlusion while present.
        if let snapshot = try? app.snapshot() {
            func insetFrames(_ node: XCUIElementSnapshot) -> [CGRect] {
                let matches = node.elementType == .button &&
                    (node.identifier == "inspector-nav-Production" || node.label == "Dismiss message")
                return (matches ? [node.frame] : []) + node.children.flatMap(insetFrames)
            }
            for frame in insetFrames(snapshot) where frame.minY > top {
                bottom = min(bottom, frame.minY - 8)
            }
        } else {
            XCTFail("Could not inspect the visible overlay bounds")
        }
        return (top + 4, bottom)
    }
    private func isFullyRevealed(_ element: XCUIElement, in app: XCUIApplication) -> Bool {
        guard element.exists, element.isHittable else { return false }
        let area = usableInspectorArea(app), frame = element.frame
        return frame.minY >= area.top && (frame.maxY <= area.bottom || frame.height >= area.bottom - area.top)
    }
    /// Scrolls the inspector in bounded steps until `element` lies entirely in the usable
    /// area, in either direction, and holds after each drag so momentum cannot fling the
    /// target past the opposite edge. Returns whether it is really tappable.
    @discardableResult
    private func reveal(_ element: XCUIElement, in app: XCUIApplication, attempts: Int = 14) -> Bool {
        let scroll = app.scrollViews.firstMatch
        // Panels animate in, and the action list is a LazyVStack whose later rows do not
        // exist until scrolled near, so a missing element is scrolled towards, not failed.
        if !element.exists { _ = element.waitForExistence(timeout: 2) }
        for _ in 0..<attempts {
            if isFullyRevealed(element, in: app) { return true }
            let area = usableInspectorArea(app)
            let frame = element.exists ? element.frame : nil
            let upward = frame.map { $0.height >= area.bottom - area.top ? $0.minY > area.top : $0.maxY > area.bottom } ?? true
            let maximumStep = min(max((area.bottom - area.top) * 0.45, 120), 300)
            // Older iOS can place a segmented control just beyond the usable edge.
            // A fixed 120-point minimum then overshoots it in both directions forever.
            // Approach the measured edge in smaller steps; keep the visibility test intact.
            let overrun = frame.map { upward ? ($0.height >= area.bottom - area.top ? $0.minY - area.top : $0.maxY - area.bottom) : area.top - $0.minY }
            let step = overrun.map { min(maximumStep, max(24, $0 + 12)) } ?? maximumStep
            let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
            let end = start.withOffset(CGVector(dx: 0, dy: upward ? -step : step))
            start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .default, thenHoldForDuration: 0.3)
        }
        let failure = XCTAttachment(screenshot: app.screenshot()); failure.name = "Unrevealed control"; failure.lifetime = .keepAlways; add(failure)
        return isFullyRevealed(element, in: app)
    }
    func testDarkAppearancePersistsAndCanReturnToSystem() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["Settings and saves"].waitForExistence(timeout: 20))
        app.buttons["Settings and saves"].tap()
        let picker = app.segmentedControls["appearance-picker"]
        XCTAssertTrue(picker.waitForExistence(timeout: 5)); picker.buttons["Dark"].tap()
        XCTAssertTrue(picker.buttons["Dark"].isSelected)
        let settings = XCTAttachment(screenshot: app.screenshot()); settings.name = "Dark settings and version"; settings.lifetime = .keepAlways; add(settings)
        app.buttons["Done"].tap()
        let map = XCTAttachment(screenshot: app.screenshot()); map.name = "Dark harbour map"; map.lifetime = .keepAlways; add(map)
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["Settings and saves"].waitForExistence(timeout: 20)); app.buttons["Settings and saves"].tap()
        XCTAssertTrue(picker.buttons["Dark"].waitForExistence(timeout: 5)); XCTAssertTrue(picker.buttons["Dark"].isSelected)
        picker.buttons["Light"].tap(); XCTAssertTrue(picker.buttons["Light"].isSelected)
        picker.buttons["System"].tap(); XCTAssertTrue(picker.buttons["System"].isSelected)
        app.buttons["Done"].tap()
    }
    func testFestivalPreparationThemeAndPassengerNavigation() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "festival-ready", withExtension: "json")), encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20)); app.buttons["Town"].tap(); XCTAssertTrue(revealTownActivity(app.buttons["town-festival"], in: app)); app.buttons["town-festival"].tap()
        func tapAction(_ identifier: String) {
            let button = app.buttons[identifier]
            // The previous action's four-second feedback inset changes scroll
            // geometry when it closes. Wait for that transition before locating
            // the next action, rather than tapping a position measured earlier.
            let feedbackGone = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.buttons["Dismiss message"])
            XCTAssertEqual(XCTWaiter.wait(for: [feedbackGone], timeout: 8), .completed)
            XCTAssertTrue(reveal(button, in: app), "\(identifier) must be scrolled clear of the inspector bars before tapping")
            let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: button)
            XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 5), .completed)
            XCTAssertTrue(isFullyRevealed(button, in: app))
            button.tap()
        }
        tapAction("action-[\"festivalPrepare\",[]]")
        tapAction("festival-theme-craft")
        tapAction("action-[\"festivalSupply\",[\"craft\"]]")
        let ferry = app.buttons["festival-ferry"]
        XCTAssertTrue(reveal(ferry, in: app))
        let visitors = XCTAttachment(screenshot: app.screenshot()); visitors.name = "Festival visitor goals"; visitors.lifetime = .keepAlways; add(visitors)
        ferry.tap(); XCTAssertTrue(app.buttons["boat-selector-0"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Ferry"].firstMatch.exists)
    }
    func testFestivalOpeningShowsRequestsJournalAndCourtyardReward() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "festival-opening", withExtension: "json")), encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20)); app.buttons["Town"].tap(); XCTAssertTrue(revealTownActivity(app.buttons["town-festival"], in: app)); app.buttons["town-festival"].tap()
        let open = app.buttons["action-[\"festivalCelebrate\",[\"food\"]]"]
        XCTAssertTrue(reveal(open, in: app), "The opening action must not sit beneath the Production/Trade/Build inset")
        XCTAssertTrue(open.isEnabled); open.tap()
        XCTAssertTrue(app.buttons["celebration-continue"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["celebration-title"].label, "The first harbour festival")
        let celebration = XCTAttachment(screenshot: app.screenshot()); celebration.name = "Elena celebrates the festival"; celebration.lifetime = .keepAlways; add(celebration)
        app.buttons["celebration-continue"].tap()
        XCTAssertTrue(app.staticTexts["festival-orders"].waitForExistence(timeout: 5), "Opening the festival must unlock the request board")
        XCTAssertEqual(app.staticTexts["festival-progress"].label, "4 of 4 stages complete")
        let requests = XCTAttachment(screenshot: app.screenshot()); requests.name = "Unlocked festival requests"; requests.lifetime = .keepAlways; add(requests)
        if app.buttons["Map"].exists {
            app.buttons["Map"].tap()
            let closed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.buttons["Map"])
            XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 5), .completed)
        }
        app.buttons["Sites"].tap(); let search = siteSearch(in: app); search.tap(); search.typeText("Festival")
        let courtyard = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Festival courtyard")).firstMatch
        XCTAssertTrue(courtyard.waitForExistence(timeout: 5)); courtyard.tap()
        XCTAssertTrue(app.staticTexts["Festival"].firstMatch.waitForExistence(timeout: 5))
        if app.buttons["Map"].waitForExistence(timeout: 2) {
            app.buttons["Map"].tap()
            let closed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.buttons["Map"])
            XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 5), .completed)
        }
        let map = XCTAttachment(screenshot: app.screenshot()); map.name = "Decorated festival courtyard"; map.lifetime = .keepAlways; add(map)
        app.buttons["Town"].tap()
        XCTAssertTrue(revealTownActivity(app.buttons["Town journal"], in: app)); app.buttons["Town journal"].tap()
        XCTAssertTrue(app.staticTexts["The first harbour festival"].waitForExistence(timeout: 5))
        let journal = XCTAttachment(screenshot: app.screenshot()); journal.name = "Story journal memories"; journal.lifetime = .keepAlways; add(journal)
    }
    func testChapterCelebrationCanCloseAtAccessibilityTextSize() throws {
        let app = XCUIApplication()
        app.launchArguments = ["--ui-testing", "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "festival-opening", withExtension: "json")), encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20))
        app.buttons["Town"].tap(); XCTAssertTrue(revealTownActivity(app.buttons["town-festival"], in: app)); app.buttons["town-festival"].tap()
        let open = app.buttons["action-[\"festivalCelebrate\",[\"food\"]]"]
        XCTAssertTrue(reveal(open, in: app)); open.tap()
        let close = app.buttons["Dismiss chapter celebration"]
        XCTAssertTrue(close.waitForExistence(timeout: 5)); XCTAssertTrue(close.isHittable)
        XCTAssertGreaterThanOrEqual(close.frame.height, 44)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Chapter celebration accessibility text"; shot.lifetime = .keepAlways; add(shot)
        close.tap(); XCTAssertEqual(app.staticTexts["festival-progress"].label, "4 of 4 stages complete")
    }
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
        let search = siteSearch(in: app); search.tap(); search.typeText("stone")
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
        app.buttons["Town"].tap(); XCTAssertTrue(revealTownActivity(app.buttons["Ferry"], in: app)); app.buttons["Ferry"].tap()
        XCTAssertTrue(app.staticTexts["Ferry"].firstMatch.waitForExistence(timeout: 5))
        let service = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Pietra Cove passenger service")).firstMatch
        // A developed town's inventory can push the service below the visible inspector.
        XCTAssertTrue(reveal(service, in: app))
        XCTAssertTrue(service.isEnabled); service.tap()
        XCTAssertTrue(app.staticTexts.matching(identifier: "voyage-status").firstMatch.waitForExistence(timeout: 5))
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "Developed town with real passenger service"; screenshot.lifetime = .keepAlways; add(screenshot)
    }

    func testReadyFilterSearchAndSiteContext() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20)); app.buttons["nav-Production"].tap()
        XCTAssertTrue(app.buttons["harvest"].waitForExistence(timeout: 5))
        let search = app.textFields["production-search"]; XCTAssertTrue(reveal(search, in: app)); search.tap(); search.typeText("nothing-matches")
        XCTAssertTrue(app.staticTexts["No matching products. Clear the search to see all unlocked recipes."].waitForExistence(timeout: 5))
        if app.buttons["inspector-nav-Production"].exists, app.keyboards.firstMatch.exists {
            XCTAssertLessThanOrEqual(app.buttons["inspector-nav-Production"].frame.maxY, app.keyboards.firstMatch.frame.minY,
                                     "Reclaiming the home strip must not put activity controls under the keyboard")
        }
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
        XCTAssertTrue(reveal(harvest, in: app)); harvest.tap()
        let feedbackGone = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.buttons["Dismiss message"])
        XCTAssertEqual(XCTWaiter.wait(for: [feedbackGone], timeout: 8), .completed)
        let screenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); screenshot.name = "Accessibility text production"; screenshot.lifetime = .keepAlways; add(screenshot)
        if app.buttons["Map"].exists {
            app.buttons["Map"].tap()
            let closed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.buttons["Map"])
            XCTAssertEqual(XCTWaiter.wait(for: [closed], timeout: 5), .completed)
        }
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
        let journal = app.buttons["Town journal"]; XCTAssertTrue(revealTownActivity(journal, in: app)); journal.tap()
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
        let list = app.collectionViews.firstMatch
        for _ in 0..<14 {
            if restore.exists && restore.isHittable { break }
            // Settings is a centred sheet on iPad. Scroll its list in short steps,
            // rather than swiping the whole screen past the recovery section.
            let upward = !restore.exists || restore.frame.maxY > app.navigationBars.firstMatch.frame.maxY
            let start = list.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: upward ? 0.70 : 0.30))
            let end = list.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: upward ? 0.40 : 0.60))
            start.press(forDuration: 0.05, thenDragTo: end)
        }
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
    func testPausedGuideExplainsHowToResumeAndOverviewHonoursZoomBounds() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["fit-town"].waitForExistence(timeout: 20)); app.buttons["fit-town"].tap()
        let map = app.otherElements["world-map"], fitted = map.value as? String
        app.buttons["Zoom in"].tap(); XCTAssertNotEqual(map.value as? String, fitted)
        app.buttons["Zoom out"].tap(); XCTAssertEqual(map.value as? String, fitted)
        for _ in 0..<6 { app.buttons["Zoom out"].tap() }
        let outerLimit = map.value as? String
        app.buttons["Zoom out"].tap(); XCTAssertEqual(map.value as? String, outerLimit, "The camera stops before revealing an unpainted map edge")
        app.buttons["Zoom in"].tap(); XCTAssertNotEqual(map.value as? String, outerLimit)
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap(); app.buttons["objective"].tap()
        let resume = app.buttons["guidance-resume"]
        XCTAssertTrue(reveal(resume, in: app)); resume.tap(); XCTAssertFalse(resume.exists)
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
        XCTAssertLessThanOrEqual(app.windows.firstMatch.frame.maxY - dockFrame.maxY, 16, "The dock should reclaim the spare bottom strip")
        XCTAssertGreaterThanOrEqual(app.windows.firstMatch.frame.maxY - dockFrame.maxY, 10, "Keep the home gesture clear")
        app.buttons["fit-town"].tap()
        app.buttons["Town"].tap(); XCTAssertTrue(revealTownActivity(app.buttons["Fleet"], in: app)); app.buttons["Fleet"].tap()
        let boat = app.buttons["boat-selector-1"]
        XCTAssertTrue(boat.waitForExistence(timeout: 5)); boat.tap()
        XCTAssertFalse(app.staticTexts["voyage-status"].exists, "Selecting a boat only previews missions")
        let overview = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); overview.name = "Dense landscape and expanded coastline"; overview.lifetime = .keepAlways; add(overview)
        let mission = app.buttons["action-[\"startVoyage\",[1,\"quarry\",1]]"]
        XCTAssertTrue(reveal(mission, in: app))
        XCTAssertTrue(mission.isEnabled); mission.tap()
        XCTAssertTrue(reveal(boat, in: app))
        XCTAssertTrue(boat.label.contains("At sea")); XCTAssertFalse(app.buttons["boat-selector-0"].label.contains("At sea"))
        let sailing = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); sailing.name = "Independent second boat mission"; sailing.lifetime = .keepAlways; add(sailing)
    }
    func testInlineAutomationAndOptionalAmbitions() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        let fixture = Bundle(for: Self.self).url(forResource: "late-town", withExtension: "json")!
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: fixture, encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20))
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap()
        app.buttons["Town"].tap(); XCTAssertTrue(revealTownActivity(app.buttons["town-ambitions"], in: app)); app.buttons["town-ambitions"].tap()
        XCTAssertTrue(app.staticTexts["Choose what your harbour becomes"].waitForExistence(timeout: 5))
        let goals = XCTAttachment(screenshot: app.screenshot()); goals.name = "Three optional town ambitions"; goals.lifetime = .keepAlways; add(goals)
        let industry = app.buttons["direction-industry"]
        XCTAssertTrue(reveal(industry, in: app))
        XCTAssertTrue(industry.isEnabled); industry.tap()
        let target = app.buttons["automation-field-24"]
        XCTAssertTrue(reveal(target, in: app), "Keep 24 sits in a lazily built action list and must be scrolled into the usable area")
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
        app.buttons["Town"].tap(); XCTAssertTrue(revealTownActivity(app.buttons["Fleet"], in: app)); app.buttons["Fleet"].tap()
        let boat = app.buttons["boat-selector-1"]
        XCTAssertTrue(boat.waitForExistence(timeout: 5)); boat.tap()
        XCTAssertTrue(boat.isSelected, "The whole boat card must select its berth")
        let type = app.segmentedControls["mission-type"]
        XCTAssertTrue(reveal(type, in: app))
        type.buttons["Circuit"].tap()
        let circuit = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Berth 2: quarry 1"))
        XCTAssertTrue(reveal(circuit.firstMatch, in: app))
        XCTAssertEqual(circuit.count, 1); XCTAssertTrue(circuit.firstMatch.isEnabled)
        XCTAssertTrue(reveal(type, in: app))
        type.buttons["Ferry"].tap()
        let ferry = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Berth 2: Pietra Cove passenger service"))
        XCTAssertTrue(reveal(ferry.firstMatch, in: app))
        XCTAssertEqual(ferry.count, 1); XCTAssertTrue(ferry.firstMatch.isEnabled)
        XCTAssertFalse(app.staticTexts["voyage-status"].exists, "Changing mission type must never launch a voyage")
    }

}
