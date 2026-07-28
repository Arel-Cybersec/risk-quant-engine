import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Panel({
  title,
  tag,
  children,
  className = "",
  delay = 0,
}: {
  title: string;
  tag?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30, delay }}
      className={`grain relative rounded-[5px] border border-line bg-panel/85 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <h2 className="mono text-[10px] font-semibold tracking-[0.22em] text-bright">{title}</h2>
        {tag && <span className="mono text-[9px] tracking-widest text-muted">{tag}</span>}
      </div>
      <div className="p-3">{children}</div>
    </motion.section>
  );
}

export function Stat({
  label,
  value,
  color = "var(--bright)",
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[3px] border border-line bg-bg2 px-2.5 py-2">
      <div className="mono text-[8px] tracking-[0.2em] text-muted">{label}</div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="mono mt-1 text-[17px] font-bold leading-none"
        style={{ color }}
      >
        {value}
      </motion.div>
      {sub && <div className="mono mt-1 text-[8px] text-muted">{sub}</div>}
    </div>
  );
}
