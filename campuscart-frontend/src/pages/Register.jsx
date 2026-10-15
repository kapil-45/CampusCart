import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Wordmark from '../components/Wordmark'
import FormField from '../components/FormField'
import AmbientScene from '../components/AmbientScene'
import CampusSelect from '../components/CampusSelect'
import { GoogleLogin } from '@react-oauth/google'
import api from '../api/client'

export default function Register() {
  const { register, login, fetchProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    phone: '',
    campus: null,
    campusName: '',
    year: '',
  })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  // New state for Google‑flow extra info
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [extraPhone, setExtraPhone] = useState('')
  const [extraCampus, setExtraCampus] = useState(null)
  const [extraCampusName, setExtraCampusName] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setFormError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/google/', {
        credential: credentialResponse.credential,
      });
      localStorage.setItem('cc_access_token', data.access);
      localStorage.setItem('cc_refresh_token', data.refresh);
      const userData = { id: data.userId, fullName: data.fullName, role: data.role, email: data.email };
      localStorage.setItem('cc_user', JSON.stringify(userData));
      // Prefill email (optional)
      update('email', data.email || '');
      // Show modal for extra info collection (phone, campus)
      setShowExtraForm(true);
      setLoading(false);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setErrors({})

    if (!form.campus) {
      setErrors({ campus: 'Please select your campus or select "Other".' })
      return
    }
    if (form.campus === 'other' && (!form.campusName || !form.campusName.trim())) {
      setErrors({ campus: 'Please specify your official college name.' })
      return
    }
    if (!form.year) {
      setErrors({ year: 'Please select your year.' })
      return
    }
    if (!termsAccepted) {
      setFormError('You must agree to the Terms of Service and Privacy Policy.')
      return
    }
    if (!form.phone) {
      setErrors({ ...errors, phone: 'Phone number is required.' });
      return;
    }

    setLoading(true)
    try {
      const payload = {
        full_name: form.email.split('@')[0], // Generate a temporary name or handle it differently
        email: form.email,
        password: form.password,
        phone: form.phone,
        campus: form.campus !== 'other' ? form.campus : null,
        college_id: form.campus === 'other' ? form.campusName : null,
        year: form.year,
      }
      await register(payload)
      await login(form.email, form.password)
      navigate('/home')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object' && !data.message) {
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
            <p className="text-sm text-mist mb-6">
              Just for students — buy and sell with people from your own campus.
            </p>

            <div className="flex justify-center mb-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setFormError('Google sign-in was unsuccessful.');
                }}
                shape="pill"
                size="large"
                theme="filled_blue"
                text="continue_with"
                width="100%"
              />
            </div>
            
            <p className="text-xs text-center text-mist mb-6">
              You'll upload your student ID after account creation
            </p>

            <div className="relative flex items-center py-2 mb-6">
              <div className="flex-grow border-t border-hairline"></div>
              <span className="flex-shrink-0 mx-4 text-mist text-xs font-semibold uppercase tracking-widest">
                OR
              </span>
              <div className="flex-grow border-t border-hairline"></div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FormField
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@college.edu"
                error={errors.email}
              />
              <FormField
                label="Password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="••••••••"
                error={errors.password}
              />
              <p className="-mt-3 text-xs text-mist">Min 8 characters</p>
              
              <FormField
                label="Phone Number"
                required
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="9876543210"
                error={errors.phone}
              />
              <p className="-mt-3 text-xs text-mist">
                Visible only to admins for safety & support. Never shared with other users.
              </p>

              <CampusSelect 
                value={{ id: form.campus, name: form.campusName }} 
                onChange={(id, name) => {
                  update('campus', id);
                  update('campusName', name);
                }}
                error={errors.campus}
              />

              <div>
                <label className="field-label">Year <span className="text-crimson">*</span></label>
                <select 
                  className="field-input appearance-none bg-no-repeat bg-[right_1rem_center]" 
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundSize: '1.5em 1.5em' }}
                  value={form.year}
                  onChange={(e) => update('year', e.target.value)}
                  required
                >
                  <option value="" disabled>Select your year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                  <option value="alumni">Alumni</option>
                  <option value="faculty">Faculty / Staff</option>
                </select>
                {errors.year && <p className="mt-1.5 text-sm text-crimson">{errors.year}</p>}
              </div>

              <div className="flex items-start gap-3 mt-2 p-3 border border-hairline rounded-lg bg-black/10">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    id="terms"
                    type="checkbox"
                    className="w-4 h-4 rounded border-mist/40 bg-transparent text-gold focus:ring-gold focus:ring-offset-ink"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                </div>
                <label htmlFor="terms" className="text-sm text-mist">
                  I agree to the <a href="#" className="text-gold-bright hover:underline">Terms of Service</a> and <a href="#" className="text-gold-bright hover:underline">Privacy Policy</a>
                </label>
              </div>

              {formError && (
                <p className="text-sm text-crimson bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            {showExtraForm && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-paper rounded-lg shadow-lg p-6 w-full max-w-md">
                  <h2 className="font-display text-xl mb-4">Complete Your Profile</h2>
                  <p className="mb-4 text-mist">Please provide your phone number and campus information to finish registration.</p>
                  <div className="flex flex-col gap-4">
                    <FormField
                      label="Phone Number"
                      required
                      value={extraPhone}
                      onChange={(e) => setExtraPhone(e.target.value)}
                      placeholder="9876543210"
                      error={errors.phone}
                    />
                    <CampusSelect
                      value={{ id: extraCampus, name: extraCampusName }}
                      onChange={(id, name) => {
                        setExtraCampus(id);
                        setExtraCampusName(name);
                      }}
                      error={errors.campus}
                    />
                    <button
                      type="button"
                      className="btn-primary mt-2"
                      onClick={async () => {
                        if (!extraPhone) { setErrors((e) => ({ ...e, phone: 'Phone required' })); return; }
                        if (!extraCampus && !extraCampusName) { setErrors((e) => ({ ...e, campus: 'Campus required' })); return; }
                        try {
                          await api.patch('/api/auth/me/', {
                            phone: extraPhone,
                            college_id: extraCampus !== 'other' ? extraCampus : null,
                            campus: extraCampus === 'other' ? extraCampusName : null,
                          });
                          // Hydrate AuthContext so the app recognises the user as logged in
                          await fetchProfile();
                          setShowExtraForm(false);
                          navigate('/home');
                        } catch (e) {
                          setFormError('Failed to save profile. Please try again.');
                        }
                      }}
                    >
                      Save and Continue
                    </button>
                  </div>
                </div>
              </div>
            )}

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
