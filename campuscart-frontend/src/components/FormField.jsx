export default function FormField({ label, error, ...inputProps }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input className="field-input" {...inputProps} />
      {error && <p className="mt-1.5 text-sm text-crimson">{error}</p>}
    </div>
  )
}
