import SwiftUI

struct MemoryCard: View {
    let memory: StoryMemory
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(uiImage: HarbourArtwork.image(memory.art)).resizable().scaledToFit().frame(width: 64, height: 72).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 6) {
                Text(memory.dateLabel).font(.caption).foregroundStyle(HarbourTheme.muted)
                Text(memory.title).font(.system(.headline, design: .serif))
                Text(memory.body).font(.subheadline).fixedSize(horizontal: false, vertical: true)
            }
        }.frame(maxWidth: .infinity, alignment: .leading).harbourCard()
    }
}

/// Presentation only: observing/dismissing a chapter never pauses or gates saving.
struct ChapterMoment: View {
    @EnvironmentObject private var store: GameStore
    @AccessibilityFocusState private var focusTitle: Bool
    let memory: StoryMemory
    var body: some View {
        GeometryReader { bounds in
            ZStack {
                Color.black.opacity(0.3).ignoresSafeArea()
                ViewThatFits(in: .vertical) {
                    contents(compact: bounds.size.height < 450).fixedSize(horizontal: false, vertical: true)
                    ScrollView { contents(compact: bounds.size.height < 450) }
                }.frame(maxWidth: 520)
                    .background(HarbourTheme.paper, in: RoundedRectangle(cornerRadius: 20))
                    .padding(12).foregroundStyle(HarbourTheme.ink)
                    .accessibilityElement(children: .contain)
            }
        }.accessibilityIdentifier("chapter-celebration").onAppear { focusTitle = true }
    }
    private func contents(compact: Bool) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Label("CHAPTER \(memory.chapter ?? 0) COMPLETE", systemImage: "checkmark.seal").font(.caption.bold())
                Spacer()
                Button { store.dismissCelebration() } label: { Image(systemName: "xmark").frame(width: 44, height: 44) }.accessibilityLabel("Dismiss chapter celebration")
            }
            HStack(alignment: .center, spacing: 20) {
                Image(uiImage: HarbourArtwork.image("guide-elena")).resizable().scaledToFit().frame(width: 68, height: 96).accessibilityHidden(true)
                Image(uiImage: HarbourArtwork.image(memory.art)).resizable().scaledToFit().frame(maxWidth: .infinity).frame(height: compact ? 80 : 144).accessibilityLabel("Completed " + memory.title)
            }
            Text(memory.title).font(.system(.title2, design: .serif, weight: .semibold)).accessibilityAddTraits(.isHeader).accessibilityFocused($focusTitle).accessibilityIdentifier("celebration-title")
            Text("Elena").font(.caption.bold()).foregroundStyle(HarbourTheme.muted)
            Text(memory.body).font(.body).fixedSize(horizontal: false, vertical: true)
            Button("Continue our story") { store.dismissCelebration() }.buttonStyle(.borderedProminent).tint(HarbourTheme.action).foregroundStyle(.white).frame(minHeight: 44).accessibilityIdentifier("celebration-continue")
        }.padding(18)
    }
}
