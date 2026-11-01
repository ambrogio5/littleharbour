import XCTest

final class HarbourUITests: XCTestCase {
    func testOpeningProductionNavigationAndSettings() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20))
        app.buttons["nav-Production"].tap()
        let harvest = app.buttons["harvest"]; XCTAssertTrue(harvest.waitForExistence(timeout: 10)); XCTAssertTrue(harvest.isEnabled); harvest.tap()
        XCTAssertFalse(harvest.isEnabled)
        XCTAssertTrue(app.staticTexts["Wheat"].exists)
        if app.buttons["Map"].exists { app.buttons["Map"].tap() }
        app.buttons["nav-Trade"].tap(); XCTAssertTrue(app.staticTexts["Trade"].waitForExistence(timeout: 5))
        if app.buttons["Map"].exists { app.buttons["Map"].tap() }
        app.buttons["Settings and saves"].tap(); XCTAssertTrue(app.buttons["Export native town & evolution"].waitForExistence(timeout: 5))
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "Settings"; screenshot.lifetime = .keepAlways; add(screenshot)
        app.buttons["Done"].tap()
        let map = XCTAttachment(screenshot: app.screenshot()); map.name = "Native map"; map.lifetime = .keepAlways; add(map)
    }
    func testCameraAndAccessibleSitesMenu() throws {
        let app = XCUIApplication(); app.launchArguments = ["--ui-testing"]; app.launch()
        XCTAssertTrue(app.buttons["Zoom in"].waitForExistence(timeout: 20)); app.buttons["Zoom in"].tap(); app.buttons["Zoom out"].tap()
        app.buttons["Sites"].tap(); let site = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Stone mill")).firstMatch
        XCTAssertTrue(site.waitForExistence(timeout: 5)); site.tap()
        XCTAssertTrue(app.staticTexts["Stone mill"].waitForExistence(timeout: 5))
    }
    func testRealSaveSurvivesTerminationAndRelaunch() throws {
        let app = XCUIApplication(); app.launchArguments = ["--persistence-testing", "--reset-test-town"]; app.launch()
        XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20)); app.buttons["nav-Production"].tap()
        let harvest = app.buttons["harvest"]; XCTAssertTrue(harvest.waitForExistence(timeout: 10)); harvest.tap()
        XCTAssertTrue(app.staticTexts["Wheat"].exists)
        if app.buttons["Map"].exists { app.buttons["Map"].tap() }
        app.buttons["Simulation speed"].tap(); app.buttons["Pause"].tap()
        app.terminate(); app.launchArguments = ["--persistence-testing"]; app.launch()
        XCTAssertTrue(app.buttons["nav-Production"].waitForExistence(timeout: 20)); app.buttons["nav-Production"].tap()
        XCTAssertTrue(app.staticTexts["Wheat"].waitForExistence(timeout: 10)); XCTAssertFalse(app.buttons["harvest"].isEnabled)
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
        XCTAssertTrue(app.buttons["nav-Trade"].waitForExistence(timeout: 5)); app.buttons["nav-Trade"].tap()
        XCTAssertTrue(app.staticTexts["Trade"].waitForExistence(timeout: 5))
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "Landscape town and inspector"; screenshot.lifetime = .keepAlways; add(screenshot)
    }

}
