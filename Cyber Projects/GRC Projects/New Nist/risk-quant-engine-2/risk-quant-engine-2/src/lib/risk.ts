/** NIST SP 800-30 / FAIR risk engine — pure functions, no side effects. */

export const LIKELIHOOD = [
  {
    v: 1,
    code: "01",
    label: "Rare",
    desc: "Incredibly low probability. No active exploit vectors observed in current threat intelligence feeds.",
  },
  {
    v: 2,
    code: "02",
    label: "Unlikely",
    desc: "Requires highly specific misconfiguration. No recent telemetry indicates active reconnaissance.",
  },
  {
    v: 3,
    code: "03",
    label: "Likely",
    desc: "Standard target conditions met. Comparable events logged across peer infrastructure in last 90 days.",
  },
  {
    v: 4,
    code: "04",
    label: "Frequent",
    desc: "Highly vulnerable surface. Multiple incidents recorded in current fiscal cycle.",
  },
  {
    v: 5,
    code: "05",
    label: "Certain",
    desc: "Active exploit vectors confirmed. Event already observed multiple times in monitored telemetry.",
  },
] as const;

export const IMPACT = [
  { v: 1, label: "Insignificant", short: "Insig" },
  { v: 2, label: "Minor", short: "Minor" },
  { v: 3, label: "Moderate", short: "Mod" },
  { v: 4, label: "Significant Material", short: "Signif" },
  { v: 5, label: "Catastrophic Failure", short: "Crit" },
] as const;

export type AssetTier = {
  id: string;
  label: string;
  weight: number;
  aro: [number, number, number];
  sle: [number, number, number];
};

export const ASSET_TIERS: AssetTier[] = [
  {
    id: "sandbox",
    label: "Dev Sandbox / Ephemeral Workload",
    weight: 0.55,
    aro: [0.2, 0.8, 2],
    sle: [5_000, 25_000, 90_000],
  },
  {
    id: "internal",
    label: "Internal Business Application",
    weight: 0.8,
    aro: [0.4, 1.4, 3.5],
    sle: [40_000, 140_000, 420_000],
  },
  {
    id: "customer",
    label: "Customer-Facing SaaS Platform",
    weight: 1.0,
    aro: [0.6, 2.2, 5],
    sle: [120_000, 480_000, 1_200_000],
  },
  {
    id: "payment",
    label: "Payment / PCI-DSS Cardholder Zone",
    weight: 1.2,
    aro: [0.5, 2.0, 4.5],
    sle: [300_000, 1_100_000, 3_400_000],
  },
  {
    id: "core",
    label: "Critical Core Database (Crown Jewel)",
    weight: 1.45,
    aro: [0.4, 1.8, 4],
    sle: [700_000, 2_600_000, 9_000_000],
  },
];

export const CSF_MAP: Record<string, [string, string][]> = {
  low: [
    ["ID", "ID.RA-1: Asset vulnerabilities identified & documented"],
    ["DE", "DE.CM-1: Network monitored to detect potential events"],
  ],
  mod: [
    ["PR", "PR.IP-12: Vulnerability management plan developed"],
    ["DE", "DE.AE-2: Detected events analyzed for attack targets/methods"],
    ["RS", "RS.AN-1: Notifications investigated"],
  ],
  high: [
    ["PR", "PR.AC-4: Access permissions managed (least privilege)"],
    ["DE", "DE.CM-4: Malicious code detected"],
    ["RS", "RS.MI-1: Incidents contained"],
    ["RC", "RC.RP-1: Recovery plan executed"],
  ],
  crit: [
    ["GV", "GV.RM-1: Risk mgmt processes escalated to leadership"],
    ["RS", "RS.CO-2: Incidents reported per criteria"],
    ["RS", "RS.MI-2: Incidents mitigated"],
    ["RC", "RC.RP-1: Recovery plan executed during/after incident"],
    ["RC", "RC.CO-3: Recovery activities communicated to stakeholders"],
  ],
};

export const MITIGATION_MAP: Record<string, [string, string, number][]> = {
  low: [
    ["SC-28", "Maintain baseline encryption-at-rest configuration", 6],
    ["RA-5", "Continue quarterly vulnerability scan cadence", 8],
  ],
  mod: [
    ["SC-7", "Segment affected subnet boundary controls, review firewall ruleset", 14],
    ["SI-2", "Apply outstanding patch baseline within 30-day window", 18],
    ["AC-2", "Review account provisioning for the affected asset tier", 10],
  ],
  high: [
    ["SC-7(4)", "Isolate legacy subnet via network segmentation controls", 22],
    ["IA-2(1)", "Enforce FIDO2/WebAuthn phishing-resistant authentication", 26],
    ["SI-4", "Deploy enhanced EDR telemetry on affected hosts", 18],
    ["IR-4", "Activate IR playbook and stage rollback procedures", 12],
  ],
  crit: [
    ["SC-7(4)", "Immediately isolate legacy subnet via segmentation", 24],
    ["IA-2(1)", "Enforce FIDO2 authentication org-wide for this asset class", 27],
    ["CP-10", "Trigger contingency failover to redundant infrastructure", 16],
    ["IR-4", "Escalate to IR team, engage cyber insurance carrier", 14],
    ["RA-7", "Executive risk-response decision within 2-hour SLA", 10],
  ],
};

/** NIST CSF 2.0 → ISO 27001:2022 / CIS v8 / SOC 2 crosswalk */
export const CROSSWALK: {
  csf: string;
  nist80053: string;
  iso: string;
  cis: string;
  soc2: string;
}[] = [
  {
    csf: "GV.RM-01 — Risk objectives established",
    nist80053: "PM-9, RA-1",
    iso: "A.5.1 / A.5.4",
    cis: "CIS 17.1",
    soc2: "CC3.1",
  },
  {
    csf: "ID.AM-01 — Hardware inventory maintained",
    nist80053: "CM-8",
    iso: "A.5.9",
    cis: "CIS 1.1",
    soc2: "CC6.1",
  },
  {
    csf: "ID.RA-01 — Vulnerabilities identified",
    nist80053: "RA-5, SI-2",
    iso: "A.8.8",
    cis: "CIS 7.1",
    soc2: "CC7.1",
  },
  {
    csf: "PR.AA-05 — Least-privilege access enforced",
    nist80053: "AC-2, AC-6",
    iso: "A.5.15 / A.8.2",
    cis: "CIS 6.8",
    soc2: "CC6.3",
  },
  {
    csf: "PR.DS-01 — Data-at-rest protected",
    nist80053: "SC-28",
    iso: "A.8.24",
    cis: "CIS 3.11",
    soc2: "CC6.7",
  },
  {
    csf: "PR.IR-01 — Networks segmented",
    nist80053: "SC-7",
    iso: "A.8.22",
    cis: "CIS 12.2",
    soc2: "CC6.6",
  },
  {
    csf: "DE.CM-01 — Networks monitored",
    nist80053: "SI-4, AU-6",
    iso: "A.8.16",
    cis: "CIS 13.1",
    soc2: "CC7.2",
  },
  {
    csf: "RS.MA-01 — Incident response executed",
    nist80053: "IR-4",
    iso: "A.5.26",
    cis: "CIS 17.4",
    soc2: "CC7.4",
  },
  {
    csf: "RC.RP-01 — Recovery plan executed",
    nist80053: "CP-10",
    iso: "A.5.30",
    cis: "CIS 11.1",
    soc2: "A1.3",
  },
];

export type Tier = { key: "low" | "mod" | "high" | "crit"; label: string; color: string };

export function tierFor(score: number): Tier {
  if (score >= 20) return { key: "crit", label: "CRITICAL_THREAT", color: "var(--red)" };
  if (score >= 12) return { key: "high", label: "HIGH_RISK", color: "var(--orange)" };
  if (score >= 6) return { key: "mod", label: "MODERATE", color: "var(--amber)" };
  return { key: "low", label: "LOW_RISK", color: "var(--green)" };
}

export function cellColor(score: number): string {
  if (score >= 20) return "var(--red)";
  if (score >= 15) return "var(--orange)";
  if (score >= 10) return "var(--amber)";
  if (score >= 6) return "var(--teal)";
  return "var(--green)";
}

export const p2 = (n: number) => String(n).padStart(2, "0");

export function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export const fmtUSDFull = (n: number) =>
  "$" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

/** Control effectiveness damping factor (max 80% risk reduction). */
export const dampFactor = (effectivenessPct: number) => 1 - (effectivenessPct / 100) * 0.8;

/* ── Monte Carlo (FAIR) ─────────────────────────────────────────── */

/** Modified-PERT sample via a Beta approximation. */
function pertSample(min: number, likely: number, max: number, rand: () => number) {
  if (max <= min) return min;
  const mu = (min + 4 * likely + max) / 6;
  const a = mu === likely ? 3 : ((mu - min) * (2 * likely - min - max)) / ((likely - mu) * (max - min));
  const b = (a * (max - mu)) / (mu - min);
  const x = betaSample(Math.max(a, 0.1), Math.max(b, 0.1), rand);
  return min + x * (max - min);
}

function gammaSample(k: number, rand: () => number): number {
  if (k < 1) return gammaSample(k + 1, rand) * Math.pow(rand(), 1 / k);
  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number, v: number;
    do {
      x = normalSample(rand);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rand();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function normalSample(rand: () => number) {
  let u = 0,
    v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function betaSample(a: number, b: number, rand: () => number) {
  const x = gammaSample(a, rand);
  const y = gammaSample(b, rand);
  return x / (x + y);
}

export type MonteCarloInput = {
  aroMin: number;
  aroLikely: number;
  aroMax: number;
  sleMin: number;
  sleLikely: number;
  sleMax: number;
  iterations: number;
  damp: number;
};

export type MonteCarloResult = {
  losses: number[];
  ale: number;
  p10: number;
  p50: number;
  p90: number;
  p99: number;
  max: number;
  iterations: number;
  lec: { loss: number; prob: number }[];
  tornado: { name: string; contribution: number }[];
};

function percentile(sorted: number[], p: number) {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function correlation(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

export function runMonteCarlo(input: MonteCarloInput): MonteCarloResult {
  const { iterations, damp } = input;
  const rand = Math.random;
  const losses = new Array<number>(iterations);
  const aros: number[] = [];
  const sles: number[] = [];
  const ctrls: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const aro = pertSample(input.aroMin, input.aroLikely, input.aroMax, rand);
    const sle = pertSample(input.sleMin, input.sleLikely, input.sleMax, rand);
    // Control efficacy has its own variance around the configured damping level.
    const ctrl = Math.min(1, Math.max(0.05, damp * (0.85 + rand() * 0.3)));
    const loss = aro * sle * ctrl;
    losses[i] = loss;
    aros.push(aro);
    sles.push(sle);
    ctrls.push(ctrl);
  }

  const sorted = [...losses].sort((a, b) => a - b);
  const ale = losses.reduce((a, b) => a + b, 0) / iterations;

  // Loss exceedance curve — 60 points across the distribution.
  const lec: { loss: number; prob: number }[] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const q = i / steps;
    const loss = percentile(sorted, q);
    lec.push({ loss, prob: 1 - q });
  }

  const tornado = [
    { name: "Threat Event Frequency (ARO)", contribution: Math.abs(correlation(aros, losses)) },
    { name: "Loss Magnitude (SLE)", contribution: Math.abs(correlation(sles, losses)) },
    { name: "Control Efficacy Variance", contribution: Math.abs(correlation(ctrls, losses)) },
  ].sort((a, b) => b.contribution - a.contribution);

  return {
    losses,
    ale,
    p10: percentile(sorted, 0.1),
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    p99: percentile(sorted, 0.99),
    max: sorted[sorted.length - 1],
    iterations,
    lec,
    tornado,
  };
}

export async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
