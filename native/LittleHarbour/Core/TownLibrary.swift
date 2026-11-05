import Foundation

/// Slot metadata never replaces the original town. Each coast has its own verified backup history.
final class TownLibrary {
    struct Slot: Codable, Identifiable, Equatable {
        let id, name, coast: String
    }
    private struct Index: Codable {
        var version = 1
        var active = "original"
        var slots = [Slot(id: "original", name: "Original harbour", coast: "harbour")]
    }
    let root: URL
    private let indexURL: URL
    private var index: Index
    private var expected: Data?
    var slots: [Slot] { index.slots }
    var active: String { index.active }
    init(root: URL) throws {
        self.root = root; indexURL = root.appendingPathComponent("coasts.json")
        if FileManager.default.fileExists(atPath: indexURL.path) {
            let data = try SaveRepository.readDocument(indexURL)
            let decoded = try JSONDecoder().decode(Index.self, from: data)
            guard decoded.version == 1, (1...16).contains(decoded.slots.count),
                  decoded.slots.first?.id == "original", Set(decoded.slots.map(\.id)).count == decoded.slots.count,
                  decoded.slots.contains(where: { $0.id == decoded.active }),
                  decoded.slots.allSatisfy({ ($0.id == "original" || UUID(uuidString: $0.id) != nil) && !$0.name.isEmpty && $0.name.count <= 40 && ["harbour", "rocky", "marsh", "windy"].contains($0.coast) }) else {
                throw HarbourError.message("The coast library needs a newer app or recovery. Your towns are unchanged.")
            }
            index = decoded; expected = data
        } else { index = Index() }
    }
    func repository(for id: String) throws -> SaveRepository {
        guard slots.contains(where: { $0.id == id }) else { throw HarbourError.message("That coast is no longer in this library.") }
        return SaveRepository(directory: id == "original" ? root : root.appendingPathComponent("Coasts", isDirectory: true).appendingPathComponent(id, isDirectory: true))
    }
    private func commit(_ next: Index) throws {
        let current = FileManager.default.fileExists(atPath: indexURL.path) ? try SaveRepository.readDocument(indexURL) : nil
        guard current == expected else { throw HarbourError.message("The coast library changed outside this session. Reopen the app before switching towns.") }
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        let bytes = try JSONEncoder().encode(next)
        try bytes.write(to: indexURL, options: .atomic)
        guard try SaveRepository.readDocument(indexURL) == bytes else { throw HarbourError.message("The coast library could not be verified.") }
        expected = bytes; index = next
    }
    func select(_ id: String) throws {
        guard slots.contains(where: { $0.id == id }) else { throw HarbourError.message("Choose a coast from your library.") }
        var next = index; next.active = id; try commit(next)
    }
    func add(name: String, coast: String, data: Data) throws -> Slot {
        let name = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard slots.count < 16, !name.isEmpty, name.count <= 40, ["rocky", "marsh", "windy"].contains(coast) else { throw HarbourError.message("Name your new coast using 1–40 characters. The library holds up to 16 towns.") }
        let slot = Slot(id: UUID().uuidString, name: name, coast: coast)
        let repository = SaveRepository(directory: root.appendingPathComponent("Coasts", isDirectory: true).appendingPathComponent(slot.id, isDirectory: true))
        _ = try repository.read(); try repository.write(data)
        var next = index; next.slots.append(slot)
        // Only publish a slot after its town has been atomically written and verified.
        try commit(next); return slot
    }
    func album() -> [ChronicleState.Memory] {
        // Reading another town must not advance its clock or perform a migration write.
        var memories: [ChronicleState.Memory] = []
        for slot in slots {
            guard let repo = try? repository(for: slot.id), let data = try? SaveRepository.readDocument(repo.primary),
                  let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let chronicle = object["chronicle"] as? [String: Any], let ledger = chronicle["ledger"],
                  let bytes = try? JSONSerialization.data(withJSONObject: ledger), let entries = try? JSONDecoder().decode([ChronicleState.Memory].self, from: bytes) else { continue }
            memories += entries.prefix(32).map { .init(id: slot.id + ":" + $0.id, title: slot.name + " · " + $0.title, body: $0.body, seconds: $0.seconds, season: $0.season) }
        }
        return memories
    }
}
