import Foundation

/// Separate native namespace. Failed reads/writes protect the original until explicit recovery.
final class SaveRepository {
    static let maximumBytes = 150_000
    let directory: URL
    var primary: URL { directory.appendingPathComponent("town.native.json") }
    var backups: URL { directory.appendingPathComponent("Backups", isDirectory: true) }
    private(set) var blocked = false
    private var expected: Data?
    private var archiveOnWrite = false
    init(directory: URL) { self.directory = directory }

    /// Read at most the accepted size, even if a document changes after the picker opens it.
    static func readDocument(_ url: URL) throws -> Data {
        let file = try FileHandle(forReadingFrom: url); defer { try? file.close() }
        var data = Data()
        while data.count <= maximumBytes {
            let part = try file.read(upToCount: maximumBytes + 1 - data.count) ?? Data()
            if part.isEmpty { break }
            data.append(part)
        }
        guard data.count <= maximumBytes else { throw HarbourError.message("Choose a Little Harbour save under 150 KB. Your original file has not been changed.") }
        return data
    }
    func read() throws -> Data? {
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            guard FileManager.default.fileExists(atPath: primary.path) else { expected = nil; return nil }
            let data = try Self.readDocument(primary)
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
        guard data.count <= Self.maximumBytes else { throw HarbourError.message("This town exceeds the supported save size. The previous save is protected.") }
        let exists = FileManager.default.fileExists(atPath: primary.path)
        if !replacing {
            let current = exists ? try Self.readDocument(primary) : nil
            guard current == expected else { throw HarbourError.message("The save changed outside this session. It has been protected to prevent overwriting it.") }
            if current == data { return }
        }
        if exists && (replacing || archiveOnWrite) {
            try FileManager.default.createDirectory(at: backups, withIntermediateDirectories: true)
            // Timestamp is encoded by us, avoiding file-timestamp API access and preserving older backups.
            let stamp = Int64(Date().timeIntervalSince1970 * 1000)
            let target = backups.appendingPathComponent("town-\(stamp)-\(UUID().uuidString).json")
            try verifiedCopy(from: primary, to: target)
        }
        try data.write(to: primary, options: .atomic)
        guard try Self.readDocument(primary) == data else { throw HarbourError.message("The saved town could not be verified.") }
        expected = data; archiveOnWrite = false
        protectFile(primary)
    }
    private func protectFile(_ url: URL) {
        #if os(iOS)
        try? FileManager.default.setAttributes([.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: url.path)
        #endif
    }
    /// Copies even oversized/corrupt originals without loading them into memory.
    private func verifiedCopy(from source: URL, to target: URL) throws {
        try FileManager.default.copyItem(at: source, to: target)
        let a = try FileHandle(forReadingFrom: source); defer { try? a.close() }
        let b = try FileHandle(forReadingFrom: target); defer { try? b.close() }
        while true {
            let left = try a.read(upToCount: 64 * 1024) ?? Data()
            let right = try b.read(upToCount: 64 * 1024) ?? Data()
            guard left == right else { throw HarbourError.message("The original town backup could not be verified. Replacement stopped.") }
            if left.isEmpty { break }
        }
        protectFile(target)
    }
    func original() throws -> Data { try Self.readDocument(primary) }
    func exportOriginal(to target: URL) throws { try verifiedCopy(from: primary, to: target) }
    func backupFiles() throws -> [URL] {
        guard FileManager.default.fileExists(atPath: backups.path) else { return [] }
        return try FileManager.default.contentsOfDirectory(at: backups, includingPropertiesForKeys: nil)
            .filter { $0.pathExtension == "json" && $0.lastPathComponent.hasPrefix("town-") }
            .sorted { a, b in
                let ad = Self.backupDate(a) ?? .distantPast, bd = Self.backupDate(b) ?? .distantPast
                return ad == bd ? a.lastPathComponent > b.lastPathComponent : ad > bd
            }
    }
    static func backupDate(_ url: URL) -> Date? {
        let parts = url.deletingPathExtension().lastPathComponent.split(separator: "-")
        guard parts.count > 2, parts[1].count == 13, let milliseconds = Double(parts[1]) else { return nil }
        return Date(timeIntervalSince1970: milliseconds / 1000)
    }
}
