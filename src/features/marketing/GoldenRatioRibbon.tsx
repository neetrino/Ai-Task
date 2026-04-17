/**
 * Decorative SVG: segment split at the golden ratio (≈61.8% / 38.2%).
 * viewBox width 520; segment line from x=12 to x=508 → cut at x≈318.5.
 */
const RIBBON_LINE_X0 = 12;
const RIBBON_LINE_X1 = 508;
const GOLDEN_CUT_X =
  RIBBON_LINE_X0 + (RIBBON_LINE_X1 - RIBBON_LINE_X0) * 0.6180339887;

type GoldenRatioRibbonProps = {
  className?: string;
};

function GoldenRatioRibbonDefs() {
  return (
    <defs>
      <linearGradient id="golden-ribbon-line" x1="0%" x2="100%" y1="0%" y2="0%">
        <stop offset="0%" stopColor="rgb(139 92 246)" stopOpacity="0.88" />
        <stop offset="61.803%" stopColor="rgb(139 92 246)" stopOpacity="0.32" />
        <stop offset="61.803%" stopColor="rgb(167 139 250)" stopOpacity="0.5" />
        <stop offset="100%" stopColor="rgb(196 181 253)" stopOpacity="0.42" />
      </linearGradient>
      <filter id="golden-ribbon-glow" height="140%" width="140%" x="-20%" y="-20%">
        <feGaussianBlur result="blur" stdDeviation="1.6" />
      </filter>
    </defs>
  );
}

function GoldenRatioRibbonLabels({ cutX }: { cutX: number }) {
  return (
    <>
      <text
        fill="rgb(167 139 250 / 0.6)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fontSize="9"
        letterSpacing="0.12em"
        textAnchor="middle"
        x={cutX}
        y="22"
      >
        φ
      </text>
      <text
        fill="rgb(163 163 163 / 0.45)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fontSize="8"
        letterSpacing="0.14em"
        textAnchor="start"
        x="16"
        y="22"
      >
        61.8%
      </text>
      <text
        fill="rgb(163 163 163 / 0.45)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fontSize="8"
        letterSpacing="0.14em"
        textAnchor="end"
        x="504"
        y="22"
      >
        38.2%
      </text>
    </>
  );
}

function GoldenRatioRibbonTracks({ cutX }: { cutX: number }) {
  const h = `M ${RIBBON_LINE_X0} 40 H ${RIBBON_LINE_X1}`;

  return (
    <>
      <rect height="56" opacity="0.22" rx="10" stroke="rgb(139 92 246 / 0.28)" width="520" x="0" y="0" />
      <path d={h} filter="url(#golden-ribbon-glow)" stroke="url(#golden-ribbon-line)" strokeLinecap="round" strokeWidth="2" />
      <path d={h} stroke="url(#golden-ribbon-line)" strokeLinecap="round" strokeWidth="1.25" />
      <path d={`M ${cutX} 28 V 46`} stroke="rgb(167 139 250 / 0.88)" strokeLinecap="round" strokeWidth="1.5" />
    </>
  );
}

export function GoldenRatioRibbon({ className }: GoldenRatioRibbonProps) {
  const cutX = Math.round(GOLDEN_CUT_X * 10) / 10;

  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 520 56" xmlns="http://www.w3.org/2000/svg">
      <GoldenRatioRibbonDefs />
      <GoldenRatioRibbonTracks cutX={cutX} />
      <GoldenRatioRibbonLabels cutX={cutX} />
    </svg>
  );
}
