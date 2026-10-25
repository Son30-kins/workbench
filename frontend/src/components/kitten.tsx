"use client";

// Bé mèo mướp xám của mèo nhắc việc — SVG tự vẽ (lấy cảm hứng phong cách chibi: mắt to, má hồng), không dùng ảnh ngoài.
// Chuyển động bằng CSS (globals.css, nhóm .kitten-*) và SMIL cho đuôi; tắt hết khi `animate={false}`.
import { useId } from "react";
import { cn } from "@/lib/cn";

const INK = "#3a2f2c";
const FUR = "#cbc2b7";
const FUR_FAR = "#b3a99d"; // chân phía xa, tối hơn một chút cho có chiều sâu
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

/** Mắt to: viền tối, tròng xanh, đồng tử, hai đốm sáng. Nhóm .kitten-eye để chớp mắt. */
function Eye({ cx, cy, rx, ry, iris }: { cx: number; cy: number; rx: number; ry: number; iris: string }) {
  return (
    <g className="kitten-eye">
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={INK} />
      <ellipse cx={cx} cy={cy + 0.6} rx={rx * 0.82} ry={ry * 0.84} fill={`url(#${iris})`} />
      <ellipse cx={cx + rx * 0.05} cy={cy + ry * 0.12} rx={rx * 0.42} ry={ry * 0.5} fill="#15131c" />
      <circle cx={cx - rx * 0.36} cy={cy - ry * 0.38} r={rx * 0.33} fill="#fff" />
      <circle cx={cx + rx * 0.36} cy={cy + ry * 0.5} r={rx * 0.14} fill="#fff" opacity="0.9" />
    </g>
  );
}

const SIT_TAIL = "M124 200 C158 206 178 184 167 160 C160 146 168 131 181 135";

/** Mèo ngồi quay mặt ra — lúc mèo nói. Thở, nghiêng đầu, chớp mắt, giật tai, vẫy đuôi. */
export function SittingKitten({ className, animate = true }: { className?: string; animate?: boolean }) {
  const iris = useSvgId();
  return (
    <svg viewBox="0 0 200 224" className={cn(animate && "kitten-live", className)} aria-hidden>
      <defs>
        <IrisGradient id={iris} />
      </defs>
      <ellipse cx="100" cy="214" rx="64" ry="5" fill={INK} opacity="0.1" />

      <g className="kitten-tail">
        <path d={SIT_TAIL} stroke={INK} strokeWidth="21" fill="none" strokeLinecap="round" />
        <path d={SIT_TAIL} stroke={FUR} strokeWidth="15" fill="none" strokeLinecap="round" />
        <path d={SIT_TAIL} stroke={STRIPE} strokeWidth="15" fill="none" strokeDasharray="5 10" strokeDashoffset="-4" />
      </g>

      <g className="kitten-breathe">
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

      <g className="kitten-head">
        <path d="M58 70 50 22q1-7 8-4l30 28Z" fill={FUR} {...line} />
        <path d="M62 62 56 28l24 19Z" fill={EAR} />
        <path d="M60 50l8-3M61 57l9-2" stroke={WHITE} strokeWidth="2" strokeLinecap="round" />
        <g className="kitten-ear">
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

/**
 * Một chân có khớp: đoạn trên xoay quanh vai / hông, đoạn dưới xoay quanh gối, bàn chân trắng. Vẽ 2 lớp cùng chuyển
 * động — lớp viền tối bên dưới, lớp lông bên trên — để chỗ nối khớp liền mạch, không lộ vết cắt.
 */
function Leg({ x, y, kind, far, upper, lower }: { x: number; y: number; kind: "front" | "hind"; far?: boolean; upper: number; lower: number }) {
  const upperWidth = kind === "hind" ? 17 : 14;
  const lowerWidth = kind === "hind" ? 10 : 11;
  const layer = (outline: boolean) => {
    const fur = outline ? INK : far ? FUR_FAR : FUR;
    const grow = outline ? 6 : 0;
    return (
      <g transform={`translate(${x} ${y})`}>
        <g className={cn("kleg-upper", `kleg-${kind}-upper`, far && "kleg-far")}>
          {/* Bắp đùi chân sau */}
          {kind === "hind" && <ellipse cx="1" cy="4" rx={19 + grow / 2} ry={21 + grow / 2} fill={fur} />}
          <line x1="0" y1="0" x2="0" y2={upper} stroke={fur} strokeWidth={upperWidth + grow} strokeLinecap="round" />
          <g transform={`translate(0 ${upper})`}>
            <g className={cn("kleg-lower", `kleg-${kind}-lower`, far && "kleg-far")}>
              <line x1="0" y1="0" x2="0" y2={lower} stroke={fur} strokeWidth={lowerWidth + grow} strokeLinecap="round" />
              <ellipse cx="-3.5" cy={lower + 1} rx={8.5 + grow / 2} ry={5 + grow / 2} fill={outline ? INK : far ? "#e9e2d8" : WHITE} />
            </g>
          </g>
        </g>
      </g>
    );
  };
  return (
    <>
      {layer(true)}
      {layer(false)}
    </>
  );
}

const WALK_TAIL = ["M186 76C208 68 204 40 220 30", "M186 76C210 64 216 42 210 24", "M186 76C208 68 204 40 220 30"];

/**
 * Mèo đi nhìn ngang, mặt quay sang trái. Bốn chân bước so le (chân trước và chân sau cùng bên lệch nửa nhịp),
 * thân nhún theo bước, đầu giữ thăng bằng, đuôi uốn lượn. Lật sang phải bằng scaleX(-1) ở thẻ bọc ngoài.
 */
export function WalkingKitten({ className, animate = true }: { className?: string; animate?: boolean }) {
  const iris = useSvgId();
  const tail = (stroke: string, width: number, extra?: React.SVGProps<SVGPathElement>) => (
    <path d={WALK_TAIL[0]} stroke={stroke} strokeWidth={width} fill="none" strokeLinecap={extra?.strokeDasharray ? "butt" : "round"} {...extra}>
      {animate && <animate attributeName="d" values={WALK_TAIL.join(";")} dur="1.3s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />}
    </path>
  );
  return (
    <svg viewBox="0 0 240 160" className={cn(animate && "kitten-walking", className)} aria-hidden>
      <defs>
        <IrisGradient id={iris} />
      </defs>
      <ellipse cx="132" cy="152" rx="70" ry="4.5" fill={INK} opacity="0.1" />

      {/* Chân phía xa — sau thân */}
      <Leg x={108} y={95} kind="front" far upper={24} lower={22} />
      <Leg x={166} y={90} kind="hind" far upper={24} lower={28} />

      <g className="kitten-bob">
        {tail(INK, 17)}
        {tail(FUR, 11)}
        {tail(STRIPE, 11, { strokeDasharray: "5 8" })}
        <ellipse cx="138" cy="86" rx="56" ry="28" fill={FUR} {...line} />
        <path d="M112 60q7 13 3 26M130 58q7 14 3 28M148 59q7 13 3 26M166 64q6 11 2 22" stroke={STRIPE} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M98 100Q138 120 180 101Q174 111 138 113Q104 111 98 100Z" fill={WHITE} />
      </g>

      {/* Chân phía gần — trước thân */}
      <Leg x={96} y={97} kind="front" upper={24} lower={22} />
      <Leg x={176} y={92} kind="hind" upper={24} lower={28} />

      <g className="kitten-bob">
        <g transform="translate(70 66)">
          <g className="kitten-head-walk">
          <path d="M18-34 34-56q6-2 6 5l-2 39Z" fill={FUR} {...line} />
          <path d="M22-34 35-49l-1 29Z" fill={EAR} />
          <path d="M-32-14-38-52q2-6 8-2L-6-34Z" fill={FUR} {...line} />
          <path d="M-29-20-33-46l21 13Z" fill={EAR} />
          <path d="M-31-30l7-2M-30-24l8-1" stroke={WHITE} strokeWidth="2" strokeLinecap="round" />
          <path
            d="M-40 2C-42-24-20-38 4-38S44-24 42 2C42 14 38 22 30 28C20 34 10 36 0 36C-12 36-24 32-32 26C-36 26-40 24-46 22C-40 16-40 10-40 2Z"
            fill={FUR}
            {...line}
          />
          <path d="M-34 14C-34 4-6 2-4 12C-2 24-12 30-20 30S-36 24-34 14Z" fill={WHITE} />
          <path d="M-10-32l2 9M-2-34v10M6-32l-2 9M30 0q-7 1-11 4M29 10q-7 0-10 3" stroke={STRIPE} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <Eye cx={-23} cy={2} rx={11} ry={12.5} iris={iris} />
          <Eye cx={7} cy={0} rx={9} ry={11} iris={iris} />
          <ellipse cx="-37" cy="15" rx="5.5" ry="3.2" fill={EAR} opacity="0.5" />
          <ellipse cx="15" cy="14" rx="5.5" ry="3.2" fill={EAR} opacity="0.5" />
          <path d="M-25 12h9q-1 4-4.5 5.5-3.5-1.5-4.5-5.5Z" fill={NOSE} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M-23.2 20.6q2.7 4.6 5.4 0Z" fill={TONGUE} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
          <path d="M-20.5 17.5v2.5M-27 19q3 4 6.5 1 3 3 6.5-1" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M-42 15l-18-4M-42 20l-18 2" stroke={INK} strokeWidth="1.3" opacity="0.7" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  );
}
