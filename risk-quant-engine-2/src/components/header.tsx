import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { THEMES, useTheme } from "@/lib/theme";

export function Header({ recordCount }: { recordCount: number }) {
  const { theme, setTheme } = useTheme();
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="size-2 rounded-full bg-primary"
            style={{ boxShadow: "0 0 10px var(--primary-glow)" }}
          />
          <div>
            <div className="glow-text text-[13px] font-bold tracking-[0.22em] text-primary">
              SENTINEL_RQ
            </div>
            <div className="mono text-[8px] tracking-[0.3em] text-muted">
              NIST SP 800-30 · FAIR QUANTIFICATION
            </div>
          </div>
        </div>

        <div className="mono ml-auto hidden items-center gap-3 text-[9px] tracking-widest text-muted md:flex">
          <span className="rounded-[3px] border border-line px-2 py-1">
            <span className="text-primary">{recordCount}</span> ASSESSMENTS_LOGGED
          </span>
          <span className="rounded-[3px] border border-line px-2 py-1 text-dim">{clock}</span>
        </div>

        <div className="flex items-center gap-1 rounded-[4px] border border-line p-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={t.label}
              className="mono relative rounded-[3px] px-2 py-1 text-[9px] tracking-widest transition-colors"
              style={{ color: theme === t.id ? "var(--bright)" : "var(--muted)" }}
            >
              {theme === t.id && (
                <motion.span
                  layoutId="theme-pill"
                  className="absolute inset-0 rounded-[3px] border border-primary bg-primary-dim"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: t.swatch }} />
                <span className="hidden sm:inline">{t.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
