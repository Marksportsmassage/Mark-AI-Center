import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "docs", "exam-review", "extraction-reports", "materials-scan.json");
if (!existsSync(reportPath)) {
  console.error("Missing scan report. Run npm run exam:scan first.");
  process.exit(1);
}

const { reports } = JSON.parse(readFileSync(reportPath, "utf8"));
const byKey = Object.fromEntries(reports.map((report) => [report.key, report]));
const today = "2026-06-25";

function ensureDir(file) {
  mkdirSync(path.dirname(file), { recursive: true });
}

function write(rel, content) {
  const file = path.join(root, rel);
  ensureDir(file);
  writeFileSync(file, content.trimEnd() + "\n");
}

function excerpt(report, limit = 16) {
  if (!report?.found) return "Source missing.";
  if (report.requires_manual_ocr) return `Found at \`${report.copied_path}\`, but text extraction was insufficient. Requires manual OCR or clearer PDF.`;
  return report.pages
    .filter((page) => page.text)
    .slice(0, limit)
    .map((page) => `### Page ${page.page}\n\n${page.text}`)
    .join("\n\n");
}

function sourceStatus(report) {
  if (!report?.found) return "source missing";
  if (report.requires_manual_ocr) return "found, requires manual OCR";
  return `found, extracted ${report.extracted_pages}/${report.page_count} pages`;
}

function questionBank(title, report, note) {
  return `# ${title}

Source file: ${report?.file ?? "待補"}

Status: ${sourceStatus(report)}.

Important rule: extracted text below is source material, not a fully verified answer key. Do not treat generated grouping as final until Mark reviews ambiguous items.

${note}

## Extracted Source Text

${excerpt(report)}
`;
}

write("docs/exam-review/local-material-search-2026-06-25.md", `# Local Material Search - 2026-06-25

Search completed during the 2026-06-25 morning integration task.

## Found And Copied

| File | Copied path | Status | Text extraction | Scan/manual OCR |
| --- | --- | --- | --- | --- |
${reports.filter((r) => r.found).map((r) => `| ${r.file} | \`${r.copied_path}\` | ${r.status} | ${r.extracted_pages}/${r.page_count} pages, ${r.char_count} chars | ${r.requires_manual_ocr ? "requires manual OCR" : "text extracted"} |`).join("\n") || "| None | - | - | - | - |"}

## Not Found

${reports.filter((r) => !r.found && !r.optional).map((r) => `- ${r.file}`).join("\n") || "- None"}

## Notes

- PDF files are local materials only and are ignored by Git.
- No cloud OCR was used.
- Scanned or low-text PDFs are indexed but not invented from.
`);

write("docs/exam-review/materials-inventory.md", `# Materials Inventory

Status checked: ${today}.

| Subject | Expected file | Expected path | Status |
| --- | --- | --- | --- |
${reports.filter((r) => !r.optional).map((r) => `| ${r.subject} | ${r.file} | \`materials/exam/${r.dir}/\` | ${sourceStatus(r)} |`).join("\n")}

Additional discovered material:

${reports.filter((r) => r.optional && r.found).map((r) => `- ${r.file}: ${sourceStatus(r)}`).join("\n") || "- None"}
`);

write("docs/exam-review/missing-materials.md", `# Missing Materials

Mark still needs to provide:

${reports.filter((r) => !r.found && !r.optional).map((r) => `- ${r.file}`).join("\n") || "- None"}

Additional helpful materials:

- 外科完整講義或筆記，如有
- 物理因子其他 PPT / 講義，如有
- 操作治療學更清楚文字版或可 OCR 版本，如有
- 老師畫重點
- 期末考明確範圍
- 其他題庫 / 考古題
- 上課影片或跑台流程

Do not generate final question banks until source material is present and readable.
`);

write("docs/exam-review/surgery/surgery-question-bank.md", questionBank("Surgery Question Bank", byKey.surgery, "No surgery PDF was found in this run, so no original surgery questions have been extracted."));
write("docs/exam-review/surgery/surgery-answer-key.md", `# Surgery Answer Key

Source file: ${byKey.surgery.file}

Status: ${sourceStatus(byKey.surgery)}.

| Question | Answer | Source page | Confidence | Notes |
| --- | --- | --- | --- | --- |
| 待補 | 待補 | 待補 | 待補 | Source missing |
`);
write("docs/exam-review/surgery/surgery-high-yield-review.md", `# Surgery High-Yield Review

Status: ${sourceStatus(byKey.surgery)}.

No source-verified surgery high-yield content is available yet.
`);
write("docs/exam-review/surgery/surgery-final-30min-review.md", `# Surgery Final 30-Minute Review

Status: source missing.

- Read question bank first after Mark provides \`${byKey.surgery.file}\`.
- Do not memorize unsourced answers.
`);

write("docs/exam-review/rom/rom-question-bank.md", questionBank("ROM Question Bank", byKey.rom, "No ROM PDF was found in this run, so no original ROM questions have been extracted."));
write("docs/exam-review/rom/rom-answer-key.md", `# ROM Answer Key

Status: ${sourceStatus(byKey.rom)}.

| Question | Answer | Body region | Source page | Confidence | Notes |
| --- | --- | --- | --- | --- | --- |
| 待補 | 待補 | 待補 | 待補 | 待補 | Source missing |
`);
write("docs/exam-review/rom/rom-norkin-high-yield.md", `# ROM Norkin High-Yield

Status: ${sourceStatus(byKey.rom)}.

Known prompt-level points to verify after PDF is provided:

- MCP / PIP / DIP flexion measurement
- DIP flexion with PIP at 70-90 degrees
- Relax upstream proximal joints during IP joint measurement to avoid extensor tendon tension
- Thumb CMC flexion/extension and abduction measurement
- Goniometer axis, proximal arm, distal arm alignment
`);
write("docs/exam-review/rom/rom-final-30min-review.md", `# ROM Final 30-Minute Review

Status: source missing.

- 待補 source-verified Norkin measurement table.
- 待補 question misses and easy-confusion list.
`);

write("docs/exam-review/mmt/mmt-upper-limb-muscle-actions.md", questionBank("MMT Upper-Limb Muscle Actions", byKey["mmt-upper"], "Extracted text is from the answer PDF. It still needs manual cleanup into action / muscle / innervation tables."));
write("docs/exam-review/mmt/mmt-lower-limb-muscle-actions.md", questionBank("MMT Lower-Limb Muscle Actions", byKey["mmt-lower"], "Extracted text is from the answer PDF. It still needs manual cleanup into action / muscle / innervation tables."));
write("docs/exam-review/mmt/mmt-question-answer-bank.md", `# MMT Question Answer Bank

Upper-limb source: ${sourceStatus(byKey["mmt-upper"])}.

Lower-limb source: ${sourceStatus(byKey["mmt-lower"])}.

## Upper-Limb Extract

${excerpt(byKey["mmt-upper"], 10)}

## Lower-Limb Extract

${excerpt(byKey["mmt-lower"], 10)}
`);
write("docs/exam-review/mmt/mmt-innervation-table.md", `# MMT Innervation Table

Status: source text extracted where available, but table normalization still needs Mark/manual confirmation.

| Muscle | Chinese name | Region | Motion | Nerve | Root | Source page | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 待補 | 待補 | 待補 | 待補 | 待補 | 待補 | 待補 | Extract from MMT answer PDFs |
`);
write("docs/exam-review/mmt/mmt-final-30min-review.md", `# MMT Final 30-Minute Review

Status: MMT PDFs found; extracted text needs cleanup into tables.

Priority:

1. Upper limb: scapula, shoulder, elbow, wrist and fingers.
2. Lower limb: hip, knee, ankle and foot.
3. Build innervation table after Mark confirms extracted text formatting.
`);

write("docs/exam-review/physical-modality/shockwave-high-yield-review.md", questionBank("Shockwave High-Yield Review", byKey.shockwave, "This is lecture-source text, not an original question bank unless a page explicitly contains questions."));
write("docs/exam-review/physical-modality/hifem-high-yield-review.md", questionBank("HIFEM High-Yield Review", byKey.hifem, "No HIFEM PDF was found in this run."));
write("docs/exam-review/physical-modality/physical-modality-comparison-table.md", `# Physical Modality Comparison Table

Status:

- HIFEM: ${sourceStatus(byKey.hifem)}
- Shockwave: ${sourceStatus(byKey.shockwave)}

| Item | HIFEM | Shockwave | Source pages | Easy mistake |
| --- | --- | --- | --- | --- |
| Energy / field type | 待補 | 待補 from extracted shockwave material | 待補 | 待補 |
| Mechanism | 待補 | 待補 from extracted shockwave material | 待補 | 待補 |
| Key parameter | 待補 | 待補 from extracted shockwave material | 待補 | 待補 |
| Contraindications | 待補 | 待補 from extracted shockwave material | 待補 | 待補 |
`);
write("docs/exam-review/physical-modality/physical-modality-final-30min-review.md", `# Physical Modality Final 30-Minute Review

Status:

- Shockwave PDF found and text extraction attempted.
- HIFEM PDF missing.

Use this after cleanup:

1. Shockwave definition and mechanism.
2. Shockwave generator types.
3. Focused / radial / diffused differences.
4. Contraindications and precautions.
5. HIFEM remains 待補.
`);

const opReports = [byKey["operation-therapy-1"], byKey["operation-therapy-2"], byKey["operation-therapy-run"]];
write("docs/exam-review/operation-therapy/operation-therapy-source-index.md", `# Operation Therapy Source Index

| File | Status | Pages | Extracted pages | Manual OCR |
| --- | --- | ---: | ---: | --- |
${opReports.map((r) => `| ${r.file} | ${sourceStatus(r)} | ${r.page_count} | ${r.extracted_pages} | ${r.requires_manual_ocr ? "yes" : "no"} |`).join("\n")}

## Extracted Text Preview

${opReports.map((r) => `## ${r.file}\n\n${excerpt(r, 5)}`).join("\n\n")}
`);
write("docs/exam-review/operation-therapy/operation-therapy-upper-limb.md", questionBank("Operation Therapy Upper Limb", byKey["operation-therapy-1"], "Classify fingers and wrist techniques after manual cleanup. Do not invent missing operation steps."));
write("docs/exam-review/operation-therapy/operation-therapy-lower-limb.md", questionBank("Operation Therapy Lower Limb", byKey["operation-therapy-2"], "Classify lower-limb techniques after manual cleanup. Do not invent missing operation steps."));
write("docs/exam-review/operation-therapy/operation-therapy-key-techniques.md", `# Operation Therapy Key Techniques

Status: source PDFs found; text extraction may be partial depending on scan quality.

## Joint Mobilization

- Source pages: 待補 after manual cleanup.
- Setup: 待補.
- Hand placement: 待補.
- Direction / grade: 待補.
- Contraindications: 待補.
- Precautions: 待補.
- Common mistakes: 待補.

## Therapeutic Exercise

- Source pages: 待補 after manual cleanup.
- Goal: 待補.
- Exercise setup: 待補.
- Progression / regression: 待補.
- Contraindications: 待補.
- Precautions: 待補.
`);
write("docs/exam-review/operation-therapy/operation-therapy-manual-review-needed.md", `# Operation Therapy Manual Review Needed

Files:

${opReports.map((r) => `- ${r.file}: ${r.requires_manual_ocr ? "requires manual OCR / clearer scan" : "text extracted, needs cleanup"}`).join("\n")}

Do not create original questions unless they are visible in the source text or manually confirmed by Mark.
`);
write("docs/exam-review/operation-therapy/operation-therapy-final-30min-review.md", `# Operation Therapy Final 30-Minute Review

Status: source files found, cleanup still needed.

1. Review source index first.
2. Fill fingers / wrist operations.
3. Fill lower-limb operations.
4. Mark contraindications and precautions.
5. Keep scanned or unclear pages in manual review list.
`);

const completionRows = [
  ["Surgery", byKey.surgery.found ? "partial" : "0%", sourceStatus(byKey.surgery)],
  ["ROM", byKey.rom.found ? "partial" : "0%", sourceStatus(byKey.rom)],
  ["MMT", "partial", `${sourceStatus(byKey["mmt-upper"])}; ${sourceStatus(byKey["mmt-lower"])}`],
  ["Physical Modality", byKey.shockwave.found ? "partial" : "0%", `Shockwave ${sourceStatus(byKey.shockwave)}; HIFEM ${sourceStatus(byKey.hifem)}`],
  ["Operation Therapy", "indexed", opReports.map(sourceStatus).join("; ")]
];
write("docs/exam-review/final-exam-master-index.md", `# Final Exam Master Index

Status checked: ${today}.

## Completion Status

| Subject | Completion | Current state |
| --- | --- | --- |
${completionRows.map(([subject, completion, state]) => `| ${subject} | ${completion} | ${state} |`).join("\n")}

## High Priority

1. Add missing Surgery and ROM question-bank PDFs.
2. Clean extracted MMT answer text into muscle/action/innervation tables.
3. Clean shockwave lecture text into definition/mechanism/parameter review.
4. Review Operation Therapy extracted text and mark unclear scanned pages.
5. Add HIFEM PDF.

## Suggested Reading Order

1. 題庫科目先讀題目與答案。
2. ROM / MMT 先背表格與易錯點。
3. 物理因子先背定義、機轉、參數、禁忌症。
4. 操作治療先背操作流程、禁忌症、注意事項。
`);

console.log("Built exam review docs from scan reports.");

