import { channelToCenters, HDCenter, CENTER_LABELS } from "@/lib/humandesign";

// Schematic BodyGraph: 9 centers in canonical positions; defined centers filled,
// defined channels drawn as connecting lines. Simplified (not gate-precise).
const POS: Record<HDCenter, { x: number; y: number; w: number; h: number; shape: "tri" | "rect" | "diamond" }> = {
  Head: { x: 130, y: 24, w: 56, h: 40, shape: "tri" },
  Ajna: { x: 130, y: 92, w: 56, h: 40, shape: "tri" },
  Throat: { x: 130, y: 158, w: 64, h: 48, shape: "rect" },
  G: { x: 130, y: 236, w: 60, h: 60, shape: "diamond" },
  Heart: { x: 196, y: 250, w: 40, h: 34, shape: "rect" },
  SolarPlexus: { x: 214, y: 332, w: 52, h: 44, shape: "rect" },
  Sacral: { x: 130, y: 332, w: 60, h: 48, shape: "rect" },
  Spleen: { x: 46, y: 332, w: 52, h: 44, shape: "rect" },
  Root: { x: 130, y: 408, w: 64, h: 48, shape: "rect" },
};

const ORDER: HDCenter[] = ["Head", "Ajna", "Throat", "G", "Heart", "SolarPlexus", "Sacral", "Spleen", "Root"];

export function BodyGraph({ defined, channels }: { defined: HDCenter[]; channels: string[] }) {
  const isDef = (c: HDCenter) => defined.includes(c);
  const lines = channels
    .map((ch) => channelToCenters(ch))
    .filter(Boolean)
    .map((pair) => pair as [HDCenter, HDCenter]);

  return (
    <svg viewBox="0 0 260 456" className="mx-auto h-[420px] w-full max-w-[280px]">
      {lines.map(([a, b], i) => (
        <line key={i} x1={POS[a].x} y1={POS[a].y} x2={POS[b].x} y2={POS[b].y} stroke="#34d399" strokeWidth={3} opacity={0.8} />
      ))}
      {ORDER.map((c) => {
        const p = POS[c];
        const fill = isDef(c) ? "#7c6cf6" : "#1f2330";
        const stroke = isDef(c) ? "#a99bff" : "#3a3f4f";
        if (p.shape === "diamond") {
          const pts = `${p.x},${p.y - p.h / 2} ${p.x + p.w / 2},${p.y} ${p.x},${p.y + p.h / 2} ${p.x - p.w / 2},${p.y}`;
          return <polygon key={c} points={pts} fill={fill} stroke={stroke} strokeWidth={2} />;
        }
        if (p.shape === "tri") {
          const up = c === "Head";
          const pts = up
            ? `${p.x},${p.y - p.h / 2} ${p.x + p.w / 2},${p.y + p.h / 2} ${p.x - p.w / 2},${p.y + p.h / 2}`
            : `${p.x},${p.y + p.h / 2} ${p.x + p.w / 2},${p.y - p.h / 2} ${p.x - p.w / 2},${p.y - p.h / 2}`;
          return <polygon key={c} points={pts} fill={fill} stroke={stroke} strokeWidth={2} />;
        }
        return <rect key={c} x={p.x - p.w / 2} y={p.y - p.h / 2} width={p.w} height={p.h} rx={6} fill={fill} stroke={stroke} strokeWidth={2} />;
      })}
      {ORDER.map((c) => (
        <text key={c} x={POS[c].x} y={POS[c].y + 3} textAnchor="middle" fontSize="8" fill={isDef(c) ? "#fff" : "#8b91a3"}>
          {CENTER_LABELS[c]}
        </text>
      ))}
    </svg>
  );
}
