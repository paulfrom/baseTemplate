type PlatformKey = 'mall' | 'fulfillment' | 'carrier'

interface PlatformIllustrationProps {
  platform: PlatformKey
}

export function PortalNetworkBackdrop() {
  return (
    <svg
      className="portal-network"
      viewBox="0 0 1440 560"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="portal-route-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.2" stopColor="currentColor" stopOpacity="0.34" />
          <stop offset="0.8" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <pattern id="portal-dot-grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="currentColor" opacity="0.16" />
        </pattern>
      </defs>

      <rect width="1440" height="560" fill="url(#portal-dot-grid)" opacity="0.42" />
      <path
        d="M-40 198 C 140 56, 276 292, 438 154 S 766 80, 930 196 S 1248 286, 1488 108"
        fill="none"
        stroke="url(#portal-route-gradient)"
        strokeWidth="2"
        strokeDasharray="8 12"
      />
      <path
        d="M-28 330 C 168 224, 314 410, 508 300 S 842 214, 1038 320 S 1282 398, 1480 276"
        fill="none"
        stroke="url(#portal-route-gradient)"
        strokeWidth="1.5"
        strokeDasharray="5 15"
        opacity="0.7"
      />

      {[112, 312, 520, 736, 952, 1188, 1342].map((cx, index) => (
        <g key={cx} transform={`translate(${cx} ${index % 2 === 0 ? 166 : 248})`}>
          <circle r="9" fill="currentColor" opacity="0.08" />
          <circle r="3.5" fill="currentColor" opacity="0.42" />
        </g>
      ))}

      <g className="portal-network__warehouse" transform="translate(34 364)">
        <path d="M0 54 66 18l66 36v82H0Z" fill="currentColor" opacity="0.035" />
        <path d="M0 54 66 18l66 36M22 136V72h88v64M48 72v64M83 72v64" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.12" />
      </g>
      <g className="portal-network__city" transform="translate(1242 316)" fill="currentColor" opacity="0.045">
        <path d="M0 156V68h36v88Zm44 0V22h52v134Zm60 0V52h30v104Zm38 0V0h42v156Z" />
      </g>
    </svg>
  )
}

export function PlatformIllustration({ platform }: PlatformIllustrationProps) {
  if (platform === 'mall') return <MallIllustration />
  if (platform === 'fulfillment') return <FulfillmentIllustration />
  return <CarrierIllustration />
}

function MallIllustration() {
  return (
    <svg className="portal-illustration" viewBox="0 0 240 152" aria-hidden="true" focusable="false">
      <ellipse cx="118" cy="132" rx="88" ry="10" fill="currentColor" opacity="0.08" />
      <circle cx="188" cy="35" r="26" fill="currentColor" opacity="0.08" />
      <path d="m188 20 13 7v15l-13 8-13-8V27Z" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <path d="M175 27l13 8 13-8M188 35v15" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.65" />

      <path d="m34 75 42-22 42 22-42 24Z" fill="currentColor" opacity="0.16" />
      <path d="m34 75 42 24v37L34 111Z" fill="currentColor" opacity="0.34" />
      <path d="m76 99 42-24v36l-42 25Z" fill="currentColor" opacity="0.58" />
      <path d="M76 53v46M55 64l42 24" fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />

      <rect x="105" y="32" width="70" height="95" rx="9" fill="#fff" stroke="currentColor" strokeWidth="4" />
      <path d="M126 31h28a5 5 0 0 1 5 5v6h-38v-6a5 5 0 0 1 5-5Z" fill="currentColor" opacity="0.9" />
      <path d="M122 61h36M122 76h25M122 91h32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.34" />
      <path d="m124 108 8 8 16-19" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M169 112c0-10 8-18 18-18s18 8 18 18c0 13-18 28-18 28s-18-15-18-28Z" fill="currentColor" />
      <circle cx="187" cy="112" r="6" fill="#fff" />
    </svg>
  )
}

function FulfillmentIllustration() {
  return (
    <svg className="portal-illustration" viewBox="0 0 240 152" aria-hidden="true" focusable="false">
      <ellipse cx="120" cy="133" rx="94" ry="9" fill="currentColor" opacity="0.08" />
      <path d="M24 111c28-20 45-7 68-30 24-23 45-36 78-21 17 8 26-8 45-22" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="5 7" opacity="0.48" />
      <circle cx="25" cy="111" r="8" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <circle cx="214" cy="38" r="8" fill="#fff" stroke="currentColor" strokeWidth="3" />

      <rect x="48" y="27" width="144" height="91" rx="9" fill="#fff" stroke="currentColor" strokeWidth="4" />
      <path d="M48 45h144" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <circle cx="61" cy="36" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="72" cy="36" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="83" cy="36" r="3" fill="currentColor" opacity="0.18" />

      <circle cx="82" cy="76" r="20" fill="currentColor" opacity="0.12" />
      <path d="M82 56a20 20 0 0 1 19 14H82Z" fill="currentColor" opacity="0.9" />
      <path d="M101 70a20 20 0 0 1-11 24l-8-18Z" fill="currentColor" opacity="0.55" />
      <path d="M82 76 90 94a20 20 0 0 1-25-8Z" fill="currentColor" opacity="0.28" />

      <rect x="116" y="82" width="10" height="20" rx="2" fill="currentColor" opacity="0.28" />
      <rect x="132" y="69" width="10" height="33" rx="2" fill="currentColor" opacity="0.48" />
      <rect x="148" y="58" width="10" height="44" rx="2" fill="currentColor" opacity="0.72" />
      <path d="m116 70 18-12 17 4 20-18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M93 118h54l8 14H85Z" fill="currentColor" opacity="0.28" />
      <rect x="76" y="132" width="88" height="5" rx="2.5" fill="currentColor" opacity="0.46" />
    </svg>
  )
}

function CarrierIllustration() {
  return (
    <svg className="portal-illustration" viewBox="0 0 240 152" aria-hidden="true" focusable="false">
      <ellipse cx="118" cy="133" rx="98" ry="9" fill="currentColor" opacity="0.08" />
      <circle cx="179" cy="48" r="32" fill="currentColor" opacity="0.08" />
      <rect x="156" y="21" width="53" height="83" rx="8" fill="#fff" stroke="currentColor" strokeWidth="4" />
      <path d="M169 40h27M169 54h18M169 69h25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.32" />
      <path d="m169 86 7 7 15-18" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M29 67h88v54H29Z" fill="currentColor" opacity="0.56" />
      <path d="M117 82h37l18 22v17h-55Z" fill="currentColor" opacity="0.88" />
      <path d="M128 88h22l11 15h-33Z" fill="#fff" opacity="0.88" />
      <path d="M42 78h59M42 90h59" stroke="#fff" strokeWidth="3" opacity="0.42" />
      <path d="M24 121h154" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.42" />
      <circle cx="56" cy="122" r="13" fill="#fff" stroke="currentColor" strokeWidth="5" />
      <circle cx="143" cy="122" r="13" fill="#fff" stroke="currentColor" strokeWidth="5" />
      <circle cx="56" cy="122" r="4" fill="currentColor" opacity="0.7" />
      <circle cx="143" cy="122" r="4" fill="currentColor" opacity="0.7" />
      <circle cx="205" cy="109" r="17" fill="currentColor" />
      <path d="m197 109 6 6 11-14" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
