import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const materialsRoot = path.join(root, "materials", "exam");
const outDir = path.join(root, "docs", "exam-review", "extraction-reports");
mkdirSync(outDir, { recursive: true });

const expected = [
  { key: "rom", subject: "ROM", file: "易大師的期末ROM題庫-保母級.pdf", dir: "rom" },
  { key: "rom-lecture", subject: "ROM", file: "ROM講義.pdf", dir: "rom", optional: true },
  { key: "rom-station", subject: "ROM", file: "1142ROM期末考跑檯試題 2.pdf", dir: "rom", optional: true },
  { key: "rom-measurement-guide", subject: "ROM", file: "ROM跑台測量指引（全圖）0615.pdf", dir: "rom", optional: true },
  { key: "operation-therapy-1", subject: "Operation Therapy", file: "操作治療學(四肢)1.pdf", dir: "operation-therapy" },
  { key: "operation-therapy-2", subject: "Operation Therapy", file: "操作治療學(四肢)2.pdf", dir: "operation-therapy" },
  { key: "operation-therapy-run", subject: "Operation Therapy", file: "114學年度＿專物一甲操作治療學及實習跑台技術考考題.pdf", dir: "operation-therapy", optional: true },
  { key: "surgery", subject: "Surgery", file: "外科題目AI.pdf", dir: "surgery" },
  { key: "mmt-upper", subject: "MMT", file: "MMT小考上肢(ans).pdf", dir: "rom-mmt" },
  { key: "mmt-lower", subject: "MMT", file: "MMT小考下肢(ans)(1).pdf", dir: "rom-mmt" },
  { key: "mmt-run-images", subject: "MMT", file: "MMT期末跑台圖0612 2.pdf", dir: "rom-mmt", optional: true },
  { key: "hifem", subject: "Physical Modality", file: "高強度聚焦磁場治療(1).pdf", dir: "physical-modality" },
  { key: "tens", subject: "Physical Modality", file: "04TENS 2.pdf", dir: "physical-modality", optional: true },
  { key: "muscle-stim", subject: "Physical Modality", file: "05肌肉電刺激 2.pdf", dir: "physical-modality", optional: true },
  { key: "traction", subject: "Physical Modality", file: "05脊椎牽引概論與臨床運用 2.pdf", dir: "physical-modality", optional: true },
  { key: "shockwave", subject: "Physical Modality", file: "06震波.pdf", dir: "physical-modality" }
];

function extractPdf(filePath) {
  const py = `
import json, sys
from pathlib import Path
try:
  from pypdf import PdfReader
except Exception as exc:
  print(json.dumps({"ok": False, "error": "pypdf unavailable: " + str(exc)}))
  sys.exit(0)
path = Path(sys.argv[1])
try:
  reader = PdfReader(str(path))
  pages = []
  chars = 0
  for i, page in enumerate(reader.pages):
    text = page.extract_text() or ""
    text = "\\n".join(line.strip() for line in text.splitlines() if line.strip())
    chars += len(text)
    pages.append({"page": i + 1, "char_count": len(text), "text": text[:3000]})
  print(json.dumps({"ok": True, "page_count": len(reader.pages), "char_count": chars, "pages": pages}, ensure_ascii=False))
except Exception as exc:
  print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
`;
  const result = spawnSync("python3", ["-c", py, filePath], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (result.status !== 0) return { ok: false, error: result.stderr || `python exited ${result.status}` };
  try {
    return JSON.parse(result.stdout);
  } catch {
    return { ok: false, error: "Could not parse extractor output", raw: result.stdout.slice(0, 1000) };
  }
}

function findActualFile(item) {
  const dir = path.join(materialsRoot, item.dir);
  const exact = path.join(dir, item.file);
  if (existsSync(exact)) return exact;
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((name) => name.toLowerCase().endsWith(".pdf"));
  if (item.key === "shockwave") return files.find((name) => name.includes("震波")) ? path.join(dir, files.find((name) => name.includes("震波"))) : null;
  if (item.key === "surgery") return files.find((name) => name.includes("外科題目AI")) ? path.join(dir, files.find((name) => name.includes("外科題目AI"))) : null;
  if (item.key === "rom") return files.find((name) => name.includes("易大師")) ? path.join(dir, files.find((name) => name.includes("易大師"))) : null;
  return null;
}

const reports = expected.map((item) => {
  const filePath = findActualFile(item);
  if (!filePath) {
    return { ...item, status: "missing", found: false, copied_path: path.join("materials/exam", item.dir, item.file), requires_manual_ocr: false, extracted_pages: 0, page_count: 0, char_count: 0, pages: [] };
  }
  const extracted = extractPdf(filePath);
  const charCount = extracted.char_count ?? 0;
  return {
    ...item,
    status: extracted.ok ? (charCount > 100 ? "text_extracted" : "no_text_extracted") : "extract_error",
    found: true,
    copied_path: path.relative(root, filePath),
    requires_manual_ocr: !extracted.ok || charCount <= 100,
    page_count: extracted.page_count ?? 0,
    extracted_pages: extracted.pages?.filter((page) => page.char_count > 0).length ?? 0,
    char_count: charCount,
    error: extracted.error ?? null,
    pages: extracted.pages ?? []
  };
});

writeFileSync(path.join(outDir, "materials-scan.json"), JSON.stringify({ generated_at: new Date().toISOString(), reports }, null, 2));

const summary = [
  "# Materials Scan Report",
  "",
  `Generated at: ${new Date().toISOString()}`,
  "",
  "| Subject | File | Status | Pages | Extracted pages | Text chars | Manual OCR |",
  "| --- | --- | --- | ---: | ---: | ---: | --- |",
  ...reports.map((r) => `| ${r.subject} | ${r.file} | ${r.status} | ${r.page_count} | ${r.extracted_pages} | ${r.char_count} | ${r.requires_manual_ocr ? "yes" : "no"} |`)
].join("\n");
writeFileSync(path.join(outDir, "materials-scan.md"), summary + "\n");
console.log(summary);
