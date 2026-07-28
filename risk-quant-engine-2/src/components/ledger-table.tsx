import { motion, AnimatePresence } from "motion/react";
import type { AssessmentRecord } from "@/lib/ledger";
import { fmtUSD } from "@/lib/risk";

export function LedgerTable({
  rows,
  onExport,
}: {
  rows: AssessmentRecord[];
  onExport: (r: AssessmentRecord) => void;
}) {
  if (!rows.length) {
    return (
      <div className="mono rounded-[3px] border border-dashed border-line px-3 py-8 text-center text-[10px] tracking-widest text-muted">
        NO ASSESSMENTS LOGGED — EXECUTE A CALCULATION TO POPULATE THE LEDGER
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[3px] border border-line">
      <div className="mono grid grid-cols-[86px_1fr_54px_54px_74px_88px] gap-2 border-b border-line bg-bg2 px-2 py-1.5 text-[9px] tracking-widest text-muted">
        <span>TIMESTAMP</span>
        <span>ASSET</span>
        <span>INH</span>
        <span>RES</span>
        <span>ALE</span>
        <span>AUDIT HASH</span>
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.button
              key={r.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={() => onExport(r)}
              title="Generate executive summary PDF for this record"
              className="mono grid w-full grid-cols-[86px_1fr_54px_54px_74px_88px] gap-2 border-b border-line/60 px-2 py-1.5 text-left text-[10px] transition-colors last:border-0 hover:bg-primary-dim"
            >
              <span className="text-muted">
                {new Date(r.ts).toLocaleTimeString("en-GB", { hour12: false })}
              </span>
              <span className="truncate text-text">{r.asset}</span>
              <span className="text-dim">{r.inherent}</span>
              <span className="text-primary">{r.residual}</span>
              <span className="text-teal">{fmtUSD(r.ale)}</span>
              <span className="truncate text-muted">{r.hash.slice(0, 12)}…</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
