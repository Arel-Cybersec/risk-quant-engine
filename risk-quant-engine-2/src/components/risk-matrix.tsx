import { motion } from "motion/react";
import { IMPACT, LIKELIHOOD, cellColor, p2 } from "@/lib/risk";

const ROWS = [5, 4, 3, 2, 1];
const COLS = [1, 2, 3, 4, 5];

export function RiskMatrix({
  likelihood,
  impact,
  residualLikelihood,
  residualImpact,
  mode,
  onSelect,
}: {
  likelihood: number;
  impact: number;
  residualLikelihood: number;
  residualImpact: number;
  mode: "inherent" | "residual" | "both";
  onSelect: (l: number, i: number) => void;
}) {
  const activeL = mode === "residual" ? residualLikelihood : likelihood;
  const activeI = mode === "residual" ? residualImpact : impact;

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-around pr-1">
        {ROWS.map((r) => (
          <div
            key={r}
            className="mono w-14 text-right text-[9px] tracking-widest text-muted"
            style={{ color: r === activeI ? "var(--primary)" : undefined }}
          >
            {IMPACT[r - 1].short.toUpperCase()}
          </div>
        ))}
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-5 gap-[3px]">
          {ROWS.map((r) =>
            COLS.map((c) => {
              const score = r * c;
              const isInherent = c === likelihood && r === impact;
              const isResidual = c === residualLikelihood && r === residualImpact;
              const highlighted =
                (mode !== "residual" && isInherent) || (mode !== "inherent" && isResidual);
              return (
                <motion.button
                  key={`${c}-${r}`}
                  onClick={() => onSelect(c, r)}
                  whileHover={{ scale: 1.06, zIndex: 5 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                  className="relative aspect-square rounded-[3px] border text-left"
                  style={{
                    background: highlighted
                      ? `color-mix(in oklab, ${cellColor(score)} 34%, transparent)`
                      : `color-mix(in oklab, ${cellColor(score)} 9%, transparent)`,
                    borderColor: highlighted ? cellColor(score) : "var(--line)",
                    boxShadow: highlighted ? `0 0 18px color-mix(in oklab, ${cellColor(score)} 45%, transparent)` : undefined,
                  }}
                >
                  <span className="mono absolute left-1 top-1 text-[8px] text-muted">
                    {c},{r}
                  </span>
                  <span
                    className="mono absolute bottom-1 right-1 text-[11px] font-bold"
                    style={{ color: highlighted ? cellColor(score) : "var(--muted)" }}
                  >
                    {p2(score)}
                  </span>
                  {mode === "both" && isInherent && (
                    <span className="mono absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[8px] tracking-widest text-bright">
                      INH
                    </span>
                  )}
                  {mode === "both" && isResidual && !isInherent && (
                    <span className="mono absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[8px] tracking-widest text-bright">
                      RES
                    </span>
                  )}
                </motion.button>
              );
            }),
          )}
        </div>
        <div className="mt-2 grid grid-cols-5 gap-[3px]">
          {COLS.map((c) => (
            <div
              key={c}
              className="mono text-center text-[9px] tracking-widest text-muted"
              style={{ color: c === activeL ? "var(--primary)" : undefined }}
            >
              L{c} · {LIKELIHOOD[c - 1].label.slice(0, 5).toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
