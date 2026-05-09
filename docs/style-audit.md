# Style Audit Report

Generated: 2026-05-07  
Reference: `~/.claude/CLAUDE.md` §Communication, §Writing Style

Categories: `[icon]` = emoji/non-ASCII decoration | `[corp]` = banned corporate phrase |
`[ai-tell]` = banned AI phrase/pattern | `[hedge]` = hedging adjective chain

---

## File: CLAUDE.md

**Session log lines (L27–28)**

- L27 [icon]: `5🔴 9🟡 3🟢` → `5 Blocker / 9 Should-fix / 3 Minor`
- L28 [icon]: `2🔴 7🟡 3🟢` → `2 Blocker / 7 Should-fix / 3 Minor`

**Phase Roadmap table — Status column (L46–54)**

- L46 [icon]: `✅ Done` → `Done`
- L47 [icon]: `🚧 Active` → `Active`
- L48–54 [icon]: `⏭️ Next` / `⏭️` (×7 rows) → `Next` / `Planned`

**qa-review command description (L67)**

- L67 [icon]: `🔴 Blocker / 🟡 Should-fix / 🟢 Minor` → `Blocker / Should-fix / Minor`

**Documentation Map table — Status and Chất lượng columns (L75–88)**

- L75, L76, L78, L80, L83, L85, L86 [icon]: `✅ Done` → `Done`
- L77 [icon]: `🟡 Blockers resolved`, `0🔴 10🟡 3🟢` → `Blockers resolved`, `0 Blocker / 10 Should-fix / 3 Minor`
- L79 [icon]: `🟡 Blockers resolved` → `Blockers resolved`
- L81, L82 [icon]: `⬜ Empty` → `Empty`
- L84 [icon]: `🚧 Template ready` → `Template ready`
- L87, L88 [icon]: `⏭️ Planned` → `Planned`

**Inline text and section headers (L93, L95, L102)**

- L93 [icon]: `SRS blockers ✅ xong` → `SRS blockers resolved`
- L95 [icon]: `### 🔴 Làm ngay` → `### Làm ngay (MUST)`
- L102 [icon]: `### 🟡 Làm song song hoặc ngay sau` → `### Làm song song hoặc ngay sau (SHOULD)`

Total: 0 — violations removed during subsequent session edits (BRD alignment + session log updates, 2026-05-08/09)

---

## File: .claude/rules/docs-general.md

No violations.

---

## File: .claude/rules/srs-format.md

- L44 [icon]: `❌ "System shall be fast"` → `BAD: "System shall be fast"`
- L45 [icon]: `✅ "p95 latency for /api/interview/turn..."` → `GOOD: "p95 latency for /api/interview/turn..."`
- L46 [icon]: `❌ "System shall be secure"` → `BAD: "System shall be secure"`
- L47 [icon]: `✅ "All API endpoints requiring auth..."` → `GOOD: "All API endpoints requiring auth..."`

Note: used as contrast markers (bad vs good examples). No rule carve-out for examples — flagged as violations. `BAD:`/`GOOD:` preserves intent without emoji.

Total: 4 icon violations | 0 corp | 0 ai-tell | 0 hedge
Fixed: 2026-05-09

---

## File: .claude/rules/user-stories.md

No violations.

---

## File: .claude/rules/test-plan.md

No violations.

---

## File: .claude/rules/testing.md

Stub file. No violations.

---

## File: .claude/rules/api.md

Stub file. No violations.

---

## File: .claude/rules/db.md

Stub file. No violations.

---

## File: .claude/rules/security.md

Stub file. No violations.

---

## File: docs/Discovery_Docs/Checklist_Discovery.md

**Instruction header (L8–11)**

- L8 [icon]: `✅ Đạt / ⚠️ Một phần / ❌ Thiếu` → `Đạt / Một phần / Thiếu`
- L9 [icon]: `tỷ lệ ✅ ở cuối mỗi phần` → `tỷ lệ đạt ở cuối mỗi phần`
- L10 [icon]: `trên 30% ❌` → `trên 30% mục Thiếu`
- L11 [icon]: `(★) là tiêu chí cốt lõi` — ★ is non-ASCII → `(*) là tiêu chí cốt lõi`

**Core-criteria markers throughout (~24 lines)**

Lines L19, L28, L49, L78, L92, L123, L153, L160, L168, L193, L227, L266, L304, L328, L347,
L366, L383, L411, L431, L443, L456, L475, L509 [icon]: `(★)` on each core checklist item
→ `(*)` or a `[CORE]` prefix

Total: 27 lines with icon violations | 0 corp | 0 ai-tell | 0 hedge

---

## File: docs/Discovery_Docs/Discovery_Document.md

**Pipeline diagram (L8)**

- L8 [icon]: `📍 Discovery Document` in pipeline diagram → `Discovery Document` (no prefix needed — position in diagram is self-evident)

**Hypothesis validation table (L105–107)**

- L105 [icon]: `✅ Đúng —` → `Validated —`
- L106 [icon]: `⚠️ Cần điều chỉnh —` → `Partial —`
- L107 [icon]: `⚠️ Cần validate thêm —` → `Unconfirmed —`

**Core-criteria markers in pending-research table (L216, L220–224)**

- L216 [icon]: `★ criteria` in text → `core criteria`
- L220–224 [icon]: `★` prefix on 5 table rows → remove; add `[CORE]` column or plain text label

**Confidence level column in insights table (L232–237)**

- L232 [icon]: `🟡 Trung bình–cao` → `Medium-high`
- L233–237 [icon]: `🟢 Cao`, `🟡 Trung bình` → `High`, `Medium`

**Competitive feature matrix (L284)**

- L284 [icon]: `❌` and `✅` in table cells → `No` / `Yes`

**Journey map — emotion row and pain-point row (L574–577)**

- L574 [icon]: `😰 Lo lắng / 😟 Bất an / 😩 Bối rối / 😨 Stress / 😞 Tự nghi ngờ`
  → `Lo lắng / Bất an / Bối rối / Stress cao / Tự nghi ngờ` (emotion label is sufficient)
- L575 [icon]: `**Không có feedback chất lượng** ⭐` → `**Không có feedback chất lượng** [top pain point]`
- L577 [icon]: `**🎯 Core opportunity**` → `**Core opportunity**`

**Pain-point priority matrix (L587–593)**

- L587 [icon]: `⭐⭐⭐ Top` → `P1 (Top)`
- L588 [icon]: `⭐⭐⭐` → `P1`
- L589–590 [icon]: `⭐⭐` → `P2`
- L591–593 [icon]: `⭐⭐ / ⭐` → `P2 / P3`

**Warning callout (L597)**

- L597 [icon]: `> ⚠️ *Nội dung phần này...` → `> **Note:** Nội dung phần này...`

**Post-interview journey emotion row (L665)**

- L665 [icon]: `😰 → 😊`, `😟 → 🙂`, `😩 → 😊`, `😨 → 😎`, `😞 → 💪`
  → `Lo lắng → Thoải mái`, `Bất an → Yên tâm`, etc. (or numeric Before/After columns)

**Expert interview warning callout (L672)**

- L672 [icon]: `> ⚠️ **Trạng thái:**` → `> **Note:**`

**HR priority table — star-rating column (L695–700)**

- L695 [icon]: `⭐⭐⭐⭐⭐` → `5/5` (or drop the rating column and keep only the text)
- L696–700 [icon]: `⭐⭐⭐⭐`, `⭐⭐⭐` → `4/5`, `3/5`

**Insight section headers and callout labels (L734–L775+)**

- L734, L747, L760, L773 [icon]: `### 🔍 Insight #N:` → `### Insight #N:`
- L736, L749, L762, L775 [icon]: `**📊 Evidence:**` → `**Evidence:**`
- L741, L754, L767 [icon]: `**💡 Implication:**` → `**Implication:**`
- L743, L756, L769 [icon]: `**🎯 Confidence:**` → `**Confidence:**`

(Pattern repeats for all insight sections beyond L775 — not counted separately.)

Total: 50+ lines with icon violations | 0 corp | 0 ai-tell | 0 hedge

---

## File: docs/Discovery_Docs/Discovery_Document_Template.md

Heavy emoji usage throughout — instructional callout icons (💡 📝 ⚠️ 🎯 📖 📍),
section locators (📍), emotion scales (😰→💪), priority stars (⭐⭐⭐), and status
checks (✅ ⚠️ ❌ 🔍 📊).

Representative samples:

- L8 [icon]: `📍` section locator → remove
- L13 [icon]: `📖` section header prefix → remove
- L21–24 [icon]: `💡 📝 ⚠️ 🎯` instruction callouts → use bold labels: `**Note:**` / `**Warning:**` / `**Goal:**`
- Lines ~509–537 [icon]: emotion scale `😰 → 💪` → numeric scale (1–5) or text labels
- Lines ~533–537 [icon]: `⭐⭐⭐` priority stars → `P1 / P2 / P3`
- Lines ~639–641 [icon]: `✅ ⚠️ ❌` status → `Done / Partial / Missing`

Total: 50+ lines with icon violations | 0 corp | 0 ai-tell | 0 hedge

---

## File: docs/PHASES.md

- L6 [icon]: `✅ Completed 2026-05-04` → `Completed 2026-05-04`
- L23 [icon]: `🚧 In progress` → `In progress`
- L51 [icon]: `⏭️ Not started` → `Not started`

Total: 3 icon violations | 0 corp | 0 ai-tell | 0 hedge
Fixed: 2026-05-09

---

## File: docs/SRS/SRS_InterviewAI_Full.md

Violations fall into two zones.

**Zone A — Flow prose and AC text (L691–L815)**

These emoji represent UI buttons and indicators in requirement text (not wireframes):

- L691 [icon]: `🇻🇳 Việt Nam / 🌍 Western` column headers → `Vietnam / Western`
- L753 [icon]: `**🎤 Trả lời bằng giọng nói**`, `**✏️ Trả lời bằng văn bản**` button labels
  → `**[Voice] Trả lời bằng giọng nói**`, `**[Text] Trả lời bằng văn bản**`
- L759 [icon]: `**🎤 Bắt đầu ghi âm**` → `**[Record] Bắt đầu ghi âm**`
- L777 [icon]: `**✏️ Trả lời bằng văn bản**` → `**[Text] Trả lời bằng văn bản**`
- L798 [icon]: `"Câu trả lời đã đầy đủ ✓"` → `"Câu trả lời đã đầy đủ"`
- L815 [icon]: `**"Đã phân tích ✓"**` → `**"Đã phân tích"**`

**Zone B — ASCII wireframe/mockup sections (L974–L1196)**

These emoji represent planned UI affordances (color-coded chips, icons, button states).
Replacements preserve semantic meaning using text tokens:

- L974 [icon]: `Context: 🇻🇳 VN Pack` → `Context: VN Pack`
- L975 [icon]: `💡 Key Takeaway:` → `Key Takeaway:`
- L977 [icon]: `📝 Transcript của bạn` → `Transcript của bạn`
- L979, L982 [icon]: `[🔴 Ừm...]`, `[🔴 Cuối cùng...]` → `[RED: Ừm...]`, `[RED: Cuối cùng...]`
- L981 [icon]: `[🟡 Tôi đã cố gắng...]` → `[YELLOW: Tôi đã cố gắng...]`
- L985 [icon]: `[🟢 Tôi đã chuẩn bị...]` → `[GREEN: Tôi đã chuẩn bị...]`
- L987 [icon]: `🎯 Câu trả lời mẫu` → `Model Answer`
- L990, L1019, L1074 [icon]: `[🔁 Luyện lại câu này]` → `[Retry]`
- L999 [icon]: `🔴 Cần sửa ngay` → `Critical`
- L1001 [icon]: `📌 Vấn đề:` → `Issue:`
- L1006, L1079 [icon]: `💡 Gợi ý:` / `💡 Nhớ:` → `Suggestion:` / `Reminder:`
- L1010 [icon]: `✅ Nên nói:` → `Better:`
- L1018, L1026 [icon]: `👍 Hữu ích / 👎 Chưa hữu ích`, `👍/👎` → `+1 / -1`
- L1025, L1086 [icon]: `🎤 95 WPM` / `**🎤**` → `95 WPM` / `[mic]`
- L1038 [icon]: `🟢 good, 🟡 warning, 🔴 critical` → `green=good, yellow=warning, red=critical`
- L1111 [icon]: `📝 Lần gốc — 68/100`, `📝 Lần 1 — 81/100` → `Lần gốc — 68/100`, `Lần 1 — 81/100`
- L1113, L1115, L1117 [icon]: `🔴 / 🟢 / 🟡` in side-by-side comparison → `RED:` / `GREEN:` / `YELLOW:` prefixes
- L1122 [icon]: `Cải thiện tốt! 🎉` → `Cải thiện tốt!`
- L1127 [icon]: `icon 🎉, text "Cải thiện rõ rệt!"` → `text "Cải thiện rõ rệt!" (green-bold)`
- L1128 [icon]: `icon ✓, text "Có cải thiện"` → `text "Có cải thiện" (green)`
- L1129 [icon]: `icon ⚡, text "Chưa thay đổi nhiều"` → `text "Chưa thay đổi nhiều" (yellow)`
- L1196 [icon]: `Context Pack icon (🇻🇳 hoặc 🌍)` → `Context Pack label (VN hoặc Western)`

Total: ~40 lines with icon violations | 0 corp | 0 ai-tell | 0 hedge

---

## File: docs/SRS/RTM_InterviewAI.md

No violations.

---

## File: docs/SRS/Checklist_SRS.md

No violations.

---

## File: docs/SAD/SAD_InterviewAI_v1.0.md

No firm violations.

Borderline: box-drawing characters (`┌ ┐ └ ┘ │ ◄ ►`) appear in ASCII architecture
diagrams (lines ~51–80). These serve a structural/diagrammatic function, not
decoration — the rule targets decorative symbols. Judgment: keep. Plain-text
alternatives (`+---+`) would not improve clarity.

---

## File: docs/glossary.md

No violations.

---

## File: docs/user-stories/README.md

No violations.

---

## File: docs/test-plan/strategy.md

No firm violations.

Borderline: box-drawing characters in ASCII test pyramid diagram (~L58–68). Same
judgment as SAD — structural, not decorative. Keep.

---

## Summary Table

| File | Icon lines | Corporate | AI tells | Hedging | Total |
|------|----------:|----------:|---------:|--------:|------:|
| CLAUDE.md | 0 (fixed) | 0 | 0 | 0 | 0 |
| .claude/rules/docs-general.md | 0 | 0 | 0 | 0 | 0 |
| .claude/rules/srs-format.md | 0 (fixed) | 0 | 0 | 0 | 0 |
| .claude/rules/user-stories.md | 0 | 0 | 0 | 0 | 0 |
| .claude/rules/test-plan.md | 0 | 0 | 0 | 0 | 0 |
| .claude/rules/testing.md | 0 | 0 | 0 | 0 | 0 |
| .claude/rules/api.md | 0 | 0 | 0 | 0 | 0 |
| .claude/rules/db.md | 0 | 0 | 0 | 0 | 0 |
| .claude/rules/security.md | 0 | 0 | 0 | 0 | 0 |
| docs/Discovery_Docs/Checklist_Discovery.md | 27 | 0 | 0 | 0 | 27 |
| docs/Discovery_Docs/Discovery_Document.md | 50+ | 0 | 0 | 0 | 50+ |
| docs/Discovery_Docs/Discovery_Document_Template.md | 50+ | 0 | 0 | 0 | 50+ |
| docs/PHASES.md | 0 (fixed) | 0 | 0 | 0 | 0 |
| docs/SRS/SRS_InterviewAI_Full.md | ~40 | 0 | 0 | 0 | ~40 |
| docs/SRS/RTM_InterviewAI.md | 0 | 0 | 0 | 0 | 0 |
| docs/SRS/Checklist_SRS.md | 0 | 0 | 0 | 0 | 0 |
| docs/SAD/SAD_InterviewAI_v1.0.md | 0† | 0 | 0 | 0 | 0† |
| docs/glossary.md | 0 | 0 | 0 | 0 | 0 |
| docs/user-stories/README.md | 0 | 0 | 0 | 0 | 0 |
| docs/test-plan/strategy.md | 0† | 0 | 0 | 0 | 0† |
| **TOTAL** | **200+** | **0** | **0** | **0** | **200+** |

† borderline: box-drawing chars in ASCII diagrams — not counted as firm violations.

**Pattern:** all violations are emoji/icon. Zero corporate phrases, zero AI tells,
zero hedging adjective chains across all 20 files.

Icon violations concentrate in three areas:

1. Discovery-phase docs (Discovery_Document.md, Discovery_Document_Template.md,
   Checklist_Discovery.md) — emoji used as instructional scaffolding (callout
   icons, emotion scales, priority stars, status marks).

2. SRS wireframe sections (SRS_InterviewAI_Full.md L974–L1196) — emoji used to
   represent planned UI affordances in ASCII mockups.

3. Meta/tracking docs (CLAUDE.md, PHASES.md) — emoji used as status markers in
   tables and section headers.

Highest-priority fixes: CLAUDE.md (project meta-guide, read every session) and
docs/PHASES.md (phase tracker, actively maintained). Discovery and SRS docs can
be fixed incrementally as they are next touched.
