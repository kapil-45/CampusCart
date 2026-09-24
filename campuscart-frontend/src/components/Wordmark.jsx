export default function Wordmark({ size = 'md' }) {
  const textSize = size === 'lg' ? 'text-3xl' : 'text-xl'
  return (
    <div className="flex items-center gap-2.5 select-none">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 border border-gold/30">
        <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_10px_rgba(201,162,39,0.8)]" />
      </span>
      <span className={`font-display ${textSize} tracking-tight text-paper`}>
        Campus<span className="text-gold-bright">Cart</span>
      </span>
    </div>
  )
}
