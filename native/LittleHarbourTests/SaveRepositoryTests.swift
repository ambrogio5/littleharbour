import XCTest
@testable import LittleHarbour

final class SaveRepositoryTests: XCTestCase {
    var directory: URL!
    override func setUpWithError() throws { directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString); try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true) }
    override func tearDownWithError() throws { try FileManager.default.removeItem(at: directory) }
    func testFirstNormalizationArchivesExactBytesAndCheckpointsDoNotMultiplyBackups() throws {
        let store = SaveRepository(directory: directory), original = Data(" { \"version\": 1 } \n".utf8)
        try original.write(to: store.primary); XCTAssertEqual(try store.read(), original)
        try store.write(Data("normalised".utf8)); let backup = try XCTUnwrap(store.backupFiles().first)
        XCTAssertEqual(try Data(contentsOf: backup), original)
        try store.write(Data("checkpoint".utf8)); XCTAssertEqual(try store.backupFiles().count, 1)
    }
    func testProtectedOriginalSurvivesAutomaticWriteAndExplicitRecoveryBacksItUp() throws {
        let store = SaveRepository(directory: directory), original = Data("{\"version\":99}".utf8)
        try original.write(to: store.primary); _ = try store.read(); store.protect()
        XCTAssertThrowsError(try store.write(Data("new".utf8))); XCTAssertEqual(try store.original(), original)
        try store.replace(Data("restored".utf8)); XCTAssertFalse(store.blocked)
        XCTAssertEqual(try Data(contentsOf: XCTUnwrap(store.backupFiles().first)), original)
    }
    func testEmptyOriginalIsBackedUpAndExternalWriteLocks() throws {
        let store = SaveRepository(directory: directory); try Data().write(to: store.primary); _ = try store.read()
        try store.replace(Data("valid".utf8)); XCTAssertEqual(try Data(contentsOf: XCTUnwrap(store.backupFiles().first)), Data())
        try Data("external".utf8).write(to: store.primary)
        XCTAssertThrowsError(try store.write(Data("mine".utf8))); XCTAssertTrue(store.blocked); XCTAssertEqual(try store.original(), Data("external".utf8))
    }
    func testFailedBackupStopsReplacement() throws {
        let store = SaveRepository(directory: directory); try Data("original".utf8).write(to: store.primary); _ = try store.read()
        // A file occupying the backup-directory path simulates an unavailable backup destination.
        try Data("unavailable".utf8).write(to: store.backups)
        XCTAssertThrowsError(try store.replace(Data("replacement".utf8)))
        XCTAssertEqual(try store.original(), Data("original".utf8)); XCTAssertTrue(store.blocked)
    }
    func testOversizedOriginalCanBeExportedAndRecoveredWithoutLosingBytes() throws {
        let store = SaveRepository(directory: directory), original = Data(repeating: 65, count: SaveRepository.maximumBytes + 400_000)
        try original.write(to: store.primary)
        XCTAssertThrowsError(try store.read()); XCTAssertTrue(store.blocked)
        let exported = directory.appendingPathComponent("export.json")
        try store.exportOriginal(to: exported); XCTAssertEqual(try Data(contentsOf: exported), original)
        try store.replace(Data("recovered".utf8))
        XCTAssertFalse(store.blocked)
        XCTAssertEqual(try Data(contentsOf: XCTUnwrap(store.backupFiles().first)), original)
    }
    func testOversizedNewSaveCannotOverwriteValidTown() throws {
        let store = SaveRepository(directory: directory); _ = try store.read()
        try store.write(Data("valid".utf8))
        XCTAssertThrowsError(try store.write(Data(repeating: 65, count: SaveRepository.maximumBytes + 1)))
        XCTAssertEqual(try store.original(), Data("valid".utf8))
    }
    func testBackupDatesSortNewestFirstAndOlderBackupsRemainAvailable() throws {
        let store = SaveRepository(directory: directory)
        try FileManager.default.createDirectory(at: store.backups, withIntermediateDirectories: true)
        let names = ["town-1700000000000-one.json", "town-1800000000000-two.json", "town-00000000-0000-0000-0000-000000000000.json", "unrelated.txt"]
        for name in names { try Data().write(to: store.backups.appendingPathComponent(name)) }
        XCTAssertEqual(try store.backupFiles().map(\.lastPathComponent), [names[1], names[0], names[2]])
        XCTAssertEqual(SaveRepository.backupDate(store.backups.appendingPathComponent(names[0])), Date(timeIntervalSince1970: 1_700_000_000))
        XCTAssertNil(SaveRepository.backupDate(store.backups.appendingPathComponent(names[2])))
    }
}
