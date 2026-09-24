import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Wordmark from '../components/Wordmark'
import FormField from '../components/FormField'
import AmbientScene from '../components/AmbientScene'

export default function Register() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setErrors({})
    setLoading(true)
    try {
      await register(form)
      // auto-login right after successful registration
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object' && !data.message) {
        // DRF field-level validation errors, e.g. { email: ["..."] }
        const fieldErrors = {}
        Object.entries(data).forEach(([key, val]) => {
          fieldErrors[key] = Array.isArray(val) ? val[0] : val
        })
        setErrors(fieldErrors)
      } else {
        setFormError(data?.message || 'Registration failed. Please check your details and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-ink-soft overflow-hidden order-2 lg:order-1">
        <AmbientScene />
        <div className="absolute inset-0 flex items-center justify-center p-16">
          <blockquote className="max-w-sm text-center">
            <p className="font-display text-2xl text-paper/90 leading-snug">
              "Verified students only — no strangers, no scams, just campus."
            </p>
          </blockquote>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 order-1 lg:order-2">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-block mb-8">
            <Wordmark size="lg" />
          </Link>

          <div className="id-card glass p-8">
            <h1 className="font-display text-2xl text-paper mb-1">Create your account</h1>
            <p className="text-sm text-mist mb-7">
              Just for students — buy and sell with people from your own campus.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FormField
                label="Full Name"
                required
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
                placeholder="Kapil Kapse"
                error={errors.full_name}
              />
              <FormField
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                error={errors.email}
              />
              <FormField
                label="Password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="At least 6 characters"
                error={errors.password}
              />
              <FormField
                label="Phone"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="9999999999"
                error={errors.phone}
              />

              {formError && (
                <p className="text-sm text-crimson bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-sm text-mist mt-6 text-center">
              Already on CampusCart?{' '}
              <Link to="/login" className="text-gold-bright hover:text-gold font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
