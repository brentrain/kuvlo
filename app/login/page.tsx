'use client'

import { useState } from 'react'
import { createClient } from '../utils/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async () => {
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
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
        .signup-link { font-size: 13px; color: var(--muted); text-align: center; }
        .signup-link a { color: var(--ink); font-weight: 500; text-decoration: none; border-bottom: 1px solid var(--ink); }
        .forgot { font-size: 13px; color: var(--muted); text-align: right; margin-top: -12px; margin-bottom: 20px; }
        .forgot a { color: var(--muted); text-decoration: none; border-bottom: 1px solid var(--border); }
      `}</style>
            <div className="page">
                <div className="card">
                    <a href="/" className="logo">KUV<span>LO</span></a>
                    <h1>Welcome back</h1>
                    <p className="subtitle">Log in to your Kuvlo account.</p>
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
                        placeholder="your password"
                    />
                    <p className="forgot"><a href="/forgot-password">Forgot password?</a></p>
                    {error && <p className="error">{error}</p>}
                    <button className="btn" onClick={handleLogin} disabled={loading}>
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>
                    <p className="signup-link">Don't have an account? <a href="/sign-up">Sign up free</a></p>
                </div>
            </div>
        </>
    )
}