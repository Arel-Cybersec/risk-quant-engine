import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CROSSWALK } from "@/lib/risk";

const TABS = [
  { id: "iso", label: "ISO 27001:2022" },
  { id: "cis", label: "CIS CONTROLS v8" },
  { id: "soc2", label: "SOC 2 TSC" },
] as const;

export function Crosswalk() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("iso");

  return (
    <div>
      <div className="mb-3 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="mono relative rounded-[3px] px-2.5 py-1 text-[9px] tracking-widest transition-colors"
            style={{ color: tab === t.id ? "var(--primary)" : "var(--muted)" }}
          >
            {tab === t.id && (
              <motion.span
                layoutId="cw-tab"
                className="absolute inset-0 rounded-[3px] border border-primary bg-primary-dim"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[3px] border border-line">
        <div className="mono grid grid-cols-[1.6fr_0.8fr_1fr] gap-2 border-b border-line bg-bg2 px-2 py-1.5 text-[9px] tracking-widest text-muted">
          <span>NIST CSF 2.0 SUBCATEGORY</span>
          <span>SP 800-53</span>
          <span>{TABS.find((t) => t.id === tab)!.label}</span>
        </div>
        <div className="max-h-[260px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {CROSSWALK.map((row, i) => (
              <motion.div
                key={row.csf}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02, type: "spring", stiffness: 300, damping: 30 }}
                className="mono grid grid-cols-[1.6fr_0.8fr_1fr] gap-2 border-b border-line/60 px-2 py-1.5 text-[10px] transition-colors last:border-0 hover:bg-primary-dim"
              >
                <span className="text-text">{row.csf}</span>
                <span className="text-dim">{row.nist80053}</span>
                <span className="text-primary">{row[tab]}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
