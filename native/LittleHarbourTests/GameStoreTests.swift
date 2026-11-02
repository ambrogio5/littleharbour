import XCTest
@testable import LittleHarbour

@MainActor final class GameStoreTests: XCTestCase {
    private func withStore(_ body: (GameStore, SaveRepository) throws -> Void) throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let repository = SaveRepository(directory: directory)
        try body(GameStore(repository: repository, arguments: [], environment: [:]), repository)
    }
    func testInvalidImportClearsPreviousCandidateWithoutChangingSavedTown() throws {
        try withStore { store, repository in
            let before = try repository.original()
            store.previewImport(before); XCTAssertNotNil(store.pendingImport)
            store.previewImport(Data("{broken".utf8))
            XCTAssertNil(store.pendingImport); XCTAssertTrue(store.importSummary.isEmpty)
            store.confirmImport(); XCTAssertEqual(try repository.original(), before)
            XCTAssertFalse(store.protectedSave)
        }
    }
    func testNewTownCancelAndConfirmPreserveOriginalBackup() throws {
        try withStore { store, repository in
            let harvest = try XCTUnwrap(store.snapshot?.actions.first { $0.id == "[\"harvestReplant\",[]]" })
            store.perform(harvest)
            let harvested = try repository.original()
            store.previewNewTown(); store.cancelImport(); store.confirmImport()
            XCTAssertEqual(try repository.original(), harvested)
            store.previewNewTown(); store.confirmImport()
            XCTAssertNil(store.pendingImport); XCTAssertFalse(store.protectedSave)
            XCTAssertNotEqual(try repository.original(), harvested)
            XCTAssertTrue(try repository.backupFiles().contains { try Data(contentsOf: $0) == harvested })
        }
    }
    func testFailedReplacementKeepsLiveTownAndOriginalProtected() throws {
        try withStore { store, repository in
            let before = try repository.original(), coins = store.snapshot?.coins
            try Data("blocked destination".utf8).write(to: repository.backups)
            store.previewNewTown(); store.confirmImport()
            XCTAssertTrue(store.protectedSave); XCTAssertEqual(store.snapshot?.coins, coins)
            XCTAssertEqual(try repository.original(), before)
        }
    }
    func testFutureSaveIsExportableAndExplicitNewTownRecoversWithExactBackup() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let repository = SaveRepository(directory: directory)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let future = Data("{\"nativeVersion\":99}".utf8); try future.write(to: repository.primary)
        let store = GameStore(repository: repository, arguments: [], environment: [:])
        XCTAssertTrue(store.protectedSave)
        let export = try store.export(); defer { try? FileManager.default.removeItem(at: export.deletingLastPathComponent()) }
        XCTAssertEqual(try Data(contentsOf: export), future)
        store.previewNewTown(); store.confirmImport()
        XCTAssertFalse(store.protectedSave); XCTAssertNotNil(store.snapshot)
        XCTAssertEqual(try Data(contentsOf: XCTUnwrap(repository.backupFiles().first)), future)
    }
    func testBackgroundAndModalPauseDoNotAdvanceProduction() throws {
        try withStore { store, repository in
            store.lifecycle(false); let before = try repository.original()
            for _ in 0..<10 { store.pulse() }
            store.flush(); XCTAssertEqual(try repository.original(), before)
            store.lifecycle(true); store.modalOpen = true
            for _ in 0..<10 { store.pulse() }
            store.flush(); XCTAssertEqual(try repository.original(), before)
        }
    }
    func testRapidRepeatDoesNotQueueTwiceButDeliberateRepeatWorks() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        var clock = 10.0
        let store = GameStore(repository: SaveRepository(directory: directory), arguments: [], environment: [:], actionClock: { clock })
        store.perform(try XCTUnwrap(store.snapshot?.actions.first { $0.id == "[\"harvestReplant\",[]]" }))
        let mill = try XCTUnwrap(store.snapshot?.actions.first { $0.id == "[\"start\",[\"mill\"]]" })
        store.perform(mill); XCTAssertEqual(store.snapshot?.jobs.count, 1, "A changed next-action under the same finger cannot fire immediately")
        clock += 0.7; store.perform(mill)
        let once = try store.saves.original(), count = store.snapshot?.jobs.count
        store.perform(mill); XCTAssertEqual(try store.saves.original(), once)
        XCTAssertEqual(store.snapshot?.jobs.count, count)
        clock += 0.7; store.perform(mill)
        XCTAssertEqual(store.snapshot?.jobs.count, (count ?? 0) + 1)
    }
    func testGuideNavigationIsReadOnlyAndFollowsTheNextRealAction() throws {
        try withStore { store, repository in
            let before = try repository.original()
            store.followGuidance()
            XCTAssertTrue(store.guidanceFocus); XCTAssertEqual(store.category, "Production")
            XCTAssertEqual(try repository.original(), before)
            let harvest = try XCTUnwrap(store.snapshot?.actions.first { $0.id == store.snapshot?.guidance.actionID })
            store.perform(harvest)
            XCTAssertEqual(store.snapshot?.guidance.actionID, "[\"start\",[\"mill\"]]")
            store.navigate("Trade"); XCTAssertFalse(store.guidanceFocus); XCTAssertNil(store.selectedSite)
        }
    }

}
