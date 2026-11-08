/**
 * Generic geoscience emblem used as a decorative mark (header and app icon):
 * a balloon rising over layered rock strata. Purely decorative — it is not a
 * logo of any organisation.
 */
export default function Emblem({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Balloon over rock strata"
    >
      <defs>
        <clipPath id="emblem-clip">
          <rect x="2" y="2" width="60" height="60" rx="16" />
        </clipPath>
        <radialGradient id="emblem-balloon" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#ff9a70" />
          <stop offset="0.55" stopColor="#ef5b2b" />
          <stop offset="1" stopColor="#b93d14" />
        </radialGradient>
      </defs>
      <g clipPath="url(#emblem-clip)">
        <rect width="64" height="64" fill="#e6f3fb" />
        <path d="M0 42 C14 36 26 46 40 41 S58 37 64 40 V64 H0Z" fill="#f2b01e" />
        <path d="M0 49 C16 44 28 53 42 48 S58 45 64 47 V64 H0Z" fill="#d8892b" />
        <path d="M0 56 C16 52 30 60 44 55 S58 54 64 55 V64 H0Z" fill="#12a39a" />
      </g>
      <ellipse cx="32" cy="22" rx="11" ry="13.5" fill="url(#emblem-balloon)" />
      <path d="M29.5 34.5 L32 38 L34.5 34.5Z" fill="#b93d14" />
      <path
        d="M32 38 q3 3 -1 6"
        fill="none"
        stroke="#10233f"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <ellipse
        cx="27.5"
        cy="16"
        rx="3"
        ry="4.5"
        fill="#fff"
        opacity="0.45"
        transform="rotate(-18 27.5 16)"
      />
    </svg>
  );
}
