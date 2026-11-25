import type { ReactNode } from "react";

export type PotionTone = "violet" | "dream" | "cinema" | "midnight";

type Stops = [string, string, string];

// Four-point sparkle centred on (cx, cy).
function star(cx: number, cy: number, r: number) {
  const k = r * 0.24;
  return `M${cx} ${cy - r}L${cx + k} ${cy - k}L${cx + r} ${cy}L${cx + k} ${cy + k}L${cx} ${cy + r}L${cx - k} ${cy + k}L${cx - r} ${cy}L${cx - k} ${cy - k}Z`;
}

// Shared premium-glass rendering: halo, clipped liquid, glass sheen, rim and highlight.
function GlassVessel({
  id,
  body,
  surfaceY,
  stops,
  highlight,
  inner,
  cap,
  outer,
}: {
  id: string;
  body: string;
  surfaceY: number;
  stops: Stops;
  highlight: string;
  inner?: ReactNode;
  cap?: ReactNode;
  outer?: ReactNode;
}) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-liquid`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="0.55" stopColor={stops[1]} />
          <stop offset="1" stopColor={stops[2]} />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="0.82" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.24" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={body} />
        </clipPath>
        <filter id={`${id}-blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <path d={body} fill={stops[1]} opacity="0.42" filter={`url(#${id}-blur)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="0" y={surfaceY} width="200" height={300 - surfaceY} fill={`url(#${id}-liquid)`} />
        <ellipse cx="100" cy={surfaceY} rx="92" ry="4.5" fill={stops[0]} opacity="0.95" />
        {inner}
        <path d={body} fill={`url(#${id}-glass)`} />
      </g>
      <path
        d={body}
        fill="none"
        stroke="rgba(245,238,255,0.6)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d={highlight}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {cap}
      {outer}
    </>
  );
}

const capStroke = {
  stroke: "rgba(245,238,255,0.6)",
  strokeWidth: 1.2,
  strokeLinejoin: "round" as const,
};

function VioletStatic() {
  return (
    <GlassVessel
      id="violet"
      body="M86 58H114V118L160 232L146 262H54L40 232L86 118Z"
      surfaceY={168}
      stops={["#CDA6FF", "#8A3CFF", "#3A0B99"]}
      highlight="M83 136L57 204"
      inner={
        <polyline
          className="static-arc"
          points="62,198 88,210 80,222 112,236 102,246 136,254"
          fill="none"
          stroke="#7DF5FF"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      }
      cap={
        <>
          <path
            d="M84 58L86 36L94 28H106L114 36L116 58Z"
            fill="rgba(216,184,255,0.2)"
            {...capStroke}
          />
          <rect x="80" y="56" width="40" height="6" fill="#1a0f2e" {...capStroke} />
        </>
      }
      outer={
        <>
          <path className="spark" d={star(152, 118, 9)} fill="#7DF5FF" />
          <path className="spark d2" d={star(42, 152, 6)} fill="#7DF5FF" />
          <path className="spark d3" d={star(168, 198, 5)} fill="#B8FAFF" />
          <path className="spark d1" d={star(128, 86, 4)} fill="#B8FAFF" />
        </>
      }
    />
  );
}

function DaydreamDrift() {
  return (
    <GlassVessel
      id="dream"
      body="M92 64H108V96C108 112 160 146 160 200C160 238 133 266 100 266C67 266 40 238 40 200C40 146 92 112 92 96Z"
      surfaceY={172}
      stops={["#FFE3F1", "#F2A6D0", "#A98BF0"]}
      highlight="M68 172C57 188 55 212 64 232"
      inner={
        <>
          <circle cx="86" cy="214" r="3" fill="#fff" opacity="0.55" />
          <circle cx="118" cy="236" r="2" fill="#fff" opacity="0.5" />
          <circle cx="104" cy="196" r="1.6" fill="#fff" opacity="0.6" />
        </>
      }
      cap={
        <>
          <rect x="89" y="54" width="22" height="12" rx="3" fill="#1a0f2e" {...capStroke} />
          <circle cx="100" cy="38" r="15" fill="rgba(255,226,242,0.32)" {...capStroke} />
          <circle cx="94" cy="33" r="4" fill="#fff" opacity="0.5" />
        </>
      }
      outer={
        <g filter="url(#dream-blur)">
          <ellipse className="mist" cx="54" cy="244" rx="52" ry="14" fill="#FFD3EA" opacity="0.5" />
          <ellipse
            className="mist m2"
            cx="150"
            cy="226"
            rx="44"
            ry="12"
            fill="#D9C4FF"
            opacity="0.45"
          />
          <ellipse
            className="mist m3"
            cx="128"
            cy="72"
            rx="38"
            ry="10"
            fill="#FFE8F4"
            opacity="0.3"
          />
        </g>
      }
    />
  );
}

function MainCharacterElixir() {
  return (
    <GlassVessel
      id="cinema"
      body="M88 80H112V100L154 128L166 192L138 262H62L34 192L46 128L88 100Z"
      surfaceY={146}
      stops={["#FF9C7A", "#FF3FA0", "#9C0E5E"]}
      highlight="M52 138L44 184"
      cap={
        <>
          <rect x="88" y="66" width="24" height="15" fill="#1a0f2e" {...capStroke} />
          <path d="M100 10L124 34L114 66H86L76 34Z" fill="rgba(255,110,180,0.26)" {...capStroke} />
          <path
            d="M76 34H124M100 10L91 34L100 66L109 34Z"
            fill="none"
            stroke="rgba(255,235,245,0.45)"
            strokeWidth="1"
          />
        </>
      }
      outer={
        <>
          <path
            d="M46 128L100 152L154 128M34 192L100 152L166 192M62 262L100 152L138 262M88 100L100 152L112 100"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.2"
            strokeWidth="1"
          />
          <path className="spark" d={star(158, 94, 8)} fill="#FFD2C2" />
          <path className="spark d2" d={star(38, 110, 5)} fill="#fff" />
          <path className="spark d3" d={star(170, 240, 5)} fill="#FF9C7A" />
        </>
      }
    />
  );
}

function MidnightSpark() {
  return (
    <g transform="translate(-16 0)">
      <GlassVessel
        id="midnight"
        body="M96 52L120 46C150 108 152 200 112 264Q100 280 88 262C124 200 122 118 96 52Z"
        surfaceY={120}
        stops={["#6B95FF", "#2338A8", "#0A0F4C"]}
        highlight="M106 78C120 116 124 160 119 198"
        inner={
          <>
            <circle className="spark" cx="128" cy="160" r="1.8" fill="#BDF8FF" />
            <circle className="spark d2" cx="122" cy="214" r="1.4" fill="#BDF8FF" />
            <circle className="spark d3" cx="134" cy="128" r="1.2" fill="#BDF8FF" />
          </>
        }
        cap={
          <>
            <path d="M95 52L92 26L114 21L120 46Z" fill="rgba(150,190,255,0.22)" {...capStroke} />
            <circle cx="103" cy="18" r="5" fill="#CFF7FF" opacity="0.8" />
          </>
        }
        outer={
          <>
            <path d="M70 58A14 14 0 1 0 70 86A10 10 0 1 1 70 58Z" fill="#CFF7FF" opacity="0.75" />
            <circle className="spark" cx="156" cy="84" r="2.6" fill="#A8F6FF" />
            <circle className="spark d1" cx="166" cy="152" r="2" fill="#A8F6FF" />
            <circle className="spark d2" cx="76" cy="132" r="2.2" fill="#A8F6FF" />
            <circle className="spark d3" cx="158" cy="232" r="1.8" fill="#E2FBFF" />
            <circle className="spark d1" cx="70" cy="208" r="1.6" fill="#E2FBFF" />
          </>
        }
      />
    </g>
  );
}

const bottles: Record<PotionTone, () => ReactNode> = {
  violet: VioletStatic,
  dream: DaydreamDrift,
  cinema: MainCharacterElixir,
  midnight: MidnightSpark,
};

export function PotionBottle({ tone }: { tone: PotionTone }) {
  const Bottle = bottles[tone];
  return (
    <svg
      className="potion-svg"
      viewBox="0 0 200 300"
      width="190"
      height="285"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
    >
      <Bottle />
    </svg>
  );
}
