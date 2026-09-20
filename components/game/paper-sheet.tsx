'use client';

/**
 * Shared "aged paper" sheet used by the intro (telegram) and rules screens.
 * Same paper cut-out aesthetic as the newspaper headline: yellowed paper,
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
      className={`relative bg-[#e8d5a5] text-stone-900 shadow-2xl overflow-hidden ${className}`}
      style={{
        backgroundImage: 'radial-gradient(ellipse at 5% 10%, rgba(120, 74, 25, 0.18), transparent 45%), radial-gradient(ellipse at 95% 90%, rgba(120, 74, 25, 0.22), transparent 40%), linear-gradient(100deg, transparent 48%, rgba(120, 74, 25, 0.07) 50%, transparent 52%)',
        boxShadow: 'inset 0 0 45px rgba(120, 74, 25, 0.18), 0 20px 40px rgba(0, 0, 0, 0.4)',
      }}
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
