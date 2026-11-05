import XCTest
@testable import LittleHarbour

@MainActor final class TownLibraryTests: XCTestCase {
    func testSeparateCoastsNeverReplaceOriginalAndRetainTheirOwnClocks() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: root) }
        let library = try TownLibrary(root: root), original = try library.repository(for: "original")
        let store = GameStore(repository: original, library: library, arguments: [], environment: [:])
        let before = try original.original()
        store.createCoast(name: "Salina", coast: "marsh")
        XCTAssertEqual(store.coastSlots.count, 2); XCTAssertEqual(store.snapshot?.chronicle.coast, "marsh")
        XCTAssertEqual(store.snapshot?.story.townName, "Salina")
        XCTAssertEqual(try original.original(), before)
        let newID = store.activeCoastID
        store.perform(try XCTUnwrap(store.snapshot?.actions.first { $0.invocation?.0 == "harvestReplant" }))
        let newSave = try store.saves.original()
        store.switchCoast("original"); XCTAssertEqual(try store.saves.original(), before)
        store.switchCoast(newID); XCTAssertEqual(try store.saves.original(), newSave)
        let reopened = try TownLibrary(root: root); XCTAssertEqual(reopened.active, newID)
    }
    func testInvalidIndexAndExternalChangesCannotOverwriteTownMetadata() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: root) }
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        let library = try TownLibrary(root: root), index = root.appendingPathComponent("coasts.json")
        let invalid = Data("{\"version\":99,\"active\":\"original\",\"slots\":[]}".utf8)
        try invalid.write(to: index)
        XCTAssertThrowsError(try library.select("original")); XCTAssertEqual(try Data(contentsOf: index), invalid)
        XCTAssertThrowsError(try TownLibrary(root: root))
        XCTAssertThrowsError(try library.repository(for: "../../other"))
    }
    func testCorruptDestinationDoesNotChangeTheActiveTown() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: root) }
        let library = try TownLibrary(root: root), original = try library.repository(for: "original")
        let store = GameStore(repository: original, library: library, arguments: [], environment: [:])
        let before = try original.original()
        let slot = try library.add(name: "Broken", coast: "windy", data: Data("{}".utf8))
        store.switchCoast(slot.id)
        XCTAssertEqual(store.activeCoastID, "original"); XCTAssertEqual(try original.original(), before)
        XCTAssertFalse(store.protectedSave); XCTAssertNotNil(store.message)
    }
}
