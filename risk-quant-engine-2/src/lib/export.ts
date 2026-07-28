import jsPDF from "jspdf";
import type { AssessmentRecord } from "./ledger";
import { fmtUSDFull } from "./risk";

export function downloadBlob(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJSON(rows: AssessmentRecord[]) {
  downloadBlob(JSON.stringify(rows, null, 2), `sentinel_telemetry_${Date.now()}.json`, "application/json");
}

export function exportCSV(rows: AssessmentRecord[]) {
  const head = [
    "timestamp",
    "asset",
    "likelihood",
    "impact",
    "inherent",
    "residual",
    "tier",
    "control_effectiveness",
    "ale",
    "p10",
    "p50",
    "p90",
    "iterations",
    "sha256",
  ];
  const body = rows.map((r) =>
    [
      new Date(r.ts).toISOString(),
      `"${r.asset}"`,
      r.likelihood,
      r.impact,
      r.inherent,
      r.residual,
      r.tier,
      r.controlEff,
      Math.round(r.ale),
      Math.round(r.p10),
      Math.round(r.p50),
      Math.round(r.p90),
      r.iterations,
      r.hash,
    ].join(","),
  );
  downloadBlob([head.join(","), ...body].join("\n"), `sentinel_ledger_${Date.now()}.csv`, "text/csv");
}

export function exportExecutivePDF(rec: AssessmentRecord, mitigations: [string, string, number][]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;

  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255, 199, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("NIST RISK ASSESSMENT", 40, 50);
  doc.setFontSize(9);
  doc.setTextColor(190, 190, 190);
  doc.setFont("courier", "normal");
  doc.text(`EXECUTIVE SUMMARY · SP 800-30 / FAIR · ${new Date(rec.ts).toISOString()}`, 40, 70);

  y = 130;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Assessment Context", 40, y);
  y += 8;
  doc.setDrawColor(220);
  doc.line(40, y, W - 40, y);
  y += 20;

  const rows: [string, string][] = [
    ["Asset Tier", rec.asset],
    ["Likelihood / Impact", `${rec.likelihood} × ${rec.impact}`],
    ["Inherent Risk Score", String(rec.inherent)],
    ["Residual Risk Score", String(rec.residual)],
    ["Risk Tier", rec.tier.replace(/_/g, " ")],
    ["Control Effectiveness", `${rec.controlEff}%`],
    ["Annualized Loss Expectancy", fmtUSDFull(rec.ale)],
    ["P10 — Optimistic", fmtUSDFull(rec.p10)],
    ["P50 — Expected Loss", fmtUSDFull(rec.p50)],
    ["P90 — Worst Case Exposure", fmtUSDFull(rec.p90)],
    ["Monte Carlo Iterations", rec.iterations.toLocaleString()],
  ];

  doc.setFontSize(10);
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 90);
    doc.text(k, 40, y);
    doc.setFont("courier", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(v, 300, y);
    y += 18;
  });

  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Recommended Remediation (NIST SP 800-53)", 40, y);
  y += 8;
  doc.line(40, y, W - 40, y);
  y += 20;
  doc.setFontSize(9);
  mitigations.forEach(([ctrl, action, reduction]) => {
    doc.setFont("courier", "bold");
    doc.setTextColor(160, 110, 0);
    doc.text(ctrl, 40, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(`${action}  (−${reduction}% residual risk)`, W - 160);
    doc.text(lines, 120, y);
    y += 14 * lines.length + 4;
  });

  y += 16;
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("SHA-256 AUDIT HASH", 40, y);
  y += 12;
  doc.setTextColor(40, 40, 40);
  doc.text(doc.splitTextToSize(rec.hash, W - 80), 40, y);

  doc.save(`sentinel_executive_summary_${rec.id}.pdf`);
}
