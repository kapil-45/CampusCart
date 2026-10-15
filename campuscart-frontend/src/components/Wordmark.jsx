export default function Wordmark({ size = 'md', variant = 'horizontal', className = '' }) {
  const heightClass =
    variant === 'stacked'
      ? size === 'lg' ? 'h-16' : size === 'sm' ? 'h-10' : 'h-12'
      : size === 'lg' ? 'h-10 sm:h-11' : size === 'sm' ? 'h-7' : 'h-8 sm:h-9'

  const src = variant === 'stacked' ? '/logo-dark.png' : '/logo-horizontal.png'

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src={src}
        alt="CampusCart"
        className={`${heightClass} w-auto object-contain transition-transform duration-200 hover:scale-[1.02]`}
      />
    </div>
  )
}

