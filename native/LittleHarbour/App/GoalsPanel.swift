import SwiftUI

/// One home for intention; dispatch and automation stay in their existing site panels.
struct GoalsPanel: View {
    @EnvironmentObject private var store: GameStore
    @State private var section = "Today"
    @State private var selectedPlan: String?
    @State private var showPartners = false
    @State private var showMemories = false
    private var actions: [HarbourAction] { store.snapshot?.actions ?? [] }
    private func controls(_ name: String, _ id: String? = nil) -> [HarbourAction] {
        actions.filter { $0.invocation?.0 == name && (id == nil || $0.invocation?.1.first as? String == id) }
    }
    var body: some View {
        if let s = store.snapshot {
            let c = s.chronicle
            VStack(alignment: .leading, spacing: 16) {
                if let title = store.pinnedTitle {
                    HStack {
                        Label(title, systemImage: "pin.fill").font(.headline)
                        Spacer()
                        Button { store.pin(nil) } label: { Image(systemName: "pin.slash").frame(width: 44, height: 44) }.accessibilityLabel("Unpin goal")
                    }
                    Button("Continue my next step") { store.nextPinnedStep() }.buttonStyle(.borderedProminent).tint(HarbourTheme.action).accessibilityIdentifier("continue-goal")
                }
                if !c.started {
                    Image(uiImage: HarbourArtwork.image("square-upgraded")).resizable().scaledToFit().frame(maxWidth: .infinity).frame(height: 130).accessibilityHidden(true)
                    Text(c.unlocked ? "A new year in Porto Lume" : "Your harbour is taking shape").font(.system(.title2, design: .serif, weight: .semibold))
                    Text(c.unlocked ? "Help familiar neighbours, welcome visitors and choose lasting projects. Accepted requests never expire. Your boats and workshops do the real work." : "Follow Elena’s next step, or choose an ambition. The harbour year opens after your first festival.").font(.subheadline)
                    ForEach(controls("chronicleBegin")) { ManagementAction(action: $0) }
                    Button("Follow Elena") { store.pin("guide"); store.followGuidance() }.frame(minHeight: 44)
                    if s.festival.unlocked { Button("Plan the festival") { store.pin("festival"); store.navigate("Festival") }.frame(minHeight: 44) }
                    DirectionsPanel()
                } else {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("\(c.season.uppercased()) · YEAR \(c.year)").font(.caption.bold()).tracking(1)
                            Text("Choose what matters today").font(.system(.title3, design: .serif, weight: .semibold))
                        }
                        Spacer()
                        Text("\(Int(c.remaining) / 60):\(String(format: "%02d", Int(c.remaining) % 60))").font(.caption.monospacedDigit()).accessibilityLabel("\(Int(c.remaining / 60)) game minutes until next season")
                    }
                    Text("Only unaccepted offers change next season. Accepted work, contributed supplies and reserved goods stay yours. Time pauses outside the game.").font(.caption).foregroundStyle(HarbourTheme.muted)
                    Picker("Goal horizon", selection: $section) {
                        Text("Today").tag("Today"); Text("Projects").tag("Projects"); Text("People").tag("People")
                    }.pickerStyle(.segmented).accessibilityIdentifier("goal-horizon")
                    if section == "Today" {
                    ForEach(c.offers.sorted { $0.accepted && !$1.accepted }) { request in
                        requestCard(request)
                    }
                    }
                    if section == "Projects" {
                    Text("Leave something lasting").font(.system(.title3, design: .serif, weight: .semibold))
                    Text("Two possibilities at a time. Choose one project and a branch; its finished place stays in your town.").font(.caption).foregroundStyle(HarbourTheme.muted)
                    ForEach(c.projects.filter { $0.stage != 4 }) { project in projectCard(project) }
                    if c.households > 0 {
                        DisclosureGroup("Neighbourhood · standing \(c.standing)") {
                            Text("\(c.households) household places, based on built homes and furnishings. Share bread to open the sea wall, bell tower and school projects.").font(.caption).padding(.vertical, 8)
                            ForEach(controls("chronicleHouseholds")) { ManagementAction(action: $0) }
                        }.harbourCard()
                    }
                    CityPortPanel()
                    }
                    if section == "People" {
                    DisclosureGroup("People of Porto Lume", isExpanded: $showPartners) {
                        ForEach(c.partners) { p in
                            VStack(alignment: .leading, spacing: 6) {
                                Text(p.name + " · " + p.role).font(.headline)
                                Text("“\(p.line)”").font(.caption).italic()
                                if p.assigned { Label("Your assigned adviser", systemImage: "person.crop.circle.badge.checkmark").font(.caption.bold()) }
                                ForEach(controls("chroniclePartner", p.id)) { ManagementAction(action: $0) }
                                ForEach(controls("chronicleSpecialist", p.id)) { ManagementAction(action: $0) }
                                ProgressView(value: Double(p.requests), total: Double(p.next ?? max(1, p.requests)))
                                Text(p.next.map { "\(p.requests) requests completed · next relationship step at \($0)" } ?? "A lasting friendship · all five steps reached").font(.caption)
                            }.padding(.vertical, 8)
                        }
                    }.harbourCard()
                    DisclosureGroup("Your harbour chronicle", isExpanded: $showMemories) {
                        if c.memories.isEmpty { Text("New memories will be recorded as your choices are completed.").font(.caption) }
                        ForEach(c.memories) { m in
                            VStack(alignment: .leading, spacing: 5) {
                                Text(m.title).font(.headline); Text(m.body).font(.caption)
                                Text("Year \(m.season / 4 + 1) · \(["Spring", "Summer", "Autumn", "Winter"][m.season % 4]) · game minute \(Int(m.seconds / 60))").font(.caption2).foregroundStyle(HarbourTheme.muted)
                            }.padding(.vertical, 8)
                        }
                    }.harbourCard()
                    DisclosureGroup("Other ambitions") { DirectionsPanel() }
                    }
                }
            }.onAppear { if store.snapshot?.chronicle.pin?.hasPrefix("chronicle:") == true { section = "Projects" } }
            .sheet(isPresented: Binding(get: { selectedPlan != nil }, set: { if !$0 { selectedPlan = nil } })) {
                if let goal = selectedPlan { ProjectView(goal: goal) }
            }
        }
    }
    private func requestCard(_ r: ChronicleState.Request) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack { Text(r.partner.uppercased()).font(.caption.bold()).foregroundStyle(HarbourTheme.sea); Spacer(); if r.accepted { Label("Accepted · kept", systemImage: "checkmark.seal").font(.caption2) } }
            Text(r.title).font(.system(.headline, design: .serif))
            if let choice = r.choice { Text(choice).font(.subheadline.bold()) }
            Text(r.body).font(.caption).fixedSize(horizontal: false, vertical: true)
            if r.accepted && r.kind == 1 { Text("\(r.boats) / 2 different boats have returned").font(.subheadline.bold()) }
            ForEach(controls("chronicleAdvice", r.id)) { ManagementAction(action: $0) }
            ForEach(controls(r.accepted ? (r.kind == 2 && r.choice == nil ? "chronicleChoose" : "chronicleDeliver") : "chronicleAccept", r.id)) { ManagementAction(action: $0) }
            if r.accepted {
                HStack {
                    Button("Pin goal") { store.pin(r.goal) }.frame(minHeight: 44)
                    Spacer()
                    if r.kind == 1 { Button("Choose a boat") { store.pin(r.goal); store.nextPinnedStep() }.frame(minHeight: 44) }
                    else if !r.cost.isEmpty { Button("Plan supplies") { selectedPlan = r.goal }.frame(minHeight: 44) }
                }.font(.caption.bold())
            }
        }.harbourCard()
    }
    private func projectCard(_ p: ChronicleState.Project) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(p.partner.uppercased()).font(.caption.bold()).foregroundStyle(HarbourTheme.sea)
            HStack(spacing: 10) {
                Image(uiImage: HarbourArtwork.image("chronicle-" + p.art + (p.branch == 1 ? "-alternate" : ""))).resizable().scaledToFit().frame(width: 74, height: 74).accessibilityHidden(true)
                Text(p.title).font(.system(.title3, design: .serif, weight: .semibold))
            }
            if p.stage < 0 {
                ForEach(0..<2, id: \.self) { i in
                    Text(p.branches[i]).font(.headline)
                    Text(p.outcomes[i]).font(.caption)
                    Text(zip([12, 24, 36], p.materials[i]).map { "\($0.0) \(goodsNames[$0.1] ?? $0.1)" }.joined(separator: " → ")).font(.caption2).foregroundStyle(HarbourTheme.muted)
                    if let action = controls("chronicleProject", p.id).first(where: { $0.invocation?.1.last as? Int == i }) { ManagementAction(action: action) }
                }
                if p.needsStanding { Text("First share a meal with a built household to earn town standing.").font(.caption) }
            } else {
                Text(p.branches[p.branch]).font(.subheadline.bold())
                ProgressView(value: Double(p.stage), total: 4)
                Text(["Contribute foundation materials", "Contribute workshop supplies", "Return from both coasts with two different boats", "Contribute the opening supplies", "Open to the town"][p.stage]).font(.caption)
                if p.stage == 2 { Text("\(p.boats) / 2 boats · \(p.routes) / 2 coasts").font(.caption.bold()) }
                ForEach(controls("chronicleBuild", p.id)) { ManagementAction(action: $0) }
                HStack {
                    Button("Pin project") { store.pin("chronicle:" + p.id) }.frame(minHeight: 44)
                    Spacer()
                    if p.stage == 2 { Button("Choose a boat") { store.pin("chronicle:" + p.id); store.nextPinnedStep() }.frame(minHeight: 44) }
                    else if let goal = p.goal { Button("Plan supplies") { selectedPlan = goal }.frame(minHeight: 44) }
                }.font(.caption.bold())
            }
        }.harbourCard()
    }
}
