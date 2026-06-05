'use client'

import { useState } from 'react'
import { createClient } from '../utils/supabase'
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      console.log('data:', data)
      console.log('error:', error)
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/dashboard')
      }
    } catch (e: any) {
      console.log('caught:', e)
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink: #0f0f0f;
          --orange: #e85d04;
          --orange-dark: #c44d00;
          --fog: #f5f3ef;
          --muted: #6b7280;
          --border: #d1cdc6;
        }
        body { font-family: 'Barlow', sans-serif; background: var(--fog); }
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .card {
          background: #fff;
          border: 1.5px solid var(--border);
          padding: 48px 44px;
          width: 100%;
          max-width: 420px;
        }
        .logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 28px;
          color: var(--ink);
          text-decoration: none;
          display: block;
          margin-bottom: 32px;
        }
        .logo span { color: var(--orange); }
        h1 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 32px;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .subtitle { font-size: 14px; color: var(--muted); margin-bottom: 32px; }
        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--ink);
          margin-bottom: 6px;
        }
        input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid var(--border);
          background: var(--fog);
          font-family: 'Barlow', sans-serif;
          font-size: 15px;
          color: var(--ink);
          margin-bottom: 20px;
          outline: none;
          transition: border-color 0.15s;
        }
        input:focus { border-color: var(--ink); }
        .btn {
          width: 100%;
          background: var(--orange);
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 14px;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          margin-bottom: 20px;
        }
        .btn:hover { background: var(--orange-dark); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .error { font-size: 13px; color: #c0392b; margin-bottom: 16px; }
        .login-link { font-size: 13px; color: var(--muted); text-align: center; }
        .login-link a { color: var(--ink); font-weight: 500; text-decoration: none; border-bottom: 1px solid var(--ink); }
      `}</style>
      <div className="page">
        <div className="card">
          <a href="/" className="logo">KUV<span>LO</span></a>
          <h1>Create account</h1>
          <p className="subtitle">Start free — no credit card needed.</p>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="minimum 6 characters"
          />
          {error && <p className="error">{error}</p>}
          <button className="btn" onClick={handleSignUp} disabled={loading}>
            {loading ? 'Creating account...' : 'Create free account'}
          </button>
          <p className="login-link">Already have an account? <a href="/login">Log in</a></p>
        </div>
      </div>
    </>
  )
}