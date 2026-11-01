import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Wordmark from '../components/Wordmark'
import ThemeToggle from '../components/ThemeToggle'

/* ─── Floating particle field ─── */
function ParticleField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COUNT = 55
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.15,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(157,78,221,${p.alpha})`
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(199,125,255,${0.08 * (1 - dist / 100)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}

/* ─── Animated counter ─── */
function AnimatedStat({ value, suffix = '', label }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1600
          const start = performance.now()
          const tick = (now) => {
            const t = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - t, 3)
            setDisplay(Math.round(eased * value))
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-5xl text-gold-bright mb-2">
        {display.toLocaleString()}
        {suffix}
      </p>
      <p className="text-sm text-mist tracking-wide uppercase">{label}</p>
    </div>
  )
}

/* ─── Feature Card ─── */
function FeatureCard({ icon, title, desc, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
      className="id-card sheen-hover glass p-7 flex flex-col gap-4 group cursor-default"
    >
      <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center text-2xl group-hover:bg-gold/15 transition-colors">
        {icon}
      </div>
      <h3 className="font-display text-xl text-paper">{title}</h3>
      <p className="text-sm text-mist leading-relaxed">{desc}</p>
    </div>
  )
}

/* ─── Step ─── */
function Step({ number, title, desc, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-24px)',
        transition: 'opacity 0.65s ease, transform 0.65s ease',
      }}
      className="flex gap-5"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-gold/50 text-gold font-bold flex items-center justify-center text-sm">
        {number}
      </div>
      <div>
        <h3 className="font-display text-lg text-paper mb-1">{title}</h3>
        <p className="text-sm text-mist leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

/* ─── Testimonial Card ─── */
function TestimonialCard({ quote, author, college, avatar, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
      className="id-card sheen-hover glass p-6 flex flex-col gap-5"
    >
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 text-gold-bright" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
      <p className="text-paper/85 text-sm leading-relaxed italic">"{quote}"</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/30 text-gold font-bold flex items-center justify-center text-sm">
          {avatar}
        </div>
        <div>
          <p className="text-paper text-sm font-medium">{author}</p>
          <p className="text-mist text-xs">{college}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Floating product preview card matching mockup ─── */
function FloatingCard({ title, price, category, image, top, left, animClass, delay }) {
  return (
    <div
      className={`absolute id-card px-4 py-3 min-w-[220px] pointer-events-none select-none transition-all duration-300 ${animClass}`}
      style={{ top, left, animationDelay: delay }}
    >
      <div className="flex items-center gap-3.5">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider mb-0.5">{category}</p>
          <p className="text-paper text-sm font-semibold truncate">{title}</p>
          <p className="text-gold font-bold text-sm mt-0.5">₹{price}</p>
        </div>
        {image && (
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shrink-0 flex items-center justify-center p-1">
            <img src={image} alt={title} className="w-full h-full object-contain" />
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   MAIN LANDING PAGE
═══════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-paper transition-colors duration-300">

      {/* ── Sticky Nav ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass border-b border-hairline shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Wordmark size="md" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-mist">
            <a href="#features" className="hover:text-paper transition-colors font-medium">Features</a>
            <a href="#how-it-works" className="hover:text-paper transition-colors font-medium">How It Works</a>
            <a href="#testimonials" className="hover:text-paper transition-colors font-medium">Stories</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="btn-ghost !px-4 !py-2 text-sm">Log In</Link>
            <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">Join Free</Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background artwork: Light mode organic fluid curves & dashed orbits; Dark mode deep cosmic glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Light mode fluid blurs matching mockup */}
          <div className="dark:hidden absolute -top-24 -left-20 w-[480px] h-[480px] rounded-full bg-purple-200/40 blur-[90px]" />
          <div className="dark:hidden absolute top-1/4 -right-20 w-[520px] h-[520px] rounded-full bg-purple-200/45 blur-[100px]" />
          <div className="dark:hidden absolute -bottom-24 left-1/3 w-[450px] h-[450px] rounded-full bg-indigo-100/60 blur-[90px]" />

          {/* Dark mode background orbs */}
          <div className="hidden dark:block absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-purple-900/20 blur-[140px] animate-drift" />
          <div className="hidden dark:block absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-900/15 blur-[120px] animate-driftSlow" />
          <div className="hidden dark:block absolute bottom-0 -left-24 w-[400px] h-[400px] rounded-full bg-purple-950/25 blur-[100px] animate-drift" />

          {/* Light mode decorative dashed orbit lines and node badges */}
          <svg className="dark:hidden absolute inset-0 w-full h-full opacity-60" viewBox="0 0 1440 800" fill="none">
            <path d="M 80 200 C 180 120, 320 180, 420 140 C 600 80, 840 220, 1020 160 C 1200 100, 1360 180, 1420 120" stroke="#A855F7" strokeWidth="1.2" strokeDasharray="4 6" opacity="0.45" />
            <path d="M 40 450 C 180 520, 360 420, 520 480 C 720 560, 940 440, 1140 500 C 1280 540, 1380 480, 1440 520" stroke="#A855F7" strokeWidth="1.2" strokeDasharray="4 6" opacity="0.45" />
            <circle cx="420" cy="140" r="3.5" fill="#8B5CF6" />
            <circle cx="1020" cy="160" r="3.5" fill="#8B5CF6" />
            <circle cx="520" cy="480" r="3.5" fill="#8B5CF6" />
            <circle cx="1140" cy="500" r="3.5" fill="#8B5CF6" />
          </svg>
        </div>

        <ParticleField />

        {/* floating product preview cards matching mockup */}
        <div className="hidden xl:block">
          <FloatingCard title="Engineering Textbooks" price="320" category="Books" image="/thumb-books.png" top="20%" left="4%" animClass="animate-drift" delay="0s" />
          <FloatingCard title="Scientific Calculator" price="650" category="Electronics" image="/thumb-calc.png" top="56%" left="3%" animClass="animate-driftSlow" delay="1.5s" />
          <FloatingCard title="Mountain Bicycle" price="4500" category="Bicycles" image="/thumb-bike.png" top="24%" left="72%" animClass="animate-driftSlow" delay="0.8s" />
          <FloatingCard title="Study Desk Lamp" price="280" category="Furniture" image="/thumb-lamp.png" top="60%" left="73%" animClass="animate-drift" delay="2s" />
        </div>

        {/* hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold uppercase tracking-wider mb-8 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping inline-block" />
            Campus Marketplace — Now Live
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-paper leading-[1.08] mb-6">
            Buy &amp; Sell{' '}
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 dark:from-purple-400 dark:to-indigo-300">
              Within Campus.
            </span>
            <br />
            <span className="text-paper/70">Zero Hassle.</span>
          </h1>

          <p className="text-lg text-mist max-w-xl mx-auto mb-10 leading-relaxed font-normal">
            CampusCart connects students to trade textbooks, electronics, bicycles
            and more — all within your verified campus community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              id="hero-register-btn"
              className="btn-primary !px-8 !py-4 text-base shadow-lg shadow-purple-600/30 w-full sm:w-auto"
            >
              Start for Free
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/login"
              id="hero-login-btn"
              className="btn-ghost !px-8 !py-4 text-base w-full sm:w-auto"
            >
              I have an account
            </Link>
          </div>

          {/* trust bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-mist">
            {['Verified campus emails only', 'In-app messaging', '100% free to list'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* scroll chevron */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-30 pointer-events-none">
          <svg className="w-5 h-5 text-mist" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS BELT
      ══════════════════════════════════════ */}
      <section className="py-16 border-y border-hairline glass">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatedStat value={1200} suffix="+" label="Active Listings" />
          <AnimatedStat value={850} suffix="+" label="Campus Students" />
          <AnimatedStat value={95} suffix="%" label="Satisfaction Rate" />
          <AnimatedStat value={25} suffix="+" label="Colleges Onboard" />
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold mb-3">Why CampusCart</p>
            <h2 className="font-display text-4xl text-paper mb-4">Everything you need to trade on campus</h2>
            <p className="text-mist max-w-lg mx-auto text-sm">Designed specifically for the campus ecosystem — safe, fast and completely free.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard delay={0}   icon="🔐" title="Verified Campus Community" desc="Sign up only with your institutional email. Every seller and buyer is a real student — no outsiders, no scams." />
            <FeatureCard delay={100} icon="💬" title="Built-in Messaging"          desc="Negotiate directly through our secure in-app chat. No sharing phone numbers until you're ready." />
            <FeatureCard delay={200} icon="📦" title="Multi-category Listings"     desc="Books, electronics, bicycles, furniture, stationery — one platform for everything a student might need." />
            <FeatureCard delay={300} icon="⚡" title="Instant Notifications"       desc="Get alerted the moment someone messages you or a new listing matches your interest." />
            <FeatureCard delay={400} icon="🤝" title="Direct Campus Handover"      desc="Meet safely at your campus library, hostel, or cafeteria. Inspect items in person before paying with zero shipping fees." />
            <FeatureCard delay={500} icon="🆓" title="Always Free"                 desc="No commissions, no listing fees, no hidden charges. CampusCart makes money only when you succeed." />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50/70 dark:bg-black/20 border-y border-hairline">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          {/* steps */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold mb-3">How It Works</p>
            <h2 className="font-display text-4xl text-paper mb-10">Selling is as easy as 1–2–3</h2>
            <div className="flex flex-col gap-8">
              <Step delay={0}   number="1" title="Create your free account"  desc="Sign up with your campus email in under a minute. No credit card required." />
              <Step delay={120} number="2" title="List your item"            desc="Add photos, a description, price and category. Your listing goes live instantly." />
              <Step delay={240} number="3" title="Chat &amp; close the deal" desc="Interested buyers message you directly. Meet safely on campus and hand over the goods." />
            </div>
            <Link to="/register" className="btn-primary !px-7 !py-3.5 text-sm mt-10 inline-flex shadow-goldGlow">
              Get Started — It's Free →
            </Link>
          </div>

          {/* decorative mock listing card */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-sm">
              <div className="id-card glass p-6 shadow-glass">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/30 text-gold font-bold flex items-center justify-center text-sm">R</div>
                  <div>
                    <p className="text-paper text-sm font-medium">Rahul M.</p>
                    <p className="text-mist text-xs">🎓 Verified Student · IIT Delhi</p>
                  </div>
                  <span className="ml-auto px-2.5 py-1 rounded-full bg-emerald/10 border border-emerald/30 text-emerald text-[11px] font-semibold">Active</span>
                </div>
                <div className="w-full h-36 rounded-xl bg-gradient-to-br from-purple-600/15 to-indigo-600/10 border border-hairline mb-4 flex items-center justify-center">
                  <svg className="w-16 h-16 opacity-20 text-paper" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M10 30 Q50 15 90 30 L90 75 Q50 60 10 75 Z" /><path d="M50 18 L50 68" />
                  </svg>
                </div>
                <p className="text-paper font-medium mb-1">DS &amp; Algorithms — CLRS 4th Ed.</p>
                <p className="text-mist text-sm mb-3">Lightly used, all pages intact</p>
                <div className="flex items-center justify-between">
                  <span className="text-gold-bright text-xl font-bold font-display">₹480</span>
                  <button className="btn-primary !px-4 !py-2 text-xs">Message Seller</button>
                </div>
              </div>
              {/* chat bubble */}
              <div className="absolute -bottom-6 -right-6 id-card glass px-4 py-3 max-w-[180px] shadow-glass animate-driftSlow">
                <p className="text-[11px] text-mist mb-1">💬 New message</p>
                <p className="text-paper text-xs">"Is this still available?"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════ */}
      <section id="testimonials" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold mb-3">Student Stories</p>
            <h2 className="font-display text-4xl text-paper">Real students. Real savings.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard delay={0}   quote="Sold my entire first-year book set in two days. Made back ₹3,000 I thought was gone forever!" author="Priya K."  college="BITS Pilani" avatar="P" />
            <TestimonialCard delay={120} quote="Found a barely-used calculator for half the price. The in-app chat made it super easy to coordinate." author="Arjun S." college="IIT Bombay" avatar="A" />
            <TestimonialCard delay={240} quote="Listed my bicycle on the last day of semester and sold it within 3 hours. Saved so much hassle!"   author="Meera R." college="NIT Trichy"  avatar="M" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CATEGORY MARQUEE
      ══════════════════════════════════════ */}
      <section className="py-10 overflow-hidden border-y border-hairline glass">
        <div
          className="flex gap-6 whitespace-nowrap"
          style={{ animation: 'marquee 28s linear infinite' }}
        >
          {[...Array(4)].map((_, rep) =>
            ['📚 Books', '💻 Electronics', '🧮 Calculators', '🚲 Bicycles', '🪑 Furniture', '🎒 Stationery', '🎧 Gadgets', '🛍️ General'].map((cat) => (
              <span
                key={`${rep}-${cat}`}
                className="chip inline-flex items-center gap-2 text-sm flex-shrink-0"
                style={{ borderColor: 'rgba(157,78,221,0.25)' }}
              >
                {cat}
              </span>
            ))
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA
      ══════════════════════════════════════ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/8 blur-[120px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="font-display text-5xl text-paper mb-6 leading-tight">
            Ready to clear out your room<br />
            <span className="text-gold-bright">and your wallet?</span>
          </h2>
          <p className="text-mist text-lg mb-10">
            Join thousands of campus students already buying and selling on CampusCart.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" id="cta-register-btn" className="btn-primary !px-10 !py-4 text-base shadow-goldGlow">
              Create Free Account
            </Link>
            <Link to="/login" id="cta-login-btn" className="btn-ghost !px-10 !py-4 text-base">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="border-t border-hairline glass py-10 px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <Wordmark />
          <div className="flex items-center gap-4">
            <ThemeToggle size="sm" />
            <p className="text-mist text-xs text-center sm:text-right">
              © {new Date().getFullYear()} CampusCart · Made with ❤️ for students, by students.
            </p>
          </div>
        </div>
      </footer>

      {/* marquee keyframe */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
