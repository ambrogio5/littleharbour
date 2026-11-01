import Foundation

/// Separate native namespace. Exact originals and every explicit replacement are archived.
/// A failed read/write or unexpected external change locks automatic writes until recovery.
final class SaveRepository {
    let directory: URL
    var primary: URL { directory.appendingPathComponent("town.native.json") }
    var backups: URL { directory.appendingPathComponent("Backups", isDirectory: true) }
    private(set) var blocked = false
    private var expected: Data?
    private var archiveOnWrite = false
    init(directory: URL) { self.directory = directory }
    func read() throws -> Data? {
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            guard FileManager.default.fileExists(atPath: primary.path) else { expected = nil; return nil }
            let data = try Data(contentsOf: primary)
            expected = data; archiveOnWrite = true
            return data
        } catch { blocked = true; throw error }
    }
    func protect() { blocked = true }
    func write(_ data: Data) throws {
        guard !blocked else { throw HarbourError.message("Your original save is protected. Export it or import a compatible town.") }
        do { try commit(data, replacing: false) } catch { blocked = true; throw error }
    }
    func replace(_ data: Data) throws {
        do { try commit(data, replacing: true); blocked = false } catch { blocked = true; throw error }
    }
    private func commit(_ data: Data, replacing: Bool) throws {
        let current = FileManager.default.fileExists(atPath: primary.path) ? try Data(contentsOf: primary) : nil
        guard replacing || current == expected else { throw HarbourError.message("The save changed outside this session. It has been protected to prevent overwriting it.") }
        if current == data { expected = data; return }
        if let original = current, replacing || archiveOnWrite {
            try FileManager.default.createDirectory(at: backups, withIntermediateDirectories: true)
            let target = backups.appendingPathComponent("town-\(UUID().uuidString).json")
            try original.write(to: target, options: .atomic)
            guard try Data(contentsOf: target) == original else { throw HarbourError.message("The original town backup could not be verified. Replacement stopped.") }
        }
        try data.write(to: primary, options: .atomic)
        guard try Data(contentsOf: primary) == data else { throw HarbourError.message("The saved town could not be verified.") }
        expected = data; archiveOnWrite = false
        #if os(iOS)
        try? FileManager.default.setAttributes([.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: primary.path)
        #endif
    }
    func original() throws -> Data { try Data(contentsOf: primary) }
    func backupFiles() throws -> [URL] {
        guard FileManager.default.fileExists(atPath: backups.path) else { return [] }
        return try FileManager.default.contentsOfDirectory(at: backups, includingPropertiesForKeys: [.creationDateKey]).sorted { $0.lastPathComponent < $1.lastPathComponent }
    }
}
