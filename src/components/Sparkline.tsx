"use client";

// The readings a watched ticket has taken, drawn against the line: a strip chart the width of the
// ticket. A dot per reading, red over the line and green under it; the dashed rule is the limit.
// Labels live outside the drawing so the chart can stretch without distorting them.
export default function Sparkline({ readings, limit }: { readings: { t: number; pct: number }[]; limit: number }) {
  const W = 600;
  const H = 96;
  const vals = readings.map((r) => r.pct);
  const lo = Math.min(limit, ...vals) * 0.9;
  const hi = Math.max(limit, ...vals) * 1.06 || limit * 1.5;
  const y = (v: number) => H - 10 - ((v - lo) / (hi - lo || 1)) * (H - 20);
  const x = (i: number) => (vals.length <= 1 ? 24 : 12 + (i / (vals.length - 1)) * (W - 24));
  const path = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const lowest = vals.length ? Math.min(...vals) : null;
  return (
    <div className="spk">
      <div className="spk-labels">
        <span>{lowest !== null ? `lowest ${lowest.toFixed(2)}%` : "no reading yet"}</span>
        <span className="spk-line">your line {limit.toFixed(2)}%</span>
        <span>{vals.length ? `latest ${vals[vals.length - 1].toFixed(2)}%` : ""}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label={`${vals.length} readings against a ${limit.toFixed(2)}% line`} style={{ display: "block", width: "100%", height: "96px" }}>
        <rect x="0" y="0" width={W} height={y(limit)} fill="rgba(196,38,29,.06)" />
        <line x1="0" x2={W} y1={y(limit)} y2={y(limit)} stroke="var(--signal)" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
        {vals.length > 1 && <path d={path} fill="none" stroke="var(--text-dim)" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
        {vals.map((v, i) => (
          <ellipse key={i} cx={x(i)} cy={y(v)} rx="5" ry="5" fill={v > limit ? "var(--signal)" : "#0B7A3B"} />
        ))}
      </svg>
      <style dangerouslySetInnerHTML={{ __html: SPK_CSS }} />
    </div>
  );
}

const SPK_CSS = `
.spk{margin:10px 0 6px}
.spk-labels{display:flex;justify-content:space-between;gap:10px;font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim);margin-bottom:4px}
.spk-line{color:var(--signal)}
`;
