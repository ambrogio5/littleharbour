import Foundation
import JavaScriptCore

enum HarbourError: LocalizedError {
    case message(String)
    var errorDescription: String? { if case .message(let message) = self { return message }; return nil }
}

/// Confined to the main actor; never evaluates downloaded or user-supplied code.
@MainActor final class EngineRuntime {
    private let context: JSContext
    private let api: JSValue
    init(bundle: Bundle = .main) throws {
        guard let url = bundle.url(forResource: "engine-bundle", withExtension: "js"),
              let context = JSContext() else { throw HarbourError.message("The bundled game engine is missing.") }
        self.context = context
        context.evaluateScript(try String(contentsOf: url, encoding: .utf8), withSourceURL: url)
        if let exception = context.exception { throw HarbourError.message(exception.toString() ?? "Engine could not start.") }
        guard let api = context.objectForKeyedSubscript("Harbour"), !api.isUndefined else { throw HarbourError.message("Game engine did not initialise.") }
        self.api = api
    }
    @discardableResult func call(_ name: String, _ arguments: [Any] = []) throws -> JSValue {
        context.exception = nil
        guard let function = api.objectForKeyedSubscript(name), !function.isUndefined,
              let value = function.call(withArguments: arguments) else { throw HarbourError.message("The game action could not run.") }
        if let exception = context.exception { throw HarbourError.message(exception.toString() ?? "The game action failed.") }
        return value
    }
    func load(_ data: Data) throws {
        guard data.count <= 150_000, let text = String(data: data, encoding: .utf8) else { throw HarbourError.message("Choose a Little Harbour save under 150 KB in UTF-8 format.") }
        try call("load", [text])
    }
    func save(browser: Bool = false, legacy: Bool = false) throws -> Data {
        guard let text = try call(legacy ? "legacyBrowserSave" : browser ? "browserSave" : "save").toString(), let data = text.data(using: .utf8) else { throw HarbourError.message("The town could not be encoded.") }
        return data
    }
    func snapshot() throws -> HarbourSnapshot { try decode("snapshot", as: HarbourSnapshot.self) }
    func plan(_ goal: String) throws -> ProjectPlan { try decode("plan", [goal], as: ProjectPlan.self) }
    private func decode<T: Decodable>(_ name: String, _ args: [Any] = [], as: T.Type) throws -> T {
        guard let text = try call(name, args).toString(), let data = text.data(using: .utf8) else { throw HarbourError.message("The game returned an unreadable response.") }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
