// Mascot mèo cam của Workbench — SVG tự vẽ (không dùng ảnh ngoài, không lo bản quyền).
// Màu cố định để mèo trông giống nhau ở cả chế độ sáng và tối; chuyển động định nghĩa trong globals.css.
import { cn } from "@/lib/cn";

const INK = "#3b2a2f";
const FUR = "#ffb36b";
const STRIPE = "#ee8a3c";
const PINK = "#ff8fa6";
const NOSE = "#ff6f8e";
const MUZZLE = "#fff4e8";

const outline = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round" } as const;

/** Logo: mặt mèo một màu (theo currentColor), mắt và mũi khoét rỗng, má hồng. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-label="Workbench" role="img">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4.6 13.2 4.3 4.4c0-1.8 1.7-2.5 2.9-1.6L12 7q4-1.1 8 0l4.8-4.2c1.2-.9 2.9-.2 2.9 1.6l-.3 8.8q1.6 2.4 1.6 5.4C29 24.9 23.2 29 16 29S3 24.9 3 18.6q0-3 1.6-5.4ZM9.3 17.5a1.7 2.1 0 1 0 3.4 0 1.7 2.1 0 1 0-3.4 0Zm10 0a1.7 2.1 0 1 0 3.4 0 1.7 2.1 0 1 0-3.4 0Zm-4.7 3.7h2.8L16 22.9Z"
      />
      <circle cx="7.8" cy="21.8" r="1.6" fill={PINK} />
      <circle cx="24.2" cy="21.8" r="1.6" fill={PINK} />
    </svg>
  );
}

/** Dấu chân mèo một màu (theo currentColor). */
export function PawPrint({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 21c-3 0-5.5-1.6-5.5-4 0-2.6 2.6-5 5.5-5s5.5 2.4 5.5 5c0 2.4-2.5 4-5.5 4Z" />
      <circle cx="5.5" cy="10.5" r="2.2" />
      <circle cx="9.3" cy="6.2" r="2.3" />
      <circle cx="14.7" cy="6.2" r="2.3" />
      <circle cx="18.5" cy="10.5" r="2.2" />
    </svg>
  );
}

/** Đầu mèo mắt tròn, tâm (60, 46) — dùng chung cho mèo ló đầu và mèo trong hộp. */
function CatHead() {
  return (
    <>
      <path d="M32 31 28.5 8q0-4.5 4-2.5L52 21Z" fill={FUR} {...outline} />
      <path d="M88 31 91.5 8q0-4.5-4-2.5L68 21Z" fill={FUR} {...outline} />
      <path d="M34 23 32 11l12 8Z" fill={PINK} />
      <path d="M86 23 88 11l-12 8Z" fill={PINK} />
      <ellipse cx="60" cy="46" rx="34" ry="27" fill={FUR} {...outline} />
      <path d="M60 20v8M51 21.5l1.5 6.5M69 21.5 67.5 28" stroke={STRIPE} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="60" cy="56" rx="13" ry="8.5" fill={MUZZLE} />
      <circle cx="46" cy="45" r="4.5" fill={INK} />
      <circle cx="74" cy="45" r="4.5" fill={INK} />
      <circle cx="47.6" cy="43.4" r="1.6" fill="#fff" />
      <circle cx="75.6" cy="43.4" r="1.6" fill="#fff" />
      <ellipse cx="37" cy="53" rx="5.5" ry="3.2" fill={PINK} opacity="0.75" />
      <ellipse cx="83" cy="53" rx="5.5" ry="3.2" fill={PINK} opacity="0.75" />
      <path d="M56.5 51.5h7l-3.5 4Z" fill={NOSE} stroke={NOSE} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M60 55.5V58m-6 0q3 3 6 0 3 3 6 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="m27 49-11-2.5M27 54l-11 1.5M93 49l11-2.5M93 54l11 1.5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
}

function Paw({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="10.5" ry="7.5" fill={FUR} {...outline} />
      <path d={`M${cx - 3.5} ${cy - 4}v3.5M${cx + 3.5} ${cy - 4}v3.5`} stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
}

/** Mèo ló đầu, hai chân bám mép dưới — đặt sát mép trên của một khối (bảng, nút…). */
export function PeekingCat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 74" className={className} aria-hidden>
      <g className="cat-wiggle">
        <CatHead />
      </g>
      <Paw cx={42} cy={66} />
      <Paw cx={78} cy={66} />
    </svg>
  );
}

/** Mèo cuộn tròn ngủ — dùng cho trạng thái trống. */
export function SleepingCat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 112" className={className} aria-hidden>
      <ellipse cx="82" cy="106" rx="58" ry="4" fill={INK} opacity="0.08" />
      <g className="cat-breathe">
        <ellipse cx="86" cy="76" rx="52" ry="28" fill={FUR} {...outline} />
        <path d="M96 49.5q5 8 0 16M111 52q5 7 0 14M124 58q4 6 0 11" stroke={STRIPE} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M134 86q-2 18-30 18-20 0-32-6" stroke={INK} strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M134 86q-2 18-30 18-20 0-32-6" stroke={FUR} strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M34 65 29 43q0-4 4-2.5L50 54Z" fill={FUR} {...outline} />
        <path d="M82 65 87 43q0-4-4-2.5L66 54Z" fill={FUR} {...outline} />
        <path d="m35 58-2.5-12 11.5 7Z" fill={PINK} />
        <path d="m81 58 2.5-12-11.5 7Z" fill={PINK} />
        <ellipse cx="58" cy="74" rx="27" ry="23" fill={FUR} {...outline} />
        <path d="M58 52.5v6M51 53.5l1.5 5M65 53.5l-1.5 5" stroke={STRIPE} strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="58" cy="84" rx="11" ry="7" fill={MUZZLE} />
        <path d="M43 75q5 4.5 10 0M63 75q5 4.5 10 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <ellipse cx="40" cy="83" rx="5" ry="3" fill={PINK} opacity="0.75" />
        <ellipse cx="76" cy="83" rx="5" ry="3" fill={PINK} opacity="0.75" />
        <path d="M55 80.5h6l-3 3.5Z" fill={NOSE} stroke={NOSE} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M58 84v2m-4.5 0q2.25 2.5 4.5 0 2.25 2.5 4.5 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="m32 80-10-1.5M32 85l-10 2M84 80l10-1.5M84 85l10 2" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="48" cy="97" rx="8" ry="5.5" fill={FUR} {...outline} />
        <ellipse cx="68" cy="97" rx="8" ry="5.5" fill={FUR} {...outline} />
      </g>
      <path className="cat-zzz" d="M98 30h10L98 42h10" stroke={PINK} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path className="cat-zzz-2" d="M116 14h7l-7 8.5h7" stroke={PINK} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Mèo trốn trong thùng giấy — trang 404. */
export function CatInBox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 150" className={className} aria-hidden>
      <ellipse cx="80" cy="144" rx="64" ry="5" fill={INK} opacity="0.08" />
      <path d="M30 82 42 68h76l12 14Z" fill="#b97a45" {...outline} />
      <path d="M42 68 22 56 12 72l18 10Z" fill="#e6ad73" {...outline} />
      <path d="m118 68 20-12 10 16-18 10Z" fill="#e6ad73" {...outline} />
      <g transform="translate(20 20)">
        <g className="cat-wiggle">
          <CatHead />
        </g>
      </g>
      <rect x="30" y="82" width="100" height="58" rx="4" fill="#f0bf86" {...outline} />
      <rect x="73" y="83.5" width="14" height="18" fill="#fde7c8" />
      <g transform="translate(68 108)" fill={INK} opacity="0.22">
        <path d="M12 21c-3 0-5.5-1.6-5.5-4 0-2.6 2.6-5 5.5-5s5.5 2.4 5.5 5c0 2.4-2.5 4-5.5 4Z" />
        <circle cx="5.5" cy="10.5" r="2.2" />
        <circle cx="9.3" cy="6.2" r="2.3" />
        <circle cx="14.7" cy="6.2" r="2.3" />
        <circle cx="18.5" cy="10.5" r="2.2" />
      </g>
      <Paw cx={54} cy={82} />
      <Paw cx={106} cy={82} />
    </svg>
  );
}

/** Một chân, xoay quanh đỉnh khi đi (CSS .cat-leg trong globals.css). */
function Leg({ x, y, far, phase }: { x: number; y: number; far?: boolean; phase: "a" | "b" }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect className={`cat-leg cat-leg-${phase}`} x="-4" y="0" width="8" height="21" rx="4" fill={far ? STRIPE : FUR} {...outline} />
    </g>
  );
}

/**
 * Mèo nhìn ngang, mặt quay sang trái — dùng cho mèo nhắc việc. Thêm class `walking` để bốn chân bước và thân nhún;
 * đuôi luôn vẫy nhẹ. Lật sang phải bằng scaleX(-1) ở thẻ bọc ngoài.
 */
export function WalkingCat({ className, walking }: { className?: string; walking?: boolean }) {
  return (
    <svg viewBox="0 0 120 84" className={cn(walking && "walking", className)} aria-hidden>
      <ellipse cx="62" cy="80" rx="34" ry="3" fill={INK} opacity="0.1" />
      {/* Hai chân phía xa (sau thân) */}
      <Leg x={48} y={57} far phase="b" />
      <Leg x={82} y={57} far phase="a" />
      <g className="cat-bob">
        <g className="cat-tail-wag" style={{ transformOrigin: "88px 44px", transformBox: "view-box" }}>
          <path d="M88 44c16-2 22-14 16-26" stroke={INK} strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M88 44c16-2 22-14 16-26" stroke={FUR} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </g>
        <ellipse cx="62" cy="48" rx="29" ry="15" fill={FUR} {...outline} />
        <path d="M56 34q3 6 0 11M66 34.5q3 6 0 11M76 36q3 5 0 9.5" stroke={STRIPE} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </g>
      {/* Hai chân phía gần (trước thân) */}
      <Leg x={40} y={56} phase="a" />
      <Leg x={74} y={56} phase="b" />
      <g className="cat-bob">
        <path d="M36 21 44 7q2-2 2.5 1L45 27Z" fill={FUR} {...outline} />
        <path d="M16 27 14 11q0-3 2.5-1.5L27 20Z" fill={FUR} {...outline} />
        <path d="m18 22-1-9 7 6Z" fill={PINK} />
        <path d="m38 20 5.5-9v12Z" fill={PINK} />
        <circle cx="30" cy="34" r="16" fill={FUR} {...outline} />
        <path d="M28 19.5v5M34 20.5l-1 4.5" stroke={STRIPE} strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="30" cy="41" rx="7" ry="4.6" fill={MUZZLE} />
        <circle cx="24" cy="33" r="2.6" fill={INK} />
        <circle cx="36" cy="33" r="2.6" fill={INK} />
        <circle cx="25" cy="32" r="0.9" fill="#fff" />
        <circle cx="37" cy="32" r="0.9" fill="#fff" />
        <ellipse cx="19.5" cy="39" rx="3" ry="1.8" fill={PINK} opacity="0.75" />
        <ellipse cx="40.5" cy="39" rx="3" ry="1.8" fill={PINK} opacity="0.75" />
        <path d="M28.3 38.6h3.4l-1.7 2Z" fill={NOSE} stroke={NOSE} strokeWidth="1" strokeLinejoin="round" />
        <path d="M30 40.6V42m-3 0q1.5 1.5 3 0 1.5 1.5 3 0" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="m15 39-8-1m8 4-8 1.5" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Trạng thái trống có mèo ngủ. */
export function EmptyState({ children, className, size = "md" }: { children: React.ReactNode; className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 text-center text-fg-2", className)}>
      <SleepingCat className={size === "md" ? "w-40" : "w-24"} />
      <div className={cn(size === "md" ? "text-sm" : "text-[13px]")}>{children}</div>
    </div>
  );
}
