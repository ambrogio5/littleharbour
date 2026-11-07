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
                if let title = store.pinnedTitle, !c.started || (store.nextRequest == nil && store.nextProject == nil) {
                    HStack {
                        Label(title, systemImage: "pin.fill").font(.headline)
                        Spacer()
                        Button { store.pin(nil) } label: { Image(systemName: "pin.slash").frame(width: 44, height: 44) }.accessibilityLabel("Unpin goal")
                    }
                    Button("Open " + title) { store.nextPinnedStep() }.frame(minHeight: 44).buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white).accessibilityIdentifier("continue-goal")
                }
                if !c.started {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("YOUR CURRENT GOAL").font(.caption.bold()).foregroundStyle(HarbourTheme.muted)
                        Text(s.guidance.goalTitle ?? s.objective.title).font(.headline).accessibilityIdentifier("goal-outcome")
                        Text("Next: " + s.guidance.title).font(.subheadline.bold()).accessibilityIdentifier("goal-next-action")
                        Text(s.guidance.body).font(.caption)
                        ForEach(s.guidance.requirements) { r in
                            RequirementLine(item: r.item, available: r.available, required: r.required)
                        }
                        Button(s.guidance.waiting ? "See work in progress" : "Go to the next action") { store.pin("guide"); store.followGuidance() }.frame(minHeight: 44)
                    }.harbourCard()
                    Image(uiImage: HarbourArtwork.image("square-upgraded")).resizable().scaledToFit().frame(maxWidth: .infinity).frame(height: 130).accessibilityHidden(true)
                    Text(c.unlocked ? "A new year in Porto Lume" : "Your harbour is taking shape").font(.system(.title2, design: .serif, weight: .semibold))
                    Text(c.unlocked ? "Help familiar neighbours, welcome visitors and choose lasting projects. Accepted requests never expire. Your boats and workshops do the real work." : "Follow Elena’s next step, or choose an ambition. The harbour year opens after your first festival.").font(.subheadline)
                    ForEach(controls("chronicleBegin")) { ManagementAction(action: $0) }
                    Button("Follow Elena") { store.pin("guide"); store.followGuidance() }.frame(minHeight: 44)
                    if s.festival.unlocked { Button("Plan the festival") { store.pin("festival"); store.navigate("Festival") }.frame(minHeight: 44) }
                    DirectionsPanel()
                } else {
                    if section == "Today", let request = store.nextRequest {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(request.accepted ? "YOUR NEXT TASK" : "SUGGESTED NEXT TASK").font(.caption.bold()).tracking(1).foregroundStyle(HarbourTheme.sea)
                            if let pin = c.pin, store.previewGoal == nil, pin != store.nextGoal {
                                Text("Previous goal finished or unavailable.").font(.caption).foregroundStyle(HarbourTheme.muted)
                            }
                            requestCard(request, focused: true)
                        }
                    }
                    if section == "Projects", let project = store.nextProject {
                        Text("YOUR NEXT TASK · STEP \(max(1, project.stage + 1)) OF 4").font(.caption.bold()).foregroundStyle(HarbourTheme.sea)
                        projectCard(project)
                    }
                    Picker("Goal horizon", selection: $section) {
                        Text("Today").tag("Today"); Text("Projects").tag("Projects"); Text("People").tag("People")
                    }.pickerStyle(.segmented).accessibilityIdentifier("goal-horizon")
                    if section == "Today" {
                    HarbourNowView()
                    Text("Other requests · \(c.season), year \(c.year)").font(.subheadline.bold())
                    ForEach(c.offers.filter { $0.goal != store.nextRequest?.goal }) { request in
                        requestCard(request)
                    }
                    }
                    if section == "Projects" {
                    Text("Leave something lasting").font(.system(.title3, design: .serif, weight: .semibold))
                    Text("Two possibilities at a time. Choose one project and a branch; its finished place stays in your town.").font(.caption).foregroundStyle(HarbourTheme.muted)
                    ForEach(c.projects.filter { $0.stage != 4 && $0.id != store.nextProject?.id }) { project in projectCard(project) }
                    if c.households > 0 {
                        DisclosureGroup("Neighbourhood · standing \(c.standing)") {
                            Text("\(c.households) household places, based on built homes and furnishings. Share bread to open the sea wall, bell tower and school projects.").font(.caption).padding(.vertical, 8)
                            ForEach(controls("chronicleHouseholds")) { ManagementAction(action: $0) }
                        }.harbourCard()
                    }
                    CityPortPanel()
                    }
                    DisclosureGroup("How seasons and tasks work") {
                        Text("Accept a request, then follow its next action. Accepted tasks never expire. Only unaccepted offers change next season; supplies and progress stay yours. Time pauses outside the game.").font(.caption)
                        Text("Next season in \(Int(c.remaining) / 60):\(String(format: "%02d", Int(c.remaining) % 60))").font(.caption.monospacedDigit())
                    }.font(.caption)
                    if section == "People" {
                    CrewOverview()
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
            }.onAppear { if let desired = store.preferredGoalSection { section = desired } else if store.nextGoal?.hasPrefix("chronicle:") == true { section = "Projects" } }
            .onChange(of: store.preferredGoalSection) { _, desired in if let desired { section = desired } }
            .onChange(of: store.goalNavigationRevision) { _, _ in section = store.preferredGoalSection ?? "Today" }
            .sheet(isPresented: Binding(get: { selectedPlan != nil }, set: { if !$0 { selectedPlan = nil } })) {
                if let goal = selectedPlan { ProjectView(goal: goal) }
            }
        }
    }
    private func requestCard(_ r: ChronicleState.Request, focused: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack { Text(r.partner.uppercased()).font(.caption.bold()).foregroundStyle(HarbourTheme.sea); Spacer(); if r.accepted { Label("Accepted · kept", systemImage: "checkmark.seal").font(.caption2) } }
            Text(r.title).font(.system(.headline, design: .serif))
            if let choice = r.choice { Text(choice).font(.subheadline.bold()) }
            Text(store.requestInstruction(r)).font(.subheadline.bold()).accessibilityIdentifier(focused ? "next-task-instruction" : "task-instruction-" + r.id)
            // Put the action before descriptive text, so landscape players can start immediately.
            ForEach(controls(r.accepted ? (r.kind == 2 && r.choice == nil ? "chronicleChoose" : "chronicleDeliver") : "chronicleAccept", r.id).filter { !r.accepted || $0.enabled || r.kind == 2 && r.choice == nil }) { action in
                if let cost = action.detail.components(separatedBy: "\n").first, !cost.isEmpty { Text(cost).font(.caption).foregroundStyle(HarbourTheme.muted) }
                Button(action.invocation?.0 == "chronicleAccept" ? "Accept this task" : action.title) { store.perform(action) }
                    .frame(minHeight: 44).buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white)
                    .disabled(store.protectedSave || !action.enabled).accessibilityLabel(action.title).accessibilityIdentifier("action-" + action.id)
            }
            if r.accepted && store.requestAction(r)?.enabled != true {
                if r.kind == 1 {
                    Button(store.voyageProgress(r)?.waiting == true ? "View boats underway" : "Choose the next boat") { store.chooseRequestBoat(r) }.frame(minHeight: 44).buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white).accessibilityIdentifier("task-choose-boat")
                    Text("\(r.boats) / 2 different boats returned. Only passenger services started after accepting count; cargo and recalls do not.").font(.caption)
                    if (store.snapshot?.boats.compactMap { $0 }.count ?? 0) < 2 { Text("You need a second boat. Choose an empty berth to add one.").font(.caption) }
                } else if !r.cost.isEmpty {
                    Button("Find and prepare the supplies") { selectedPlan = r.goal }.frame(minHeight: 44).buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white).accessibilityIdentifier("task-prepare-supplies")
                }
            }
            DisclosureGroup("Task details") {
                Text(r.body).font(.caption).fixedSize(horizontal: false, vertical: true)
                ForEach(controls("chronicleAdvice", r.id)) { ManagementAction(action: $0) }
            }.font(.caption)
            if r.accepted {
                if !r.cost.isEmpty { GoalSupplyChecklist(goal: r.goal) }
                if let progress = store.voyageProgress(r) { VoyageTaskChecklist(progress: progress) }
                HStack {
                    Button(store.snapshot?.chronicle.pin == r.goal ? "Unpin goal" : "Pin goal") { store.pin(store.snapshot?.chronicle.pin == r.goal ? nil : r.goal) }.frame(minHeight: 44)
                    Spacer()
                    if !r.cost.isEmpty { Button("Plan supplies") { selectedPlan = r.goal }.frame(minHeight: 44) }
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
                    Text("Pietra Cove: \(p.transport[i][0]) · Olive Island: \(p.transport[i][1]) · two different boats").font(.caption2).foregroundStyle(HarbourTheme.muted)
                    if let action = controls("chronicleProject", p.id).first(where: { $0.invocation?.1.last as? Int == i }) { ManagementAction(action: action) }
                }
                if p.needsStanding {
                    Text("First share a meal with a built household to earn town standing.").font(.caption)
                    Button("Open neighbourhood") { store.navigate("Neighbourhood") }.frame(minHeight: 44)
                }
            } else {
                Text(p.branches[p.branch]).font(.subheadline.bold())
                if let action = controls("chronicleBuild", p.id).first, action.enabled {
                    ManagementAction(action: action)
                } else if p.stage != 2, let goal = p.goal {
                    Button("Prepare supplies for step \(p.stage + 1)") { selectedPlan = goal }.frame(minHeight: 44).buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white)
                }
                Text("Complete these steps in order").font(.caption.bold())
                ForEach(Array(["Foundation materials", "Workshop supplies", "Two boats returning from both coasts", "Opening supplies"].enumerated()), id: \.offset) { index, label in
                    Label("\(index + 1). \(label)\(index == p.stage ? " · next" : "")", systemImage: index < p.stage ? "checkmark.circle.fill" : index == p.stage ? "arrow.right.circle" : "circle")
                        .font(.caption).foregroundStyle(index == p.stage ? HarbourTheme.ink : HarbourTheme.muted)
                }
                if let goal = p.goal { GoalSupplyChecklist(goal: goal) }
                if p.stage == 2 {
                    Text("\(p.boats) / 2 boats · \(p.routes) / 2 coasts").font(.caption.bold())
                    if let progress = store.voyageProgress(p) { VoyageTaskChecklist(progress: progress) }
                    ForEach(p.missions) { mission in
                        VStack(alignment: .leading, spacing: 4) {
                            Label(mission.title, systemImage: mission.complete ? "checkmark.circle.fill" : mission.passengers ? "person.2" : "shippingbox").font(.subheadline.bold())
                            Button("Choose boat · \(mission.passengers ? "passengers" : "cargo") · \(mission.route == "quarry" ? "Pietra Cove" : "Olive Island")") { store.chooseProjectBoat(p, mission: mission) }.font(.caption.bold()).frame(minHeight: 44)
                        }
                    }
                    if p.routes == 2 && p.boats < 2 { Text("Both coasts are connected. Use a different boat for either listed mission to complete the crew pairing.").font(.caption) }
                }
                HStack {
                    Button(store.snapshot?.chronicle.pin == "chronicle:" + p.id ? "Unpin project" : "Pin project") { store.pin(store.snapshot?.chronicle.pin == "chronicle:" + p.id ? nil : "chronicle:" + p.id) }.frame(minHeight: 44)
                    Spacer()
                    if p.stage == 2 { Button("Choose a boat") { if let mission = p.missions.first(where: { !$0.complete }) ?? p.missions.first { store.chooseProjectBoat(p, mission: mission) } }.frame(minHeight: 44) }
                    else if let goal = p.goal { Button("Plan supplies") { selectedPlan = goal }.frame(minHeight: 44) }
                }.font(.caption.bold())
            }
        }.harbourCard()
    }
}

struct RequirementLine: View {
    let item: String
    let available, required: Int
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: available >= required ? "checkmark.circle.fill" : "circle")
            VStack(alignment: .leading, spacing: 3) {
                Text(goodsNames[item] ?? item.capitalized).font(.caption.bold())
                Text("\(available) / \(required) ready · \(max(0, required - available)) still needed").font(.caption.monospacedDigit())
            }
            Spacer(minLength: 0)
        }.foregroundStyle(HarbourTheme.ink)
    }
}

struct GoalSupplyChecklist: View {
    @EnvironmentObject private var store: GameStore
    let goal: String
    var body: some View {
        if let plan = store.plan(goal), !plan.requirements.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text("Requirements for this step").font(.caption.bold())
                if let crews = store.snapshot?.crews, crews.unlocked > 0, let recipe = plan.recipes.first {
                    Button("Crew help for " + recipe.station) { store.openCrewWorkplace("station:" + recipe.station) }.font(.caption).frame(minHeight: 44)
                    Text("A team helps the whole workshop queue. Finish existing work before moving it here.").font(.caption).foregroundStyle(HarbourTheme.muted)
                }
                ForEach(plan.requirements) { r in
                    RequirementLine(item: r.item, available: r.available, required: r.required)
                    Text("\(r.incoming) already in production").font(.caption.monospacedDigit()).foregroundStyle(HarbourTheme.muted)
                }
            }
        }
    }
}
