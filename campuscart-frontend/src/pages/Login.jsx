import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Wordmark from '../components/Wordmark'
import FormField from '../components/FormField'
import AmbientScene from '../components/AmbientScene'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Could not log in. Check your email and password and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left: form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-block mb-10">
            <Wordmark size="lg" />
          </Link>

          <div className="id-card glass p-8">
            <h1 className="font-display text-2xl text-paper mb-1">Welcome back</h1>
            <p className="text-sm text-mist mb-7">
              Log in with your campus email to buy and sell within CampusCart.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FormField
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
              <FormField
                label="Password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />

              {error && (
                <p className="text-sm text-crimson bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
                {loading ? 'Logging in…' : 'Log In'}
              </button>
            </form>

            <p className="text-sm text-mist mt-6 text-center">
              New to CampusCart?{' '}
              <Link to="/register" className="text-gold-bright hover:text-gold font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* right: ambient scene */}
      <div className="hidden lg:block relative bg-ink-soft overflow-hidden">
        <AmbientScene />
        <div className="absolute inset-0 flex items-center justify-center p-16">
          <blockquote className="max-w-sm text-center">
            <p className="font-display text-2xl text-paper/90 leading-snug">
              "One less thing to carry home at the end of semester."
            </p>
            <p className="text-sm text-mist mt-4">— Every student who's ever moved out of a hostel</p>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
