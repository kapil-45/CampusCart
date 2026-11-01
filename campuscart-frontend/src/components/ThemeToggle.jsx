import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '', size = 'md' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const sizeClasses =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'lg'
      ? 'h-11 w-11 text-base'
      : 'h-9 w-9 text-sm'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex items-center justify-center rounded-xl border transition-all duration-300 active:scale-90 ${sizeClasses} ${
        isDark
          ? 'bg-ink-soft/80 border-hairline text-gold-bright hover:bg-white/10 hover:border-gold/50 shadow-sm'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-purple-300 shadow-sm'
      } ${className}`}
    >
      {isDark ? (
        /* Sun icon with gentle glow */
        <svg
          className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        /* Moon icon */
        <svg
          className="w-4 h-4 transition-transform duration-300 -rotate-12 hover:rotate-0 text-purple-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
