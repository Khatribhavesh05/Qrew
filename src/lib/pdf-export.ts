import { jsPDF } from "jspdf";

interface ExportOptions {
  title: string;
  agentName: string;
  agentRole: string;
  startupName: string;
  content: string;
  accentColor: [number, number, number];
}

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

interface ParsedSection {
  heading: string;
  body: string;
  tables: ParsedTable[];
}

interface MarketSize {
  tam?: string;
  sam?: string;
  som?: string;
}

// ── Markdown parsers ──────────────────────────────────────────────────────────

function stripMd(text: string): string {
  return text
    // Remove code fences entirely
    .replace(/^```[\w]*\s*$/gm, "")
    // Strip 4-space or tab indentation (code block indicators)
    .replace(/^( {4}|\t)/gm, "")
    // Standard markdown
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    // Strip inline code backticks (remove backtick+content, not just backticks)
    .replace(/`[^`]*`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Strip bare URLs that would overflow the page
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, "")
    // Collapse multiple spaces
    .replace(/  +/g, " ")
    .trim();
}

function parseTable(lines: string[]): ParsedTable | null {
  const dataRows = lines.filter(
    (l) => l.includes("|") && !/^[\s|:-]+$/.test(l)
  );
  if (dataRows.length < 2) return null;

  const parse = (row: string) =>
    row.split("|").map((c) => c.trim()).filter(Boolean);

  return {
    headers: parse(dataRows[0]),
    rows: dataRows.slice(1).map(parse),
  };
}

function parseSections(markdown: string): ParsedSection[] {
  const lines = markdown.split("\n");
  const sections: ParsedSection[] = [];
  let currentHeading = "";
  let currentBody: string[] = [];
  let currentTables: ParsedTable[] = [];
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (tableBuffer.length > 1) {
      const t = parseTable(tableBuffer);
      if (t) currentTables.push(t);
    }
    tableBuffer = [];
  };

  const flushSection = () => {
    if (currentHeading || currentBody.length || currentTables.length) {
      sections.push({
        heading: currentHeading,
        body: currentBody.join("\n").trim(),
        tables: [...currentTables],
      });
    }
    currentHeading = "";
    currentBody = [];
    currentTables = [];
  };

  let inCodeBlock = false;

  for (const line of lines) {
    // Toggle code block state and skip all code fence lines
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    // Skip everything inside a code block
    if (inCodeBlock) continue;

    if (line.startsWith("## ")) {
      flushTable();
      flushSection();
      currentHeading = line.replace(/^##\s+/, "");
    } else if (line.startsWith("### ")) {
      flushTable();
      currentBody.push("\n__SUBHEAD__" + line.replace(/^###\s+/, ""));
    } else if (line.trim().startsWith("|")) {
      tableBuffer.push(line);
    } else {
      if (tableBuffer.length) flushTable();
      const stripped = stripMd(line);
      if (stripped) currentBody.push(stripped);
    }
  }
  flushTable();
  flushSection();
  return sections.filter((s) => s.heading || s.body || s.tables.length);
}

function extractMarketSize(markdown: string): MarketSize {
  const result: MarketSize = {};
  const tamMatch = markdown.match(/\*?\*?TAM[^$\d]*[\$₹]?([\d.,]+\s*(?:billion|million|B|M|T|trillion|crore|lakh)?)/i);
  const samMatch = markdown.match(/\*?\*?SAM[^$\d]*[\$₹]?([\d.,]+\s*(?:billion|million|B|M|T|trillion|crore|lakh)?)/i);
  const somMatch = markdown.match(/\*?\*?SOM[^$\d]*[\$₹]?([\d.,]+\s*(?:billion|million|B|M|T|trillion|crore|lakh)?)/i);
  if (tamMatch) result.tam = tamMatch[1].trim();
  if (samMatch) result.sam = samMatch[1].trim();
  if (somMatch) result.som = somMatch[1].trim();
  return result;
}

// ── PDF renderers ─────────────────────────────────────────────────────────────

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  // Break any word longer than ~60 chars (e.g. leaked URLs) to prevent overflow
  const safe = text.replace(/(\S{60})/g, "$1​");
  return doc.splitTextToSize(safe, maxWidth) as string[];
}

function renderTable(
  doc: jsPDF,
  table: ParsedTable,
  x: number,
  y: number,
  contentW: number,
  accentColor: [number, number, number]
): number {
  const [r, g, b] = accentColor;
  const colW = contentW / Math.max(table.headers.length, 1);
  const rowH = 7;
  const fontSize = 7.5;

  // Header row
  doc.setFillColor(r, g, b, 0.15);
  doc.rect(x, y, contentW, rowH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  doc.setTextColor(245, 245, 245);
  table.headers.forEach((h, i) => {
    doc.text(h.slice(0, 20), x + i * colW + 2, y + 5);
  });
  y += rowH;

  // Data rows
  table.rows.forEach((row, ri) => {
    if (ri % 2 === 0) {
      doc.setFillColor(20, 20, 20);
      doc.rect(x, y, contentW, rowH, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(163, 163, 163);
    row.forEach((cell, i) => {
      doc.text(String(cell ?? "").slice(0, 22), x + i * colW + 2, y + 5);
    });
    y += rowH;
  });

  // Border
  doc.setDrawColor(31, 31, 31);
  doc.setLineWidth(0.2);
  doc.rect(x, y - table.rows.length * rowH - rowH, contentW, (table.rows.length + 1) * rowH, "S");

  return y + 4;
}

function renderMarketBoxes(
  doc: jsPDF,
  market: MarketSize,
  x: number,
  y: number,
  contentW: number,
  accentColor: [number, number, number]
): number {
  if (!market.tam && !market.sam && !market.som) return y;

  const [r, g, b] = accentColor;
  const boxes = [
    { label: "TAM", sub: "Total Addressable", value: market.tam, opacity: 1.0 },
    { label: "SAM", sub: "Serviceable Market",  value: market.sam, opacity: 0.7 },
    { label: "SOM", sub: "Obtainable Market",   value: market.som, opacity: 0.45 },
  ].filter((b) => b.value);

  if (!boxes.length) return y;

  const boxW = (contentW - (boxes.length - 1) * 4) / boxes.length;
  const boxH = 22;

  boxes.forEach((box, i) => {
    const bx = x + i * (boxW + 4);
    const alpha = box.opacity;
    doc.setFillColor(
      Math.round(r * alpha + 10 * (1 - alpha)),
      Math.round(g * alpha + 10 * (1 - alpha)),
      Math.round(b * alpha + 10 * (1 - alpha)),
      0.18
    );
    doc.setDrawColor(
      Math.round(r * alpha + 31 * (1 - alpha)),
      Math.round(g * alpha + 31 * (1 - alpha)),
      Math.round(b * alpha + 31 * (1 - alpha))
    );
    doc.setLineWidth(0.4);
    doc.roundedRect(bx, y, boxW, boxH, 3, 3, "FD");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(r, g, b);
    doc.text(box.label, bx + boxW / 2, y + 7, { align: "center" });

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(245, 245, 245);
    doc.text(`$${box.value!}`, bx + boxW / 2, y + 14, { align: "center" });

    // Sub label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text(box.sub, bx + boxW / 2, y + 19.5, { align: "center" });
  });

  return y + boxH + 8;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function exportReportPDF(opts: ExportOptions): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 18;
  const contentW = W - margin * 2;
  const [r, g, b] = opts.accentColor;

  let y = 0;

  // ── Cover header ─────────────────────────────────────────────────────────────
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, W, 56, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(r, g, b);
  doc.text("qrew", margin, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("AI Startup Company", margin, 29);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(245, 245, 245);
  doc.text(opts.title, margin, 41);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(163, 163, 163);
  doc.text(`${opts.agentName} · ${opts.agentRole}  ·  ${opts.startupName}`, margin, 49);

  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.5);
  doc.line(0, 56, W, 56);

  y = 68;

  // ── TAM/SAM/SOM boxes (research reports only) ─────────────────────────────
  if (opts.agentName === "Alex") {
    const market = extractMarketSize(opts.content);
    if (market.tam || market.sam || market.som) {
      y = renderMarketBoxes(doc, market, margin, y, contentW, opts.accentColor);
    }
  }

  // ── Sections ─────────────────────────────────────────────────────────────────
  const sections = parseSections(opts.content);

  for (const section of sections) {
    if (y > 260) { doc.addPage(); y = 24; }

    if (section.heading) {
      doc.setFillColor(r, g, b, 0.1);
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y - 4, contentW, 9, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(r, g, b);
      doc.text(section.heading.toUpperCase(), margin + 4, y + 2);
      y += 10; // tighter after heading
    }

    // Body text — line height 4.2mm ≈ 1.5× 8.5pt font
    if (section.body) {
      const bodyLines = section.body.split("\n").filter((l) => l.trim());
      for (const line of bodyLines) {
        if (!line.trim()) continue;
        if (y > 272) { doc.addPage(); y = 24; }

        if (line.startsWith("__SUBHEAD__")) {
          const text = line.replace("__SUBHEAD__", "");
          y += 1.5;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(210, 210, 210);
          const wrapped = wrapText(doc, text, contentW);
          for (const wl of wrapped) {
            if (y > 272) { doc.addPage(); y = 24; }
            doc.text(wl, margin, y);
            y += 4.2; // 1.5 line height
          }
          y += 1;
        } else if (line.startsWith("•")) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(163, 163, 163);
          doc.setFillColor(r, g, b);
          doc.circle(margin + 1.5, y - 1.2, 0.8, "F");
          const wrapped = wrapText(doc, line.replace(/^•\s*/, ""), contentW - 7);
          for (const wl of wrapped) {
            if (y > 272) { doc.addPage(); y = 24; }
            doc.text(wl, margin + 5, y);
            y += 4.2; // 1.5 line height
          }
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(163, 163, 163);
          const wrapped = wrapText(doc, line, contentW);
          for (const wl of wrapped) {
            if (y > 272) { doc.addPage(); y = 24; }
            doc.text(wl, margin, y);
            y += 4.2; // 1.5 line height
          }
        }
      }
      y += 3; // paragraph margin-bottom ≈ 8px
    }

    // Inline tables
    for (const table of section.tables) {
      if (y > 255) { doc.addPage(); y = 24; }
      y = renderTable(doc, table, margin, y, contentW, opts.accentColor);
      y += 3;
    }

    y += 2; // section gap ≈ 12px
  }

  // ── Footer on every page ──────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(31, 31, 31);
    doc.setLineWidth(0.3);
    doc.line(margin, 285, W - margin, 285);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(82, 82, 82);
    doc.text("Generated by Qrew · qrew.ai", margin, 290);
    doc.text(`Page ${p} of ${totalPages}`, W - margin, 290, { align: "right" });
  }

  const filename = `${opts.title.toLowerCase().replace(/\s+/g, "-")}-${opts.startupName.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
}
