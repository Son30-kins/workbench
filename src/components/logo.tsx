export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-label="ManagementTask" role="img">
      <rect x="3" y="3" width="11" height="11" rx="3.5" fill="currentColor" />
      <rect x="18" y="3" width="11" height="11" rx="3.5" fill="currentColor" opacity="0.55" />
      <rect x="3" y="18" width="11" height="11" rx="3.5" fill="currentColor" opacity="0.55" />
      <path d="m19 23.5 3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
