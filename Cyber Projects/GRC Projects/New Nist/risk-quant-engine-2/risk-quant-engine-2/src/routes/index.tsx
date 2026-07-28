import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Header } from "@/components/header";
import { Panel, Stat } from "@/components/panel";
import { ParticleField } from "@/components/particle-field";
import { RiskSurface3D } from "@/components/risk-surface";
import { RiskMatrix } from "@/components/risk-matrix";
import { LossExceedanceChart, TornadoChart, TrendSparkline } from "@/components/charts";
import { CveLookup, type EpssData } from "@/components/cve-lookup";
import { Crosswalk } from "@/components/crosswalk";
import { LedgerTable } from "@/components/ledger-table";
import {
  ASSET_TIERS,
  CSF_MAP,
  IMPACT,
  LIKELIHOOD,
  MITIGATION_MAP,
  dampFactor,
  fmtUSD,
  fmtUSDFull,
  runMonteCarlo,
  sha256,
  tierFor,
  type MonteCarloResult,
} from "@/lib/risk";
import { loadLedger, saveRecord, clearLedger, type AssessmentRecord } from "@/lib/ledger";
import { exportCSV, exportExecutivePDF, exportJSON } from "@/lib/export";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SENTINEL_RQ — NIST Risk Assessment & Quantification Console" },
      {
        name: "description",
        content:
          "Quantify cyber risk with a NIST SP 800-30 5×5 matrix, FAIR Monte Carlo ALE simulation, live EPSS threat intel, and multi-framework control crosswalks.",
      },
      { property: "og:title", content: "SENTINEL_RQ — NIST Risk Quantification Console" },
      {
        property: "og:description",
        content:
          "Interactive 3D risk surface, Monte Carlo loss exceedance curves, and NIST CSF 2.0 to ISO 27001 / CIS v8 / SOC 2 crosswalking.",
      },
    ],
  }),
  component: Console,
});

const ITERATION_OPTIONS = [1000, 2500, 5000, 10000];

function Console() {
  const [assetId, setAssetId] = useState(ASSET_TIERS[2].id);
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(3);
  const [controlEff, setControlEff] = useState(35);
  const [iterations, setIterations] = useState(5000);
  const [matrixMode, setMatrixMode] = useState<"inherent" | "residual" | "both">("both");
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [running, setRunning] = useState(false);
  const [ledger, setLedger] = useState<AssessmentRecord[]>([]);
  const [selectedMitigations, setSelectedMitigations] = useState<string[]>([]);
  const [epss, setEpss] = useState<EpssData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [hash, setHash] = useState<string>("");

  const asset = ASSET_TIERS.find((a) => a.id === assetId)!;

  useEffect(() => {
    loadLedger().then(setLedger);
  }, []);

  const damp = dampFactor(controlEff);
  const inherent = likelihood * impact;
  const residualL = Math.max(1, Math.round(likelihood * Math.sqrt(damp)));
  const residualI = Math.max(1, Math.round(impact * Math.sqrt(damp)));
  const residual = residualL * residualI;
  const tier = tierFor(residual);
  const inherentTier = tierFor(inherent);

  // FAIR parameters derived from asset tier, scaled by qualitative posture.
  const fair = useMemo(() => {
    const lMod = 0.45 + (likelihood / 5) * 1.1;
    const iMod = 0.45 + (impact / 5) * 1.1;
    return {
      aroMin: asset.aro[0] * lMod,
      aroLikely: asset.aro[1] * lMod,
      aroMax: asset.aro[2] * lMod,
      sleMin: asset.sle[0] * iMod,
      sleLikely: asset.sle[1] * iMod,
      sleMax: asset.sle[2] * iMod,
    };
  }, [asset, likelihood, impact]);

  const mitigations = MITIGATION_MAP[tier.key];

  const mitigationReduction = useMemo(
    () =>
      mitigations
        .filter((m) => selectedMitigations.includes(m[0]))
        .reduce((acc, m) => acc + m[2], 0),
    [mitigations, selectedMitigations],
  );

  const projectedEff = Math.min(95, controlEff + mitigationReduction);
  const projectedDamp = dampFactor(projectedEff);
  const projectedAle = result ? (result.ale / damp) * projectedDamp : 0;
  const aleSaved = result ? result.ale - projectedAle : 0;
  const remediationCost = mitigationReduction * 11_500 * asset.weight;
  const roi = remediationCost > 0 ? ((aleSaved - remediationCost) / remediationCost) * 100 : 0;

  useEffect(() => {
    setSelectedMitigations([]);
  }, [tier.key]);

  const pushLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setLogs((l) => [`[${ts}] ${msg}`, ...l].slice(0, 40));
  }, []);

  async function execute() {
    setRunning(true);
    pushLog(`Initializing FAIR Monte Carlo · ${iterations.toLocaleString()} iterations`);
    await new Promise((r) => setTimeout(r, 220));

    const res = runMonteCarlo({ ...fair, iterations, damp });
    setResult(res);
    pushLog(`ARO PERT(${fair.aroMin.toFixed(2)}, ${fair.aroLikely.toFixed(2)}, ${fair.aroMax.toFixed(2)})`);
    pushLog(`Control damping applied — ${controlEff}% SP 800-53 effectiveness`);
    pushLog(`ALE converged at ${fmtUSDFull(res.ale)} · P90 ${fmtUSDFull(res.p90)}`);

    const payload = JSON.stringify({
      asset: asset.label,
      likelihood,
      impact,
      inherent,
      residual,
      controlEff,
      ale: res.ale,
      iterations,
      epss: epss?.epss ?? null,
      ts: Date.now(),
    });
    const digest = await sha256(payload);
    setHash(digest);

    const rec: AssessmentRecord = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      asset: asset.label,
      likelihood,
      impact,
      inherent,
      residual,
      tier: tier.label,
      controlEff,
      ale: res.ale,
      p10: res.p10,
      p50: res.p50,
      p90: res.p90,
      iterations,
      hash: digest,
    };
    await saveRecord(rec);
    setLedger((l) => [rec, ...l]);
    pushLog(`Evidence sealed · SHA-256 ${digest.slice(0, 16)}…`);
    setRunning(false);
  }

  function applyEpss(d: EpssData) {
    setEpss(d);
    const lvl = d.epss >= 0.5 ? 5 : d.epss >= 0.2 ? 4 : d.epss >= 0.05 ? 3 : d.epss >= 0.01 ? 2 : 1;
    setLikelihood(lvl);
    pushLog(`${d.cve} EPSS ${(d.epss * 100).toFixed(2)}% → likelihood L${lvl}`);
  }

  const trend = useMemo(() => [...ledger].reverse().map((r) => r.residual).slice(-20), [ledger]);

  return (
    <div className="relative min-h-screen">
      <ParticleField />
      <div className="relative z-10">
        <Header recordCount={ledger.length} />

        <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-3 px-4 py-4 xl:grid-cols-[360px_1fr_380px]">
          {/* ── COLUMN 1 · INPUTS ── */}
          <div className="space-y-3">
            <Panel title="ASSET_CONTEXT" tag="01">
              <label className="mono mb-1 block text-[9px] tracking-widest text-muted">
                ASSET TIER
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="mono w-full rounded-[3px] border border-line bg-bg2 px-2 py-1.5 text-[11px] text-bright outline-none focus:border-primary"
              >
                {ASSET_TIERS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>

              <div className="mt-3">
                <div className="mono mb-1.5 flex items-center justify-between text-[9px] tracking-widest">
                  <span className="text-muted">CONTROL EFFECTIVENESS · SP 800-53</span>
                  <span className="text-primary">{controlEff}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={95}
                  step={5}
                  value={controlEff}
                  onChange={(e) => setControlEff(Number(e.target.value))}
                />
                <div className="mono mt-1.5 text-[9px] text-muted">
                  Risk damping factor ×{damp.toFixed(2)}
                </div>
              </div>
            </Panel>

            <Panel title="THREAT_INTELLIGENCE" tag="FIRST EPSS" delay={0.04}>
              <CveLookup onApply={applyEpss} />
            </Panel>

            <Panel title="QUALITATIVE_SCORING" tag="SP 800-30" delay={0.08}>
              <div className="mono mb-1.5 text-[9px] tracking-widest text-muted">LIKELIHOOD</div>
              <div className="grid grid-cols-5 gap-1">
                {LIKELIHOOD.map((o) => (
                  <motion.button
                    key={o.v}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 460, damping: 24 }}
                    onClick={() => setLikelihood(o.v)}
                    className="mono rounded-[3px] border py-2 text-[10px] transition-colors"
                    style={{
                      borderColor: likelihood === o.v ? "var(--primary)" : "var(--line)",
                      background: likelihood === o.v ? "var(--primary-dim)" : "transparent",
                      color: likelihood === o.v ? "var(--primary)" : "var(--dim)",
                    }}
                  >
                    {o.code}
                  </motion.button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={likelihood}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mono mt-2 text-[9px] leading-relaxed text-muted"
                >
                  <span className="text-primary">{LIKELIHOOD[likelihood - 1].label}</span> —{" "}
                  {LIKELIHOOD[likelihood - 1].desc}
                </motion.p>
              </AnimatePresence>

              <div className="mono mb-1.5 mt-4 text-[9px] tracking-widest text-muted">IMPACT</div>
              <div className="space-y-1">
                {IMPACT.map((o) => (
                  <motion.button
                    key={o.v}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 460, damping: 24 }}
                    onClick={() => setImpact(o.v)}
                    className="mono flex w-full items-center justify-between rounded-[3px] border px-2 py-1.5 text-[10px] transition-colors"
                    style={{
                      borderColor: impact === o.v ? "var(--primary)" : "var(--line)",
                      background: impact === o.v ? "var(--primary-dim)" : "transparent",
                      color: impact === o.v ? "var(--primary)" : "var(--dim)",
                    }}
                  >
                    <span>{o.label}</span>
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <span
                          key={d}
                          className="size-1.5 rounded-full"
                          style={{
                            background: d <= o.v ? "currentColor" : "var(--line2)",
                          }}
                        />
                      ))}
                    </span>
                  </motion.button>
                ))}
              </div>
            </Panel>

            <Panel title="SIMULATION_PARAMETERS" tag="FAIR" delay={0.12}>
              <div className="mono mb-1.5 text-[9px] tracking-widest text-muted">
                MONTE CARLO ITERATIONS
              </div>
              <div className="grid grid-cols-4 gap-1">
                {ITERATION_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setIterations(n)}
                    className="mono relative rounded-[3px] border py-1.5 text-[9px] transition-colors"
                    style={{
                      borderColor: iterations === n ? "var(--primary)" : "var(--line)",
                      color: iterations === n ? "var(--primary)" : "var(--dim)",
                      background: iterations === n ? "var(--primary-dim)" : "transparent",
                    }}
                  >
                    {n / 1000}K
                  </button>
                ))}
              </div>
              <div className="mono mt-3 space-y-1 rounded-[3px] border border-line bg-bg2 p-2 text-[9px]">
                <div className="flex justify-between">
                  <span className="text-muted">ARO PERT</span>
                  <span className="text-text">
                    {fair.aroMin.toFixed(2)} / {fair.aroLikely.toFixed(2)} / {fair.aroMax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">SLE PERT</span>
                  <span className="text-text">
                    {fmtUSD(fair.sleMin)} / {fmtUSD(fair.sleLikely)} / {fmtUSD(fair.sleMax)}
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 460, damping: 26 }}
                onClick={execute}
                disabled={running}
                className="mono mt-3 w-full rounded-[3px] border border-primary bg-primary-dim py-2.5 text-[11px] font-bold tracking-[0.2em] text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                style={{ boxShadow: "0 0 22px var(--primary-glow)" }}
              >
                {running ? "SIMULATING…" : "EXECUTE CALCULATION"}
              </motion.button>
            </Panel>
          </div>

          {/* ── COLUMN 2 · VISUALIZATION ── */}
          <div className="space-y-3">
            <Panel title="3D_RISK_SURFACE" tag="X:LIKELIHOOD  Z:IMPACT  Y:ELEVATION" delay={0.02}>
              <RiskSurface3D likelihood={likelihood} impact={impact} damp={damp} />
            </Panel>

            <Panel title="PROBABILITY_IMPACT_MATRIX" tag="5×5 COORDINATE GRID" delay={0.06}>
              <div className="mb-3 flex gap-1">
                {(["inherent", "residual", "both"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMatrixMode(m)}
                    className="mono relative rounded-[3px] px-2.5 py-1 text-[9px] uppercase tracking-widest"
                    style={{ color: matrixMode === m ? "var(--primary)" : "var(--muted)" }}
                  >
                    {matrixMode === m && (
                      <motion.span
                        layoutId="matrix-mode"
                        className="absolute inset-0 rounded-[3px] border border-primary bg-primary-dim"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span className="relative">{m}</span>
                  </button>
                ))}
              </div>
              <RiskMatrix
                likelihood={likelihood}
                impact={impact}
                residualLikelihood={residualL}
                residualImpact={residualI}
                mode={matrixMode}
                onSelect={(l, i) => {
                  setLikelihood(l);
                  setImpact(i);
                }}
              />
              <div className="mt-3 grid grid-cols-4 gap-2">
                <Stat label="INHERENT" value={String(inherent)} color={inherentTier.color} />
                <Stat label="RESIDUAL" value={String(residual)} color={tier.color} />
                <Stat label="TIER" value={tier.label.replace("_", " ")} color={tier.color} />
                <Stat label="REDUCTION" value={`${Math.round((1 - residual / inherent) * 100)}%`} color="var(--teal)" />
              </div>
            </Panel>

            <Panel title="LOSS_EXCEEDANCE_CURVE" tag={`${iterations.toLocaleString()} ITERATIONS`} delay={0.1}>
              <div className="mb-3 grid grid-cols-4 gap-2">
                <Stat label="ALE" value={result ? fmtUSD(result.ale) : "—"} color="var(--primary)" sub="annualized" />
                <Stat label="P10" value={result ? fmtUSD(result.p10) : "—"} color="var(--green)" sub="optimistic" />
                <Stat label="P50" value={result ? fmtUSD(result.p50) : "—"} color="var(--amber)" sub="expected" />
                <Stat label="P90" value={result ? fmtUSD(result.p90) : "—"} color="var(--red)" sub="worst case" />
              </div>
              <LossExceedanceChart result={result} />
            </Panel>

            <Panel title="SENSITIVITY_ANALYSIS" tag="TORNADO · VARIANCE DRIVERS" delay={0.14}>
              <TornadoChart result={result} />
            </Panel>

            <Panel title="FRAMEWORK_CROSSWALK" tag="CSF 2.0 ↔ ISO / CIS / SOC 2" delay={0.18}>
              <Crosswalk />
            </Panel>
          </div>

          {/* ── COLUMN 3 · RESPONSE ── */}
          <div className="space-y-3">
            <Panel title="WHAT-IF_REMEDIATION" tag="ROI SIMULATOR" delay={0.04}>
              <div className="space-y-1.5">
                {mitigations.map(([ctrl, action, red]) => {
                  const on = selectedMitigations.includes(ctrl);
                  return (
                    <motion.button
                      key={ctrl}
                      layout
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setSelectedMitigations((s) =>
                          s.includes(ctrl) ? s.filter((x) => x !== ctrl) : [...s, ctrl],
                        )
                      }
                      className="flex w-full items-start gap-2 rounded-[3px] border px-2 py-2 text-left transition-colors"
                      style={{
                        borderColor: on ? "var(--primary)" : "var(--line)",
                        background: on ? "var(--primary-dim)" : "transparent",
                      }}
                    >
                      <span
                        className="mt-0.5 size-3 shrink-0 rounded-[2px] border"
                        style={{
                          borderColor: on ? "var(--primary)" : "var(--line2)",
                          background: on ? "var(--primary)" : "transparent",
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="mono block text-[10px] text-primary">{ctrl}</span>
                        <span className="mono block text-[9px] leading-relaxed text-dim">
                          {action}
                        </span>
                      </span>
                      <span className="mono shrink-0 text-[9px] text-teal">−{red}%</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat label="PROJECTED POSTURE" value={`${projectedEff}%`} color="var(--teal)" />
                <Stat
                  label="PROJECTED ALE"
                  value={result ? fmtUSD(projectedAle) : "—"}
                  color="var(--green)"
                />
                <Stat label="ALE AVOIDED" value={result ? fmtUSD(aleSaved) : "—"} color="var(--primary)" />
                <Stat
                  label="REMEDIATION ROI"
                  value={remediationCost > 0 && result ? `${roi.toFixed(0)}%` : "—"}
                  color={roi >= 0 ? "var(--green)" : "var(--red)"}
                  sub={remediationCost > 0 ? `cost ${fmtUSD(remediationCost)}` : "select controls"}
                />
              </div>
            </Panel>

            <Panel title="CSF_2.0_RESPONSE_MAP" tag={tier.label} delay={0.08}>
              <div className="space-y-1">
                {CSF_MAP[tier.key].map(([fn, text]) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                    className="flex items-start gap-2 rounded-[3px] border border-line bg-bg2 px-2 py-1.5"
                  >
                    <span className="mono rounded-[2px] border border-primary px-1 py-0.5 text-[8px] text-primary">
                      {fn}
                    </span>
                    <span className="mono text-[9px] leading-relaxed text-dim">{text}</span>
                  </motion.div>
                ))}
              </div>
            </Panel>

            <Panel title="EVIDENCE_STREAM" tag="RUNTIME LOG" delay={0.12}>
              <div className="max-h-[150px] space-y-0.5 overflow-y-auto">
                {logs.length === 0 && (
                  <div className="mono text-[9px] text-muted">
                    Awaiting parameters — execute calculation to stream evidence
                  </div>
                )}
                {logs.map((l, i) => (
                  <motion.div
                    key={l + i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mono text-[9px] leading-relaxed text-dim"
                  >
                    {l}
                  </motion.div>
                ))}
              </div>
              <div className="mono mt-2 break-all rounded-[3px] border border-line bg-bg2 p-2 text-[8px] text-muted">
                SHA-256 // {hash || "awaiting computation…"}
              </div>
            </Panel>

            <Panel title="ASSESSMENT_LEDGER" tag="INDEXEDDB PERSISTED" delay={0.16}>
              <LedgerTable
                rows={ledger}
                onExport={(r) => exportExecutivePDF(r, MITIGATION_MAP[tierFor(r.residual).key])}
              />
              <div className="mt-3">
                <div className="mono mb-1 text-[9px] tracking-widest text-muted">
                  RESIDUAL SCORE TREND
                </div>
                <TrendSparkline values={trend} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => ledger[0] && exportExecutivePDF(ledger[0], mitigations)}
                  disabled={!ledger.length}
                  className="mono col-span-2 rounded-[3px] border border-primary bg-primary-dim py-2 text-[10px] tracking-widest text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
                >
                  ⬇ GENERATE EXECUTIVE SUMMARY (PDF)
                </button>
                <button
                  onClick={() => exportCSV(ledger)}
                  disabled={!ledger.length}
                  className="mono rounded-[3px] border border-line py-1.5 text-[10px] tracking-widest text-dim transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  ↓ CSV
                </button>
                <button
                  onClick={() => exportJSON(ledger)}
                  disabled={!ledger.length}
                  className="mono rounded-[3px] border border-line py-1.5 text-[10px] tracking-widest text-dim transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                >
                  ↓ JSON
                </button>
                <button
                  onClick={async () => {
                    await clearLedger();
                    setLedger([]);
                    pushLog("Ledger purged — audit chain reset");
                  }}
                  disabled={!ledger.length}
                  className="mono col-span-2 rounded-[3px] border border-line py-1.5 text-[9px] tracking-widest text-muted transition-colors hover:border-red hover:text-red disabled:opacity-40"
                >
                  ⨯ PURGE LEDGER
                </button>
              </div>
            </Panel>
          </div>
        </main>

        <footer className="border-t border-line px-4 py-3">
          <div className="mono mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 text-[9px] tracking-widest text-muted">
            <span>SENTINEL_RQ // NIST SP 800-30 · SP 800-53 · CSF 2.0 · FAIR</span>
            <span>
              SESSION 8829-001-ALPHA · {ledger.length} RECORDS · {iterations.toLocaleString()} ITER
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
