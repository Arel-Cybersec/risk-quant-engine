import { useEffect, useRef } from "react";
import { cssVar, useTheme } from "@/lib/theme";
import { fmtUSD, type MonteCarloResult } from "@/lib/risk";

function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const parent = cvs.parentElement!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    cvs.width = w * dpr;
    cvs.height = h * dpr;
    cvs.style.width = `${w}px`;
    cvs.style.height = `${h}px`;
    const ctx = cvs.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/** Loss Exceedance Curve — probability of annual loss exceeding X. */
export function LossExceedanceChart({ result }: { result: MonteCarloResult | null }) {
  const { theme } = useTheme();
  const ref = useCanvas(
    (ctx, w, h) => {
      const pad = { l: 52, r: 14, t: 14, b: 26 };
      const line = cssVar("--line2", "#272c3a");
      const primary = cssVar("--primary");
      const dim = cssVar("--dim", "#8890a8");
      ctx.font = "10px 'JetBrains Mono', monospace";

      const iw = w - pad.l - pad.r;
      const ih = h - pad.t - pad.b;

      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (ih * i) / 4;
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(w - pad.r, y);
        ctx.stroke();
        ctx.fillStyle = dim;
        ctx.textAlign = "right";
        ctx.fillText(`${100 - i * 25}%`, pad.l - 8, y + 3);
      }

      if (!result) {
        ctx.fillStyle = dim;
        ctx.textAlign = "center";
        ctx.fillText("AWAITING SIMULATION", w / 2, h / 2);
        return;
      }

      const maxLoss = Math.max(...result.lec.map((p) => p.loss)) || 1;
      const x = (loss: number) => pad.l + (loss / maxLoss) * iw;
      const y = (prob: number) => pad.t + (1 - prob) * ih;

      const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
      grad.addColorStop(0, primary + "55");
      grad.addColorStop(1, primary + "00");

      ctx.beginPath();
      ctx.moveTo(x(result.lec[0].loss), y(result.lec[0].prob));
      result.lec.forEach((p) => ctx.lineTo(x(p.loss), y(p.prob)));
      ctx.lineTo(x(result.lec[result.lec.length - 1].loss), h - pad.b);
      ctx.lineTo(x(result.lec[0].loss), h - pad.b);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x(result.lec[0].loss), y(result.lec[0].prob));
      result.lec.forEach((p) => ctx.lineTo(x(p.loss), y(p.prob)));
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // P90 marker
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = cssVar("--red", "#fb4f6c");
      ctx.beginPath();
      ctx.moveTo(x(result.p90), pad.t);
      ctx.lineTo(x(result.p90), h - pad.b);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = cssVar("--red", "#fb4f6c");
      ctx.textAlign = "left";
      ctx.fillText(`P90 ${fmtUSD(result.p90)}`, Math.min(x(result.p90) + 5, w - 80), pad.t + 10);

      ctx.fillStyle = dim;
      ctx.textAlign = "center";
      for (let i = 0; i <= 4; i++) {
        const v = (maxLoss * i) / 4;
        ctx.fillText(fmtUSD(v), pad.l + (iw * i) / 4, h - 8);
      }
    },
    [result, theme],
  );

  return (
    <div className="h-[220px] w-full">
      <canvas ref={ref} />
    </div>
  );
}

/** Tornado sensitivity chart — drivers of loss variance. */
export function TornadoChart({ result }: { result: MonteCarloResult | null }) {
  const { theme } = useTheme();
  const ref = useCanvas(
    (ctx, w, h) => {
      const dim = cssVar("--dim", "#8890a8");
      ctx.font = "10px 'JetBrains Mono', monospace";
      if (!result) {
        ctx.fillStyle = dim;
        ctx.textAlign = "center";
        ctx.fillText("AWAITING SIMULATION", w / 2, h / 2);
        return;
      }
      const colors = [cssVar("--red", "#fb4f6c"), cssVar("--orange", "#fb8b50"), cssVar("--amber", "#f6ad37")];
      const barH = 18;
      const gap = 16;
      const left = 12;
      const maxW = w - 24;
      const total = result.tornado.reduce((a, b) => a + b.contribution, 0) || 1;

      result.tornado.forEach((t, i) => {
        const yTop = 14 + i * (barH + gap + 14);
        const pct = t.contribution / total;
        ctx.fillStyle = dim;
        ctx.textAlign = "left";
        ctx.fillText(t.name.toUpperCase(), left, yTop);
        ctx.fillStyle = cssVar("--line2", "#272c3a");
        ctx.fillRect(left, yTop + 6, maxW, barH);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(left, yTop + 6, maxW * pct, barH);
        ctx.fillStyle = cssVar("--bright", "#fff");
        ctx.textAlign = "right";
        ctx.fillText(`${(pct * 100).toFixed(1)}%`, left + maxW - 6, yTop + 19);
      });
    },
    [result, theme],
  );

  return (
    <div className="h-[190px] w-full">
      <canvas ref={ref} />
    </div>
  );
}

/** Sparkline of historic residual scores. */
export function TrendSparkline({ values }: { values: number[] }) {
  const { theme } = useTheme();
  const ref = useCanvas(
    (ctx, w, h) => {
      const primary = cssVar("--primary");
      const dim = cssVar("--dim", "#8890a8");
      ctx.font = "10px 'JetBrains Mono', monospace";
      if (values.length < 2) {
        ctx.fillStyle = dim;
        ctx.textAlign = "center";
        ctx.fillText("MIN. 2 ASSESSMENTS FOR TREND", w / 2, h / 2);
        return;
      }
      const pad = 10;
      const max = 25;
      const step = (w - pad * 2) / (values.length - 1);
      ctx.beginPath();
      values.forEach((v, i) => {
        const x = pad + i * step;
        const y = pad + (1 - v / max) * (h - pad * 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      values.forEach((v, i) => {
        const x = pad + i * step;
        const y = pad + (1 - v / max) * (h - pad * 2);
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = primary;
        ctx.fill();
      });
    },
    [values, theme],
  );
  return (
    <div className="h-[90px] w-full">
      <canvas ref={ref} />
    </div>
  );
}
