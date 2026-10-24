import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:opacity-90",
  secondary: "border border-line-strong bg-card hover:bg-hover",
  ghost: "hover:bg-hover",
  danger: "bg-danger/10 text-danger hover:bg-danger/20",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        size === "md" ? "px-6 py-3 text-sm" : "px-4 py-2 text-[13px]",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ className, label, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-fg transition hover:bg-hover",
        className,
      )}
      {...props}
    />
  );
}

const fieldBase =
  "w-full rounded-xl border border-line-strong bg-card px-4 py-2.5 text-sm text-fg outline-none transition placeholder:text-fg-2 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(fieldBase, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(fieldBase, "min-h-24 resize-y", className)} {...props} />;
  },
);

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, "appearance-auto pr-8", className)} {...props} />;
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-[13px] font-semibold text-fg-2">{label}</span>
      {children}
      {error ? <span className="block text-xs font-medium text-danger">{error}</span> : hint ? <span className="block text-xs text-fg-2">{hint}</span> : null}
    </label>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-line bg-card", className)} {...props} />;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "danger" | "success" | "warning"; children: React.ReactNode }) {
  const tones = {
    info: "bg-brand/10 text-brand",
    danger: "bg-danger/10 text-danger",
    success: "bg-success/15 text-[#4f8f00] dark:text-success",
    warning: "bg-warning/15 text-[#b8650f] dark:text-warning",
  };
  return <div className={cn("rounded-2xl px-4 py-3 text-sm font-medium", tones[tone])}>{children}</div>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-sm text-fg-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
