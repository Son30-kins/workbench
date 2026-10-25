"use client";

// Bé mèo mướp xám của mèo nhắc việc — ảnh tĩnh, SVG tự vẽ (phong cách chibi: mắt to, má hồng), không dùng ảnh ngoài.
import { useId } from "react";

const INK = "#3a2f2c";
const FUR = "#cbc2b7";
const STRIPE = "#8b7e71";
const WHITE = "#f8f3ec";
const EAR = "#f2a6a6";
const NOSE = "#ee8e99";
const TONGUE = "#ef7b8b";

const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" } as const;

/** id dùng được trong url(#…) — useId của React có ký tự đặc biệt. */
function useSvgId() {
  return `k${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

function IrisGradient({ id }: { id: string }) {
  return (
    <radialGradient id={id} cx="45%" cy="38%" r="70%">
      <stop offset="0%" stopColor="#9cc0e0" />
      <stop offset="50%" stopColor="#5279a6" />
      <stop offset="100%" stopColor="#233752" />
    </radialGradient>
  );
}

/** Mắt to: viền tối, tròng xanh, đồng tử, hai đốm sáng. */
function Eye({ cx, cy, rx, ry, iris }: { cx: number; cy: number; rx: number; ry: number; iris: string }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={INK} />
      <ellipse cx={cx} cy={cy + 0.6} rx={rx * 0.82} ry={ry * 0.84} fill={`url(#${iris})`} />
      <ellipse cx={cx + rx * 0.05} cy={cy + ry * 0.12} rx={rx * 0.42} ry={ry * 0.5} fill="#15131c" />
      <circle cx={cx - rx * 0.36} cy={cy - ry * 0.38} r={rx * 0.33} fill="#fff" />
      <circle cx={cx + rx * 0.36} cy={cy + ry * 0.5} r={rx * 0.14} fill="#fff" opacity="0.9" />
    </g>
  );
}

const SIT_TAIL = "M124 200 C158 206 178 184 167 160 C160 146 168 131 181 135";

/** Mèo ngồi quay mặt ra — hình của thẻ mèo nhắc việc và thẻ Cài đặt. */
export function SittingKitten({ className }: { className?: string }) {
  const iris = useSvgId();
  return (
    <svg viewBox="0 0 200 224" className={className} aria-hidden>
      <defs>
        <IrisGradient id={iris} />
      </defs>
      <ellipse cx="100" cy="214" rx="64" ry="5" fill={INK} opacity="0.1" />

      <g>
        <path d={SIT_TAIL} stroke={INK} strokeWidth="21" fill="none" strokeLinecap="round" />
        <path d={SIT_TAIL} stroke={FUR} strokeWidth="15" fill="none" strokeLinecap="round" />
        <path d={SIT_TAIL} stroke={STRIPE} strokeWidth="15" fill="none" strokeDasharray="5 10" strokeDashoffset="-4" />
      </g>

      <g>
        <path d="M66 208C54 176 62 138 100 130C138 138 146 176 134 208Z" fill={FUR} {...line} />
        <path d="M65 168q9 0 13-4M63 182q9 1 13-3M135 168q-9 0-13-4M137 182q-9 1-13-3" stroke={STRIPE} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <ellipse cx="74" cy="194" rx="17" ry="15" fill={FUR} {...line} />
        <ellipse cx="126" cy="194" rx="17" ry="15" fill={FUR} {...line} />
        <path d="M64 189q6-4 12-2M136 189q-6-4-12-2" stroke={STRIPE} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M84 160C83 178 83 192 84 204H98C99 192 99 178 98 160Z" fill={FUR} {...line} />
        <path d="M102 160C101 178 101 192 102 204H116C117 192 117 178 116 160Z" fill={FUR} {...line} />
        <path d="M84 134Q100 146 116 134Q122 166 100 182Q78 166 84 134Z" fill={WHITE} />
        <path d="M95 150l5 5 5-5M93 162l7 6 7-6" stroke="#e2d8cc" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="62" cy="207" rx="9" ry="5.5" fill={WHITE} {...line} />
        <ellipse cx="138" cy="207" rx="9" ry="5.5" fill={WHITE} {...line} />
        <ellipse cx="91" cy="205" rx="10" ry="6.5" fill={WHITE} {...line} />
        <ellipse cx="109" cy="205" rx="10" ry="6.5" fill={WHITE} {...line} />
        <path d="M88 201v5M94 201v5M106 201v5M112 201v5" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      </g>

      <g>
        <path d="M58 70 50 22q1-7 8-4l30 28Z" fill={FUR} {...line} />
        <path d="M62 62 56 28l24 19Z" fill={EAR} />
        <path d="M60 50l8-3M61 57l9-2" stroke={WHITE} strokeWidth="2" strokeLinecap="round" />
        <g>
          <path d="M142 70l8-48q-1-7-8-4l-30 28Z" fill={FUR} {...line} />
          <path d="M138 62l6-34-24 19Z" fill={EAR} />
          <path d="M140 50l-8-3M139 57l-9-2" stroke={WHITE} strokeWidth="2" strokeLinecap="round" />
        </g>
        <path
          d="M48 88C46 58 70 40 100 40S154 58 152 88C152 102 150 110 158 116C150 118 146 120 142 120C132 128 116 132 100 132S68 128 58 120C54 120 50 118 42 116C50 110 48 102 48 88Z"
          fill={FUR}
          {...line}
        />
        <path d="M80 104C80 94 120 94 120 104C122 118 110 126 100 126S78 118 80 104Z" fill={WHITE} />
        <path d="M90 50l3 12M100 46v14M110 50l-3 12M50 86q9 0 14 4M51 97q8-1 13 2M150 86q-9 0-14 4M149 97q-8-1-13 2" stroke={STRIPE} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <Eye cx={77} cy={86} rx={14} ry={15.5} iris={iris} />
        <Eye cx={123} cy={86} rx={14} ry={15.5} iris={iris} />
        <path d="M63 78l-5-3M137 78l5-3" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="61" cy="106" rx="8" ry="4.5" fill={EAR} opacity="0.5" />
        <ellipse cx="139" cy="106" rx="8" ry="4.5" fill={EAR} opacity="0.5" />
        <path d="M94 99h12q-1.5 5-6 7-4.5-2-6-7Z" fill={NOSE} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M96.5 110.5q3.5 6 7 0Z" fill={TONGUE} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M100 106v3M91 108q4.5 5 9 1 4.5 4 9-1" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M56 104l-24-5M56 110l-24 1M144 104l24-5M144 110l24 1" stroke={INK} strokeWidth="1.4" opacity="0.7" strokeLinecap="round" />
      </g>
    </svg>
  );
}
