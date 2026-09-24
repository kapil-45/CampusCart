/**
 * Purely decorative ambient background used behind the auth forms.
 * Soft drifting blurred orbs plus faint line-art silhouettes of campus
 * items (book, calculator, bicycle wheel) — sets a "campus at night"
 * mood without competing with the form for attention.
 */
export default function AmbientScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-gold/20 blur-[100px] animate-drift" />
      <div className="absolute bottom-[-120px] left-[-80px] w-[380px] h-[380px] rounded-full bg-emerald/15 blur-[110px] animate-driftSlow" />
      <div className="absolute top-1/3 left-1/2 w-[260px] h-[260px] rounded-full bg-gold/10 blur-[90px] animate-drift" />

      <svg
        className="absolute bottom-16 right-10 w-40 h-40 opacity-[0.08]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        {/* open book */}
        <path d="M10 30 Q50 15 90 30 L90 75 Q50 60 10 75 Z" />
        <path d="M50 18 L50 68" />
      </svg>

      <svg
        className="absolute top-24 left-10 w-28 h-28 opacity-[0.07]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        {/* bicycle wheel */}
        <circle cx="50" cy="50" r="34" />
        <circle cx="50" cy="50" r="4" />
        <path d="M50 16 L50 84 M16 50 L84 50 M27 27 L73 73 M27 73 L73 27" strokeWidth="0.6" />
      </svg>

      <svg
        className="absolute top-1/2 right-1/4 w-20 h-20 opacity-[0.06]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        {/* calculator */}
        <rect x="20" y="10" width="60" height="80" rx="6" />
        <rect x="30" y="22" width="40" height="14" rx="2" />
        <circle cx="34" cy="50" r="3" />
        <circle cx="50" cy="50" r="3" />
        <circle cx="66" cy="50" r="3" />
        <circle cx="34" cy="64" r="3" />
        <circle cx="50" cy="64" r="3" />
        <circle cx="66" cy="64" r="3" />
      </svg>
    </div>
  )
}
