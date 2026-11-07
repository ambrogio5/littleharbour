import SwiftUI

/// Lives beside the existing task board; reviewing work never changes the saved pin.
struct HarbourNowView: View {
    @EnvironmentObject private var store: GameStore
    @State private var expanded = false
    var body: some View {
        if let s = store.snapshot {
            let accepted = s.chronicle.offers.filter(\.accepted)
            let projects = s.chronicle.projects.filter { $0.stage >= 0 && $0.stage < 4 }
            let ready = accepted.filter { store.requestAction($0)?.enabled == true }.count + projects.filter { project in
                s.actions.contains { $0.invocation?.0 == "chronicleBuild" && $0.invocation?.1.first as? String == project.id && $0.enabled }
            }.count
            VStack(alignment: .leading, spacing: 10) {
                Label("Harbour now", systemImage: "list.bullet.clipboard").font(.headline)
                Text(ready > 0 ? "\(ready) task\(ready == 1 ? "" : "s") ready to finish" : "Use the waiting time to prepare another task.").font(.caption).foregroundStyle(HarbourTheme.muted).accessibilityIdentifier("harbour-ready-count")
                DisclosureGroup("Active tasks & work", isExpanded: $expanded) {
                    VStack(alignment: .leading, spacing: 12) {
                        if accepted.isEmpty && projects.isEmpty { Text("No accepted tasks yet. Choose a request below; accepting one never spends its supplies.").font(.caption) }
                        ForEach(accepted) { request in
                            Button { store.openGoal(request.goal) } label: {
                                HStack(alignment: .top) {
                                    Image(systemName: store.requestAction(request)?.enabled == true ? "checkmark.seal.fill" : "list.bullet")
                                    VStack(alignment: .leading, spacing: 4) { Text(request.title).font(.subheadline.bold()); Text(store.requestInstruction(request)).font(.caption) }
                                    Spacer(); Image(systemName: "chevron.right")
                                }.frame(minHeight: 44).contentShape(Rectangle())
                            }.buttonStyle(.plain).accessibilityIdentifier("review-task-" + request.id)
                        }
                        ForEach(projects) { project in
                            Button { store.openGoal("chronicle:" + project.id) } label: {
                                VStack(alignment: .leading, spacing: 4) { Text(project.title).font(.subheadline.bold()); Text("Step \(project.stage + 1) of 4 · review the next contribution").font(.caption) }.frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                            }.buttonStyle(.plain).accessibilityIdentifier("review-project-" + project.id)
                        }
                        Divider()
                        ForEach(s.boats.indices, id: \.self) { slot in
                            if let boat = s.boats[slot] {
                                Button { store.inspectBoat(slot) } label: {
                                    HStack {
                                        Image(uiImage: HarbourArtwork.image(boat.artwork)).resizable().scaledToFit().frame(width: 48, height: 42).accessibilityHidden(true)
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text("Berth \(slot + 1) · \(boat.type.capitalized)").font(.caption.bold())
                                            Text(boat.trip.map { "\(VoyageTaskProgress.destination($0.route)) · \(Int(ceil($0.left))) game seconds left" } ?? "Idle · ready for a mission").font(.caption.monospacedDigit())
                                        }
                                        Spacer()
                                    }.frame(minHeight: 44).contentShape(Rectangle())
                                }.buttonStyle(.plain).accessibilityIdentifier("harbour-boat-\(slot)")
                            }
                        }
                        Button { store.navigate("Queues") } label: {
                            Label("\(s.jobs.count) production batches underway · view queues", systemImage: "gearshape.2").font(.caption.bold()).frame(minHeight: 44)
                        }.accessibilityIdentifier("harbour-production")
                        ForEach(s.workshops.keys.sorted().filter { (s.workshops[$0]?.incoming ?? 0) > 0 }, id: \.self) { key in
                            if let work = s.workshops[key] {
                                Text("\(goodsNames[work.item] ?? work.item.capitalized): \(work.incoming) in production, \(work.stock) stored").font(.caption.monospacedDigit())
                            }
                        }
                    }.padding(.top, 10)
                }
                Text("Trips and production advance only while this town is open and unpaused.").font(.caption2).foregroundStyle(HarbourTheme.muted)
            }.harbourCard()
        }
    }
}

struct VoyageTaskChecklist: View {
    @EnvironmentObject private var store: GameStore
    let progress: VoyageTaskProgress
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if progress.waiting { Label("The required journeys are underway", systemImage: "clock").font(.caption.bold()).accessibilityIdentifier("task-voyages-underway") }
            ForEach(progress.rows) { row in
                VStack(alignment: .leading, spacing: 3) {
                    HStack {
                        Image(systemName: row.state == .complete ? "checkmark.circle.fill" : row.state == .travelling ? "sailboat" : row.state == .busy ? "clock" : "circle")
                        Text("Berth \(row.id + 1)").font(.caption.bold())
                        Spacer()
                        if let left = row.left { Text("\(Int(ceil(left))) game seconds").font(.caption.monospacedDigit()) }
                    }
                    Text(row.detail).font(.caption).foregroundStyle(HarbourTheme.muted).accessibilityIdentifier("task-boat-status-\(row.id)")
                    if let value = row.progress { ProgressView(value: value).tint(HarbourTheme.sea).accessibilityLabel("Berth \(row.id + 1) voyage progress") }
                }.padding(.vertical, 4)
            }
            if !progress.missingRoutes.isEmpty {
                Text("Still to return from: " + progress.missingRoutes.map(VoyageTaskProgress.destination).joined(separator: ", ")).font(.caption)
            }
        }
    }
}
