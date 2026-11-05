import XCTest

@MainActor final class HarbourUITests: XCTestCase {
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
        let continueGoal = app.buttons["continue-goal"]
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
        XCTAssertTrue(reveal(app.buttons["continue-goal"], in: app))
        XCTAssertTrue(app.staticTexts["Choose what matters today"].exists)
    }

    func testAdvancedWorkshopsMarketAndThirdBoatRemainReachable() throws {
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]
        app.launchEnvironment["LH_TEST_TOWN"] = try String(contentsOf: XCTUnwrap(Bundle(for: Self.self).url(forResource: "long-play-ready", withExtension: "json")), encoding: .utf8)
        app.launch(); XCTAssertTrue(app.buttons["Town"].waitForExistence(timeout: 20))
        app.buttons["Town"].tap()
        let refits = app.buttons["Refits"]
        XCTAssertTrue(revealTownActivity(refits, in: app)); refits.tap()
        let profile = app.segmentedControls["refit-profile"]
        XCTAssertTrue(profile.waitForExistence(timeout: 10))
        XCTAssertTrue(reveal(profile, in: app)); XCTAssertTrue(profile.buttons["Yield"].exists)
        let original = profile.buttons["Original"]
        XCTAssertTrue(reveal(original, in: app)); XCTAssertTrue(original.isEnabled)
        // The iOS 18 failure capture still had Speed selected after tap(). Use
        // the visible child segment's centre and assert selection before scrolling.
        let beforeSelection = XCTAttachment(string: profile.debugDescription)
        beforeSelection.name = "Workshop profile before selection"; beforeSelection.lifetime = .keepAlways; add(beforeSelection)
        original.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
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
        XCTAssertTrue(exchangeOption.waitForExistence(timeout: 5)); exchangeOption.tap()
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
            let frame = list.frame, window = app.windows.firstMatch.frame
            let top = max(frame.minY, bar.frame.maxY) + 8, bottom = min(frame.maxY, window.maxY - 34) - 8
            if element.exists, element.isHittable, element.frame.minY >= top, element.frame.maxY <= bottom { return true }
            let upward = !element.exists || element.frame.maxY > bottom
            let start = list.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
            let step = min(300, max(100, (bottom - top) * 0.45))
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
        app.segmentedControls.buttons["Ready now"].tap()
        XCTAssertTrue(app.buttons["harvest"].waitForExistence(timeout: 5))
        let search = app.textFields["Search actions"]; search.tap(); search.typeText("nothing-matches")
        XCTAssertTrue(app.staticTexts["No matching actions"].waitForExistence(timeout: 5))
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
    func testPausedGuideExplainsHowToResumeAndWholeTownFits() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["fit-town"].waitForExistence(timeout: 20)); app.buttons["fit-town"].tap()
        let map = app.otherElements["world-map"], fitted = map.value as? String
        app.buttons["Zoom out"].tap(); XCTAssertNotEqual(map.value as? String, fitted)
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
