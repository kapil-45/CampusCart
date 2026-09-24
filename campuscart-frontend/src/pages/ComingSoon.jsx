import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function ComingSoon({ title }) {
  return (
    <div className="min-h-screen">
      <Navbar search="" onSearchChange={() => {}} />
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="id-card glass p-12">
          <p className="font-display text-2xl text-paper mb-2">{title}</p>
          <p className="text-mist text-sm mb-6">
            This screen is being built next — the backend for this is already working, this page just isn't wired up yet.
          </p>
          <Link to="/" className="btn-primary inline-flex">
            Back to browsing
          </Link>
        </div>
      </main>
    </div>
  )
}
