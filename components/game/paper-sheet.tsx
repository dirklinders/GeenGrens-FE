'use client';

/**
 * Shared "aged paper" sheet used by the intro (telegram) and rules screens.
 * Same paper cut-out aesthetic as the newspaper headline: amber-50 paper,
 * grain texture overlay and an inner dashed frame.
 */
export function PaperSheet({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative bg-amber-50 text-stone-900 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Paper grain */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Inner dashed frame */}
      <div className="absolute inset-2.5 border border-dashed border-stone-400/70 rounded-sm pointer-events-none" />

      <div className="relative p-6 md:p-10">{children}</div>
    </div>
  );
}
