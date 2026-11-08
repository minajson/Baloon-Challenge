import type { ReactNode } from "react";

/**
 * Game 1 — flat illustrations, one per panel description in the source
 * document. Keys are the document's exact panel descriptions. The art is
 * purely visual: no answer text, no captions, and nothing here (or in any
 * filename) names the geoscience term the pair spells out. Where the
 * document says TEXT, the word is printed in bold capitals inside the panel.
 *
 * Every panel is drawn on a 240 × 240 canvas in the same flat style.
 */

const INK = "#10233f";

function Svg({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label={label}
      className="h-full w-full"
    >
      {children}
    </svg>
  );
}

function Shadow({ cx = 120, cy = 206, rx = 80 }: { cx?: number; cy?: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.14} fill={INK} opacity="0.1" />;
}

function Emoji({
  glyph,
  size = 150,
  label,
  y = 150,
}: {
  glyph: string;
  size?: number;
  label: string;
  y?: number;
}) {
  return (
    <Svg label={label}>
      <text
        x="120"
        y={y}
        textAnchor="middle"
        fontSize={size}
        style={{ fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" }}
      >
        {glyph}
      </text>
    </Svg>
  );
}

/** A grey stone, reused at two sizes. */
function Stone({ scale = 1, label }: { scale?: number; label: string }) {
  return (
    <Svg label={label}>
      <Shadow cx={120} cy={196} rx={72 * scale} />
      <g transform={`translate(120 ${(1 - scale) * 70 + 120}) scale(${scale}) translate(-120 -120)`}>
        <path
          d="M52 168 C40 130 60 88 104 76 C140 66 186 82 196 122 C204 150 190 176 160 182 L82 184 C66 184 56 178 52 168Z"
          fill="#9aa4ae"
        />
        <path
          d="M104 76 C140 66 186 82 196 122 C204 150 190 176 160 182 L120 183 C150 160 150 112 104 76Z"
          fill="#7b8691"
        />
        <path d="M70 120 C80 98 104 88 122 86 C102 98 90 112 86 134Z" fill="#c4ccd4" />
        <path d="M128 142 l22 -6 l8 14 l-20 8Z" fill="#6d7782" opacity="0.7" />
      </g>
    </Svg>
  );
}

export interface PanelArt {
  /** Soft panel background. */
  bg: string;
  node: ReactNode;
}

export const PANEL_ART: Record<string, PanelArt> = {
  "A small heap of golden beach sand": {
    bg: "#dff1fb",
    node: (
      <Svg label="A small heap of golden beach sand">
        <Shadow cy={196} rx={92} />
        <path d="M24 196 C60 196 78 128 120 76 C162 128 180 196 216 196Z" fill="#f4c55f" />
        <path d="M120 76 C162 128 180 196 216 196 L154 196 C154 150 144 112 120 76Z" fill="#dca43a" />
        <path d="M60 196 C80 170 96 150 108 112 C100 150 92 176 98 196Z" fill="#ffdc8a" opacity="0.8" />
        {[
          [96, 170], [128, 160], [150, 182], [84, 186], [170, 188], [112, 140], [138, 130], [124, 184],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.6" fill="#b9822a" opacity="0.55" />
        ))}
      </Svg>
    ),
  },

  "A single grey stone": {
    bg: "#eef1f4",
    node: <Stone label="A single grey stone" />,
  },

  "A green lime fruit, cut in half": {
    bg: "#f1f8dc",
    node: (
      <Svg label="A green lime fruit, cut in half">
        <Shadow cy={206} rx={78} />
        <circle cx="120" cy="116" r="86" fill="#5b9b1a" />
        <circle cx="120" cy="116" r="74" fill="#cfe86f" />
        <circle cx="120" cy="116" r="64" fill="#e6f5a0" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4 + Math.PI / 8;
          return (
            <path
              key={i}
              d={`M120 116 L${120 + Math.cos(a - 0.34) * 60} ${116 + Math.sin(a - 0.34) * 60} A60 60 0 0 1 ${120 + Math.cos(a + 0.34) * 60} ${116 + Math.sin(a + 0.34) * 60}Z`}
              fill="#b6d84c"
            />
          );
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1="120"
              y1="116"
              x2={120 + Math.cos(a) * 64}
              y2={116 + Math.sin(a) * 64}
              stroke="#f5fbd2"
              strokeWidth="5"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="120" cy="116" r="9" fill="#f5fbd2" />
        <path d="M168 30 q26 -4 36 14 q-26 8 -36 -14Z" fill="#3d7a12" />
      </Svg>
    ),
  },

  "A puddle of brown mud": {
    bg: "#f6ece0",
    node: (
      <Svg label="A puddle of brown mud">
        <path
          d="M30 150 C20 118 62 98 100 106 C130 88 190 92 206 126 C226 140 214 178 176 182 C150 198 98 200 70 186 C40 184 30 168 30 150Z"
          fill="#7a4d2b"
        />
        <path
          d="M70 186 C98 200 150 198 176 182 C214 178 226 140 206 126 C210 150 190 170 160 170 C120 178 84 176 56 164 C50 176 58 182 70 186Z"
          fill="#5f3a1d"
        />
        <ellipse cx="96" cy="130" rx="26" ry="9" fill="#a06a3f" opacity="0.8" />
        <circle cx="150" cy="138" r="9" fill="#a06a3f" />
        <circle cx="150" cy="138" r="5" fill="#c58c5c" />
        <circle cx="120" cy="156" r="6" fill="#a06a3f" />
        <circle cx="184" cy="150" r="5" fill="#a06a3f" />
        <circle cx="66" cy="62" r="7" fill="#7a4d2b" />
        <circle cx="168" cy="56" r="5" fill="#7a4d2b" />
        <circle cx="120" cy="44" r="4" fill="#7a4d2b" />
      </Svg>
    ),
  },

  "A bed with pillow and blanket": {
    bg: "#e7f1fb",
    node: (
      <Svg label="A bed with pillow and blanket">
        <Shadow cy={204} rx={92} />
        <rect x="22" y="64" width="16" height="132" rx="6" fill="#8a5a33" />
        <rect x="202" y="104" width="14" height="92" rx="6" fill="#8a5a33" />
        <rect x="22" y="150" width="194" height="22" rx="6" fill="#a87244" />
        <rect x="30" y="118" width="178" height="38" rx="12" fill="#f4f6f9" />
        <rect x="30" y="134" width="178" height="30" rx="10" fill="#2f8fd1" />
        <path d="M30 140 H208" stroke="#1f6fa8" strokeWidth="4" />
        <rect x="44" y="100" width="62" height="30" rx="14" fill="#ffffff" />
        <rect x="44" y="118" width="62" height="12" rx="6" fill="#dde6ef" />
        <rect x="32" y="172" width="12" height="24" rx="4" fill="#6e4524" />
        <rect x="196" y="172" width="12" height="24" rx="4" fill="#6e4524" />
        <path d="M150 128 l10 -8 l10 8 l10 -8 l10 8" fill="none" stroke="#7fc3ee" strokeWidth="3" strokeLinecap="round" />
      </Svg>
    ),
  },

  "A large rock": {
    bg: "#eef1f4",
    node: (
      <Svg label="A large rock">
        <Shadow cy={206} rx={100} />
        <path
          d="M18 200 C6 150 30 92 74 62 C112 36 170 40 200 82 C232 124 232 170 214 200Z"
          fill="#8d97a2"
        />
        <path
          d="M74 62 C112 36 170 40 200 82 C232 124 232 170 214 200 L150 200 C190 160 170 90 74 62Z"
          fill="#6b7580"
        />
        <path d="M44 120 C54 88 84 66 112 60 C84 86 70 112 66 150Z" fill="#b9c2cb" />
        <path d="M120 96 l16 24 l-12 18 l-18 -10Z" fill="#5a646f" opacity="0.7" />
        <path d="M60 176 q26 -14 50 -4" fill="none" stroke="#5a646f" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <path d="M30 196 q10 -14 22 -8 q8 6 14 -4" fill="none" stroke="#4f9a3a" strokeWidth="6" strokeLinecap="round" />
      </Svg>
    ),
  },

  "A drop of black oil": {
    bg: "#fbefd9",
    node: (
      <Svg label="A drop of black oil">
        <Shadow cy={210} rx={56} />
        <path
          d="M120 22 C120 22 62 96 62 140 C62 176 88 200 120 200 C152 200 178 176 178 140 C178 96 120 22 120 22Z"
          fill="#15181f"
        />
        <path
          d="M120 22 C150 62 178 104 178 140 C178 176 152 200 120 200 C158 192 160 130 120 22Z"
          fill="#000000"
          opacity="0.55"
        />
        <path d="M86 132 C86 112 96 96 108 80 C100 104 100 126 106 148 C92 150 86 142 86 132Z" fill="#ffffff" opacity="0.38" />
        <circle cx="140" cy="168" r="6" fill="#ffffff" opacity="0.2" />
      </Svg>
    ),
  },

  "A green open field": {
    bg: "#d9eefb",
    node: (
      <Svg label="A green open field">
        <circle cx="188" cy="52" r="24" fill="#ffd048" />
        <path d="M0 132 C50 108 90 124 130 112 S210 100 240 118 V240 H0Z" fill="#7cc24a" />
        <path d="M0 160 C50 140 100 156 140 146 S210 140 240 152 V240 H0Z" fill="#5fae36" />
        <path d="M0 196 C60 180 110 196 160 186 S220 184 240 190 V240 H0Z" fill="#479a28" />
        {[[40, 176], [92, 206], [150, 172], [196, 210], [214, 168]].map(([x, y], i) => (
          <g key={i}>
            <line x1={x} y1={y} x2={x} y2={y + 12} stroke="#2f7a1a" strokeWidth="2" />
            <circle cx={x} cy={y} r="4" fill={i % 2 ? "#ffffff" : "#ffd048"} />
          </g>
        ))}
        <path d="M30 62 q10 -14 24 -6 q12 -10 24 2 q14 0 12 12 H26 q-6 -4 4 -8Z" fill="#ffffff" />
      </Svg>
    ),
  },

  "A salt shaker spilling salt": {
    bg: "#e8f0f8",
    node: (
      <Svg label="A salt shaker spilling salt">
        <Shadow cy={206} rx={88} />
        <path d="M30 206 C60 206 80 176 120 176 C160 176 190 206 214 206Z" fill="#ffffff" />
        <path d="M120 176 C160 176 190 206 214 206 L170 206 C160 190 146 182 120 176Z" fill="#dbe4ee" />
        <g transform="rotate(-24 100 120)">
          <rect x="68" y="66" width="64" height="86" rx="12" fill="#e9f3fb" opacity="0.95" />
          <rect x="68" y="108" width="64" height="44" rx="10" fill="#ffffff" />
          <path d="M68 66 h64 l-6 -18 q-26 -10 -52 0Z" fill="#9aa4ae" />
          <circle cx="92" cy="56" r="2.5" fill="#4a5560" />
          <circle cx="108" cy="52" r="2.5" fill="#4a5560" />
          <circle cx="124" cy="56" r="2.5" fill="#4a5560" />
          <rect x="76" y="74" width="8" height="70" rx="4" fill="#ffffff" opacity="0.9" />
        </g>
        {[[132, 70], [140, 90], [150, 116], [146, 140], [158, 156], [134, 112], [164, 132]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="6" height="6" rx="1.5" fill="#ffffff" stroke="#b6c4d3" strokeWidth="1" transform={`rotate(${i * 25} ${x} ${y})`} />
        ))}
      </Svg>
    ),
  },

  "A domed roof (e.g. a mosque or observatory dome)": {
    bg: "#fdf0d8",
    node: (
      <Svg label="A domed roof, such as a mosque or observatory dome">
        <rect x="0" y="196" width="240" height="44" fill="#e7d3a8" />
        <rect x="46" y="140" width="148" height="62" fill="#f6efe0" />
        <path d="M46 140 H194 V150 H46Z" fill="#d9c8a1" />
        <path d="M58 140 C58 76 84 52 120 52 C156 52 182 76 182 140Z" fill="#1f8fa6" />
        <path d="M120 52 C156 52 182 76 182 140 H150 C150 96 140 66 120 52Z" fill="#17707f" />
        <path d="M78 108 C82 82 98 66 112 62 C96 76 90 92 90 112Z" fill="#6fd0e2" opacity="0.8" />
        <rect x="117" y="28" width="6" height="26" fill="#c99a1b" />
        <circle cx="120" cy="26" r="6" fill="#ffc933" />
        <path d="M60 176 a16 18 0 0 1 32 0 v26 h-32Z" fill="#1f8fa6" />
        <path d="M104 176 a16 18 0 0 1 32 0 v26 h-32Z" fill="#1f8fa6" />
        <path d="M148 176 a16 18 0 0 1 32 0 v26 h-32Z" fill="#1f8fa6" />
        <rect x="20" y="96" width="22" height="106" fill="#f6efe0" />
        <path d="M18 96 L31 62 L44 96Z" fill="#1f8fa6" />
        <rect x="198" y="96" width="22" height="106" fill="#f6efe0" />
        <path d="M196 96 L209 62 L222 96Z" fill="#1f8fa6" />
      </Svg>
    ),
  },

  "Planet Earth (globe)": {
    bg: "#e1ecff",
    node: <Emoji glyph="🌍" size={170} y={182} label="Planet Earth (globe)" />,
  },

  "A duck with a speech bubble saying QUACK": {
    bg: "#fff3cf",
    node: (
      <Svg label="A duck with a speech bubble saying QUACK">
        <text
          x="104"
          y="196"
          textAnchor="middle"
          fontSize="130"
          style={{ fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" }}
        >
          🦆
        </text>
        <path
          d="M104 22 H212 a14 14 0 0 1 14 14 V62 a14 14 0 0 1 -14 14 H164 l-18 20 l2 -20 H104 a14 14 0 0 1 -14 -14 V36 a14 14 0 0 1 14 -14Z"
          fill="#ffffff"
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <text x="158" y="58" textAnchor="middle" fontSize="23" fontWeight="900" fill={INK} style={{ fontFamily: "inherit" }}>
          QUACK!
        </text>
      </Svg>
    ),
  },

  "A pot of black paint": {
    bg: "#eee8f8",
    node: (
      <Svg label="A pot of black paint">
        <Shadow cy={208} rx={80} />
        <path d="M52 100 H188 L180 200 a10 10 0 0 1 -10 8 H70 a10 10 0 0 1 -10 -8Z" fill="#c8d0d9" />
        <path d="M150 100 H188 L180 200 a10 10 0 0 1 -10 8 H138Z" fill="#aab4bf" />
        <ellipse cx="120" cy="100" rx="68" ry="16" fill="#9aa4ae" />
        <ellipse cx="120" cy="100" rx="58" ry="11" fill="#0f1218" />
        <path d="M70 100 q6 24 12 0 q4 34 12 0 q6 18 12 0" fill="#0f1218" />
        <path d="M182 100 q10 22 22 6" fill="none" stroke="#7b8691" strokeWidth="5" strokeLinecap="round" />
        <rect x="74" y="132" width="92" height="44" rx="8" fill="#ffffff" />
        <circle cx="120" cy="154" r="14" fill="#0f1218" />
        <path d="M128 44 L172 12 q10 -6 14 4 q2 8 -6 14 L136 62Z" fill="#c98f4e" />
        <path d="M128 44 L136 62 L112 100 l-12 -10Z" fill="#0f1218" />
        <path d="M100 90 L116 98" stroke="#6e4524" strokeWidth="6" />
      </Svg>
    ),
  },

  "A gold bar": {
    bg: "#f3efe4",
    node: (
      <Svg label="A gold bar">
        <Shadow cy={206} rx={96} />
        {[
          [14, 150],
          [122, 150],
          [68, 96],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M0 54 L16 12 H88 L104 54Z" fill="#f2b81c" />
            <path d="M16 12 H88 L82 26 H22Z" fill="#ffe27a" />
            <path d="M88 12 L104 54 H84 L68 12Z" fill="#cf9500" opacity="0.8" />
            <path d="M22 40 H82" stroke="#cf9500" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          </g>
        ))}
        <path d="M186 60 l5 12 l12 5 l-12 5 l-5 12 l-5 -12 l-12 -5 l12 -5Z" fill="#ffffff" />
        <path d="M40 84 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3Z" fill="#ffffff" />
      </Svg>
    ),
  },

  "A smoking pipe": {
    bg: "#efe6da",
    node: (
      <Svg label="A smoking pipe">
        <Shadow cy={204} rx={84} />
        <path d="M148 96 H212 v62 a10 10 0 0 1 -10 10 H158 a10 10 0 0 1 -10 -10Z" fill="#8a4f24" />
        <path d="M148 96 H212 v14 H148Z" fill="#5d3317" />
        <ellipse cx="180" cy="98" rx="32" ry="8" fill="#2b1a0d" />
        <path d="M30 166 C34 150 56 150 72 160 L150 160 V176 H70 C54 184 30 180 30 166Z" fill="#9a5a2c" />
        <rect x="24" y="158" width="30" height="20" rx="8" fill="#1c1c24" />
        <path d="M172 78 C156 64 188 56 172 40 C160 28 184 22 180 8" fill="none" stroke="#a9b3be" strokeWidth="7" strokeLinecap="round" />
        <path d="M194 74 C182 62 206 56 196 44" fill="none" stroke="#c8d0d9" strokeWidth="6" strokeLinecap="round" />
      </Svg>
    ),
  },

  "A straight ruled line": {
    bg: "#eef5e6",
    node: (
      <Svg label="A straight ruled line">
        <rect x="14" y="78" width="212" height="44" rx="6" fill="#ffd34d" />
        {Array.from({ length: 21 }, (_, i) => (
          <line key={i} x1={24 + i * 9.5} y1="78" x2={24 + i * 9.5} y2={i % 5 === 0 ? 100 : 91} stroke={INK} strokeWidth="2" />
        ))}
        <path d="M14 78 H226" stroke="#e0a800" strokeWidth="3" />
        <line x1="20" y1="150" x2="220" y2="150" stroke={INK} strokeWidth="7" strokeLinecap="round" />
        <path d="M20 150 l12 -8 v16Z M220 150 l-12 -8 v16Z" fill={INK} />
        <path d="M20 190 H220" stroke="#9aa4ae" strokeWidth="3" strokeDasharray="8 8" />
      </Svg>
    ),
  },

  "A power drill": {
    bg: "#e8f0f6",
    node: (
      <Svg label="A power drill">
        <Shadow cy={210} rx={80} />
        <path d="M60 86 H146 a16 16 0 0 1 16 16 V120 H60 a12 12 0 0 1 -12 -12 V98 a12 12 0 0 1 12 -12Z" fill="#ef7a1a" />
        <path d="M60 110 H162 V120 H60Z" fill="#c75d08" />
        <rect x="88" y="120" width="42" height="74" rx="10" fill="#2a3340" transform="rotate(-8 109 157)" />
        <rect x="86" y="190" width="56" height="14" rx="5" fill="#1b212b" transform="rotate(-8 114 197)" />
        <rect x="118" y="124" width="14" height="22" rx="5" fill="#ffc933" transform="rotate(-8 125 135)" />
        <rect x="162" y="94" width="26" height="22" rx="4" fill="#4a5560" />
        <rect x="188" y="98" width="14" height="14" rx="2" fill="#7b8691" />
        <path d="M202 100 H232 L236 105 L232 110 H202Z" fill="#c8d0d9" />
        <path d="M206 100 V110 M214 100 V110 M222 100 V110" stroke="#7b8691" strokeWidth="2" />
        <circle cx="86" cy="98" r="5" fill="#ffffff" opacity="0.7" />
      </Svg>
    ),
  },

  "TEXT: BIT": {
    bg: "#fff1d6",
    node: (
      <Svg label="The word BIT in bold capitals">
        <text
          x="120"
          y="146"
          textAnchor="middle"
          fontSize="104"
          fontWeight="900"
          fill={INK}
          letterSpacing="2"
          style={{ fontFamily: "inherit" }}
        >
          BIT
        </text>
        <rect x="52" y="164" width="136" height="9" rx="4.5" fill="#e2571f" />
      </Svg>
    ),
  },

  "A gas cylinder": {
    bg: "#e5f4ec",
    node: (
      <Svg label="A gas cylinder">
        <Shadow cy={210} rx={64} />
        <rect x="94" y="22" width="52" height="34" rx="8" fill="#4a5560" />
        <rect x="110" y="10" width="20" height="18" rx="4" fill="#7b8691" />
        <path d="M88 56 H152 V68 C176 76 178 96 178 112 V196 a14 14 0 0 1 -14 14 H76 a14 14 0 0 1 -14 -14 V112 C62 96 64 76 88 68Z" fill="#d83a2e" />
        <path d="M130 66 C158 72 178 90 178 112 V196 a14 14 0 0 1 -14 14 H128Z" fill="#a82519" opacity="0.7" />
        <path d="M82 78 C74 90 74 104 74 120 V176 C74 150 80 120 100 96Z" fill="#ff8e83" opacity="0.7" />
        <rect x="62" y="138" width="116" height="38" fill="#ffffff" />
        <path d="M120 144 c10 10 14 16 8 26 c-4 4 -10 4 -16 0 c-8 -8 -2 -16 8 -26Z" fill="#ffa21f" />
        <path d="M120 154 c5 5 6 9 3 13 c-3 2 -6 2 -8 -1 c-2 -4 2 -8 5 -12Z" fill="#ffe07a" />
      </Svg>
    ),
  },

  "A baseball cap": {
    bg: "#e3ecfb",
    node: (
      <Svg label="A baseball cap">
        <Shadow cy={190} rx={92} />
        <path d="M48 150 C44 90 78 54 126 54 C170 54 198 86 198 150Z" fill="#2c5fd0" />
        <path d="M126 54 C170 54 198 86 198 150 H160 C160 100 150 70 126 54Z" fill="#1f46a0" />
        <path d="M70 108 C76 84 98 66 118 62 C98 78 92 96 92 122Z" fill="#6f9bf0" opacity="0.7" />
        <path d="M118 56 H134 V150 H118Z" fill="#1f46a0" opacity="0.35" />
        <circle cx="126" cy="52" r="8" fill="#1f46a0" />
        <path d="M40 150 H220 C230 150 236 160 228 168 C204 188 132 190 74 176 C50 170 36 160 40 150Z" fill="#1f46a0" />
        <path d="M40 150 H220 C228 154 232 158 228 168 C190 168 100 166 52 158 C42 156 38 152 40 150Z" fill="#2c5fd0" />
        <path d="M84 126 l18 0 l-9 -16Z" fill="#ffffff" opacity="0.9" />
      </Svg>
    ),
  },

  "A stack of magazines labelled MAG": {
    bg: "#fbe8ee",
    node: (
      <Svg label="A stack of magazines labelled MAG">
        <Shadow cy={206} rx={90} />
        <rect x="30" y="152" width="170" height="40" rx="5" fill="#2f8fd1" />
        <rect x="30" y="182" width="170" height="10" fill="#1f6fa8" />
        <rect x="42" y="118" width="170" height="38" rx="5" fill="#f2b81c" transform="rotate(4 127 137)" />
        <rect x="42" y="148" width="170" height="8" fill="#cf9500" transform="rotate(4 127 152)" />
        <g transform="rotate(-5 120 90)">
          <rect x="52" y="22" width="132" height="104" rx="6" fill="#ffffff" />
          <rect x="52" y="22" width="132" height="104" rx="6" fill="none" stroke="#dce4ec" strokeWidth="3" />
          <rect x="62" y="32" width="112" height="40" rx="3" fill="#e2571f" />
          <text x="118" y="64" textAnchor="middle" fontSize="38" fontWeight="900" fill="#ffffff" style={{ fontFamily: "inherit" }}>
            MAG
          </text>
          <rect x="62" y="82" width="68" height="8" rx="3" fill="#c8d0d9" />
          <rect x="62" y="96" width="50" height="8" rx="3" fill="#dce4ec" />
          <rect x="62" y="110" width="40" height="8" rx="3" fill="#dce4ec" />
          <rect x="140" y="82" width="34" height="36" rx="3" fill="#7cc3ee" />
        </g>
      </Svg>
    ),
  },

  "A smiling mother with TEXT: MA": {
    bg: "#fdeee4",
    node: (
      <Svg label="A smiling mother with the text MA">
        <text
          x="120"
          y="134"
          textAnchor="middle"
          fontSize="124"
          style={{ fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" }}
        >
          👩🏾
        </text>
        <rect x="50" y="150" width="140" height="72" rx="18" fill="#ffffff" />
        <text x="120" y="208" textAnchor="middle" fontSize="62" fontWeight="900" fill={INK} letterSpacing="3" style={{ fontFamily: "inherit" }}>
          MA
        </text>
      </Svg>
    ),
  },

  "A flame or a thermometer in red": {
    bg: "#fdebe4",
    node: (
      <Svg label="A red thermometer with a flame">
        <text
          x="96"
          y="190"
          textAnchor="middle"
          fontSize="130"
          style={{ fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" }}
        >
          🔥
        </text>
        <rect x="158" y="26" width="30" height="132" rx="15" fill="#ffffff" stroke={INK} strokeWidth="5" />
        <rect x="166" y="70" width="14" height="96" rx="7" fill="#e0301f" />
        <circle cx="173" cy="178" r="26" fill="#ffffff" stroke={INK} strokeWidth="5" />
        <circle cx="173" cy="178" r="17" fill="#e0301f" />
        {[40, 56, 72, 88].map((y) => (
          <line key={y} x1="196" y1={y} x2="210" y2={y} stroke={INK} strokeWidth="4" strokeLinecap="round" />
        ))}
      </Svg>
    ),
  },

  "A metal coiled spring": {
    bg: "#eaf0f6",
    node: (
      <Svg label="A metal coiled spring">
        <Shadow cy={216} rx={56} />
        <rect x="64" y="20" width="112" height="12" rx="6" fill="#7b8691" />
        <rect x="64" y="204" width="112" height="12" rx="6" fill="#7b8691" />
        {Array.from({ length: 7 }, (_, i) => {
          const y = 52 + i * 24;
          return (
            <g key={i}>
              <path d={`M72 ${y} C72 ${y - 14} 168 ${y - 14} 168 ${y + 4} C168 ${y + 20} 72 ${y + 20} 72 ${y}`} fill="none" stroke="#aab4bf" strokeWidth="11" strokeLinecap="round" />
              <path d={`M76 ${y - 4} C100 ${y - 10} 140 ${y - 10} 164 ${y}`} fill="none" stroke="#e3e9ef" strokeWidth="3" strokeLinecap="round" />
            </g>
          );
        })}
        <line x1="120" y1="32" x2="120" y2="48" stroke="#aab4bf" strokeWidth="9" />
      </Svg>
    ),
  },

  "A patch of land on a map": {
    bg: "#f4eedc",
    node: (
      <Svg label="A patch of land on a map">
        <path d="M0 160 C40 140 60 170 100 150 S180 130 240 150 V240 H0Z" fill="#a9d4ee" />
        <path d="M24 40 C60 22 130 26 176 44 C210 60 214 112 190 140 C150 168 86 160 46 140 C16 120 10 62 24 40Z" fill="#9fd07a" stroke="#6aa045" strokeWidth="4" />
        <path d="M44 70 C84 56 128 62 170 78" fill="none" stroke="#6aa045" strokeWidth="2.5" strokeDasharray="6 5" />
        <path d="M40 100 C90 86 140 96 186 108" fill="none" stroke="#6aa045" strokeWidth="2.5" strokeDasharray="6 5" />
        <path d="M70 46 L90 150" stroke="#ffffff" strokeWidth="6" />
        <path d="M70 46 L90 150" stroke="#e2c46a" strokeWidth="2" strokeDasharray="8 6" />
        <g transform="translate(132 30)">
          <path d="M0 52 C-16 28 -22 22 -22 10 A22 22 0 0 1 22 10 C22 22 16 28 0 52Z" fill="#e0301f" />
          <circle cx="0" cy="10" r="8" fill="#ffffff" />
        </g>
        <path d="M200 190 l14 -28 l14 28 l-14 -8Z" fill={INK} />
      </Svg>
    ),
  },

  "A children's playground slide": {
    bg: "#e1f3f0",
    node: (
      <Svg label="A children's playground slide">
        <rect x="0" y="196" width="240" height="44" fill="#8fd26a" />
        <rect x="48" y="44" width="10" height="156" fill="#4a5560" />
        <rect x="78" y="44" width="10" height="156" fill="#4a5560" />
        {[78, 104, 130, 156, 182].map((y) => (
          <rect key={y} x="48" y={y} width="40" height="7" rx="3" fill="#ffb12e" />
        ))}
        <rect x="44" y="40" width="58" height="12" rx="4" fill="#e2571f" />
        <path d="M94 56 C136 66 170 120 198 190 L224 190 C196 112 150 44 94 38Z" fill="#2f8fd1" />
        <path d="M94 56 C136 66 170 120 198 190 L224 190 C220 180 214 170 210 162 C186 112 150 62 96 52Z" fill="#59b0ee" />
        <path d="M94 40 C150 46 198 112 224 190" fill="none" stroke="#1f6fa8" strokeWidth="5" />
        <circle cx="206" cy="212" r="3" fill="#fff" opacity="0.7" />
      </Svg>
    ),
  },

  "Sea waves": {
    bg: "#def1fb",
    node: (
      <Svg label="Sea waves">
        <circle cx="190" cy="48" r="22" fill="#ffd048" />
        <path d="M0 96 C30 76 60 116 90 96 S150 76 180 96 S220 108 240 96 V240 H0Z" fill="#59b6ea" />
        <path d="M0 134 C30 114 60 154 90 134 S150 114 180 134 S220 146 240 134 V240 H0Z" fill="#2f95d8" />
        <path d="M0 172 C30 152 60 192 90 172 S150 152 180 172 S220 184 240 172 V240 H0Z" fill="#1d74b8" />
        <path d="M0 208 C30 190 60 226 90 208 S150 190 180 208 S220 218 240 208 V240 H0Z" fill="#15598f" />
        <path d="M20 106 q10 -8 20 0 M110 100 q10 -8 20 0 M168 140 q10 -8 20 0 M60 146 q10 -8 20 0" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
      </Svg>
    ),
  },

  "A spirit level (bubble level tool)": {
    bg: "#f0f4dc",
    node: (
      <Svg label="A spirit level, a bubble level tool">
        <Shadow cy={168} rx={96} />
        <rect x="12" y="84" width="216" height="64" rx="10" fill="#f2c21b" />
        <rect x="12" y="84" width="216" height="14" rx="7" fill="#ffe27a" />
        <rect x="12" y="136" width="216" height="12" rx="6" fill="#c99a00" />
        <rect x="70" y="102" width="100" height="30" rx="15" fill="#ffffff" stroke={INK} strokeWidth="4" />
        <rect x="74" y="106" width="92" height="22" rx="11" fill="#bfe9a0" />
        <ellipse cx="120" cy="117" rx="16" ry="9" fill="#ffffff" opacity="0.9" />
        <line x1="104" y1="104" x2="104" y2="130" stroke={INK} strokeWidth="2.5" />
        <line x1="136" y1="104" x2="136" y2="130" stroke={INK} strokeWidth="2.5" />
        {[28, 48, 192, 212].map((x) => (
          <circle key={x} cx={x} cy="116" r="8" fill="#ffffff" stroke="#c99a00" strokeWidth="3" />
        ))}
      </Svg>
    ),
  },

  "A glass of water": {
    bg: "#e1f1fb",
    node: (
      <Svg label="A glass of water">
        <Shadow cy={208} rx={62} />
        <path d="M62 34 H178 L164 196 a12 12 0 0 1 -12 12 H88 a12 12 0 0 1 -12 -12Z" fill="#ffffff" opacity="0.85" />
        <path d="M68 92 H172 L164 196 a12 12 0 0 1 -12 12 H88 a12 12 0 0 1 -12 -12Z" fill="#5db8f0" />
        <path d="M68 92 C90 82 112 100 134 92 S160 86 172 92 L170 104 H70Z" fill="#9bd8fa" />
        <path d="M86 112 L94 190" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" opacity="0.7" />
        <circle cx="136" cy="140" r="5" fill="#ffffff" opacity="0.7" />
        <circle cx="120" cy="164" r="3.5" fill="#ffffff" opacity="0.7" />
        <path d="M62 34 H178" stroke="#bfd3e3" strokeWidth="5" strokeLinecap="round" />
        <path d="M62 34 H178 L164 196 a12 12 0 0 1 -12 12 H88 a12 12 0 0 1 -12 -12Z" fill="none" stroke="#bfd3e3" strokeWidth="4" strokeLinejoin="round" />
      </Svg>
    ),
  },

  "A wooden table": {
    bg: "#f6ebdd",
    node: (
      <Svg label="A wooden table">
        <Shadow cy={216} rx={96} />
        <path d="M24 82 H216 L228 108 H12Z" fill="#c98a4b" />
        <rect x="12" y="108" width="216" height="16" rx="4" fill="#9a6130" />
        <rect x="34" y="124" width="18" height="88" rx="4" fill="#9a6130" />
        <rect x="188" y="124" width="18" height="88" rx="4" fill="#9a6130" />
        <rect x="46" y="124" width="148" height="8" fill="#7e4d24" />
        <path d="M48 92 q30 -6 60 0 M130 94 q30 -6 58 0 M40 100 q40 -5 70 0" fill="none" stroke="#a96e38" strokeWidth="3" strokeLinecap="round" />
        <path d="M36 128 V210" stroke="#b97a42" strokeWidth="3" opacity="0.5" />
      </Svg>
    ),
  },

  "A light switch marked OFF": {
    bg: "#eceaf6",
    node: (
      <Svg label="A light switch marked OFF">
        <rect x="64" y="16" width="112" height="208" rx="18" fill="#ffffff" stroke="#cfd6df" strokeWidth="5" />
        <circle cx="120" cy="30" r="4" fill="#cfd6df" />
        <circle cx="120" cy="210" r="4" fill="#cfd6df" />
        <rect x="88" y="52" width="64" height="116" rx="12" fill="#dde4ec" />
        <rect x="94" y="58" width="52" height="104" rx="10" fill="#eef2f6" />
        <rect x="94" y="112" width="52" height="50" rx="10" fill="#c3ccd6" />
        <text x="120" y="152" textAnchor="middle" fontSize="26" fontWeight="900" fill={INK} style={{ fontFamily: "inherit" }}>
          OFF
        </text>
        <circle cx="120" cy="82" r="6" fill="#ffffff" stroke="#cfd6df" strokeWidth="2" />
      </Svg>
    ),
  },

  "A beach shoreline": {
    bg: "#def1fb",
    node: (
      <Svg label="A beach shoreline">
        <path d="M0 0 H240 V92 C200 108 170 82 130 98 S50 110 0 94Z" fill="#2f9fe0" />
        <path d="M0 70 C40 84 80 62 120 78 S200 90 240 72 V92 C200 108 170 82 130 98 S50 110 0 94Z" fill="#5fc0f2" />
        <path d="M0 96 C50 112 90 98 130 102 S200 112 240 96 V108 C200 124 170 112 130 116 S50 126 0 110Z" fill="#ffffff" />
        <path d="M0 110 C50 126 90 112 130 116 S200 126 240 110 V240 H0Z" fill="#f4d58a" />
        <path d="M0 150 C50 140 100 160 150 150 S220 144 240 152 V240 H0Z" fill="#ebc56a" />
        <g transform="translate(176 140)">
          <path d="M0 52 C4 24 10 8 14 -6" stroke="#8a5a33" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M14 -6 C-6 -22 -28 -10 -34 4 C-18 -6 0 -6 14 -6Z" fill="#3d9a3a" />
          <path d="M14 -6 C34 -24 54 -12 56 4 C40 -8 26 -6 14 -6Z" fill="#4fb04a" />
          <path d="M14 -6 C4 -30 -4 -34 -16 -30 C0 -24 8 -16 14 -6Z" fill="#2f8a2c" />
        </g>
        <path d="M30 190 q6 -8 12 0 q6 -8 12 0" fill="none" stroke="#c99a3a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="76" cy="206" r="5" fill="#ffffff" stroke="#e3a8b5" strokeWidth="2" />
      </Svg>
    ),
  },

  "A traditional water well with bucket": {
    bg: "#e8f1e4",
    node: (
      <Svg label="A traditional water well with a bucket">
        <Shadow cy={214} rx={86} />
        <rect x="54" y="150" width="132" height="62" rx="6" fill="#a9b2bb" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect key={`${r}-${c}`} x={58 + c * 32 + (r % 2) * 14} y={154 + r * 19} width="28" height="15" rx="3" fill={(r + c) % 2 ? "#c3cad1" : "#b3bcc5"} />
          )),
        )}
        <ellipse cx="120" cy="150" rx="66" ry="14" fill="#7b8691" />
        <ellipse cx="120" cy="150" rx="54" ry="9" fill="#26323f" />
        <rect x="52" y="44" width="10" height="110" fill="#8a5a33" />
        <rect x="178" y="44" width="10" height="110" fill="#8a5a33" />
        <path d="M40 48 L120 14 L200 48Z" fill="#c95a2b" />
        <path d="M120 14 L200 48 H150Z" fill="#a8441b" />
        <rect x="52" y="60" width="136" height="8" fill="#8a5a33" />
        <line x1="120" y1="68" x2="120" y2="126" stroke="#6e4524" strokeWidth="3" />
        <path d="M100 126 H140 L134 156 a6 6 0 0 1 -6 4 H112 a6 6 0 0 1 -6 -4Z" fill="#b87a3e" />
        <path d="M100 126 H140" stroke="#7d4f22" strokeWidth="5" />
        <path d="M104 126 C108 112 132 112 136 126" fill="none" stroke="#4a5560" strokeWidth="3" />
      </Svg>
    ),
  },

  "A human head (side profile)": {
    bg: "#e9eaf7",
    node: (
      <Svg label="A human head in side profile">
        <path
          d="M120 22 C74 22 52 58 54 98 C55 118 62 130 62 148 C62 162 70 170 84 172 L84 204 C84 214 92 220 104 220 H176 C176 200 170 188 160 180 C152 174 154 164 160 160 C170 156 172 148 164 144 C170 140 170 132 164 128 C168 118 170 106 164 96 C160 84 174 78 178 74 C182 70 180 66 174 64 C168 62 160 50 154 42 C146 30 134 22 120 22Z"
          fill="#d99a6c"
          transform="translate(-6 0)"
        />
        <path d="M46 98 C40 52 74 18 122 18 C160 18 184 44 184 74 C160 64 150 50 142 46 C118 38 80 44 70 78 C66 92 66 104 70 114 C60 118 50 112 46 98Z" fill="#2a1d18" transform="translate(-6 0)" />
        <circle cx="146" cy="88" r="5" fill={INK} />
        <path d="M134 78 C140 74 148 74 154 78" fill="none" stroke="#2a1d18" strokeWidth="4" strokeLinecap="round" />
        <path d="M158 142 C164 144 168 144 170 142" fill="none" stroke="#a15d3a" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="108" cy="104" rx="10" ry="14" fill="#c4825a" />
      </Svg>
    ),
  },

  "A yawning, bored person": {
    bg: "#f2f0e2",
    node: <Emoji glyph="🥱" size={170} y={184} label="A yawning, bored person" />,
  },

  "A hole in the ground": {
    bg: "#d9eefb",
    node: (
      <Svg label="A hole in the ground">
        <rect x="0" y="108" width="240" height="132" fill="#9a6a3e" />
        <rect x="0" y="108" width="240" height="14" fill="#6fba3e" />
        <path d="M0 122 H240" stroke="#4f9a2a" strokeWidth="5" />
        <path d="M62 122 C58 170 78 216 120 218 C162 216 182 170 178 122Z" fill="#2b1d12" />
        <path d="M62 122 C58 140 62 156 68 170 C74 150 84 134 98 122Z" fill="#5d3e22" opacity="0.8" />
        <ellipse cx="120" cy="122" rx="58" ry="12" fill="#1a110a" />
        <ellipse cx="120" cy="122" rx="58" ry="12" fill="none" stroke="#7a5230" strokeWidth="4" />
        <path d="M24 86 q6 -22 12 0 M200 90 q6 -22 12 0 M48 96 q4 -14 8 0" fill="none" stroke="#4f9a2a" strokeWidth="5" strokeLinecap="round" />
        <circle cx="30" cy="170" r="6" fill="#7a5230" />
        <circle cx="208" cy="190" r="8" fill="#7a5230" />
        <circle cx="196" cy="150" r="5" fill="#b98a58" />
        <circle cx="44" cy="206" r="5" fill="#b98a58" />
        <circle cx="200" cy="42" r="22" fill="#ffd048" />
      </Svg>
    ),
  },

  "A flooded street": {
    bg: "#e6eef5",
    node: (
      <Svg label="A flooded street">
        <rect x="0" y="0" width="240" height="120" fill="#d8e4ee" />
        <rect x="8" y="34" width="62" height="100" fill="#e2a23b" />
        <rect x="76" y="14" width="54" height="120" fill="#c8553f" />
        <rect x="136" y="46" width="62" height="88" fill="#6c8fb8" />
        <rect x="200" y="28" width="36" height="106" fill="#8d9aa6" />
        {[[18, 46], [42, 46], [18, 74], [42, 74], [86, 28], [108, 28], [86, 58], [108, 58], [146, 60], [172, 60], [146, 88], [172, 88]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="16" height="16" rx="2" fill="#f7f0d2" />
        ))}
        <rect x="0" y="134" width="240" height="106" fill="#6a7682" />
        <path d="M0 134 H240 V240 H0Z" fill="#3e9ad8" opacity="0.88" />
        <path d="M0 160 C30 150 50 170 80 160 S130 150 160 160 S210 170 240 160" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.7" strokeLinecap="round" />
        <path d="M0 196 C30 186 50 206 80 196 S130 186 160 196 S210 206 240 196" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.5" strokeLinecap="round" />
        <path d="M70 168 C70 150 80 142 96 142 H140 C152 142 160 150 164 164 L170 170 V184 H66V170Z" fill="#f2c21b" />
        <path d="M84 148 H122 V164 H78Z M128 148 H146 C152 148 156 156 158 164 H128Z" fill="#cfe8f6" />
        <rect x="66" y="176" width="108" height="12" fill="#3e9ad8" opacity="0.9" />
        <path d="M60 188 q10 -8 20 0 M150 196 q10 -8 20 0" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      </Svg>
    ),
  },

  "An aeroplane": {
    bg: "#dcecfb",
    node: (
      <Svg label="An aeroplane">
        <path d="M14 76 q16 -4 24 6 q-14 6 -24 -6Z" fill="#ffffff" />
        <path d="M170 168 q16 -4 24 6 q-14 6 -24 -6Z" fill="#ffffff" />
        <g transform="rotate(-18 120 120)">
          <path d="M28 120 C28 108 44 102 64 102 H176 C204 102 228 112 232 120 C228 128 204 138 176 138 H64 C44 138 28 132 28 120Z" fill="#ffffff" />
          <path d="M28 120 C28 132 44 138 64 138 H176 C204 138 228 128 232 120 C210 128 90 130 28 120Z" fill="#d3dde8" />
          <path d="M28 114 L8 78 H34 L62 108Z" fill="#e2571f" />
          <path d="M96 106 L66 56 H96 L144 106Z" fill="#cdd9e6" />
          <path d="M96 134 L66 184 H96 L144 134Z" fill="#b8c7d6" />
          <rect x="182" y="110" width="9" height="9" rx="3" fill="#2f8fd1" />
          <rect x="198" y="110" width="9" height="9" rx="3" fill="#2f8fd1" />
          <rect x="214" y="111" width="8" height="8" rx="3" fill="#2f8fd1" />
          {[64, 84, 104, 124, 144].map((x) => (
            <rect key={x} x={x} y="112" width="8" height="8" rx="3" fill="#2f8fd1" opacity="0.7" />
          ))}
          <path d="M40 120 H170" stroke="#e2571f" strokeWidth="4" />
        </g>
      </Svg>
    ),
  },
};

export function artFor(description: string): PanelArt | undefined {
  return PANEL_ART[description];
}
