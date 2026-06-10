'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../utils/supabase'
import { useRouter } from 'next/navigation'

export default function Settings() {
    const [form, setForm] = useState({
        company_name: '', address: '', city: '', state: '', zip_code: '',
        phone: '', email: '', website: '', paypal_link: '', stripe_link: '', venmo_link: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            const { data } = await supabase
                .from('company_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()
            if (data) setForm(data)
            setLoading(false)
        }
        load()
    }, [])

    const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSave = async () => {
        setSaving(true)
        setError('')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const { error } = await supabase
            .from('company_profiles')
            .upsert({ ...form, user_id: user.id })
        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        }
        setSaving(false)
    }

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#6b7280' }}>Loading...</div>

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink: #0f0f0f;
          --steel: #1c2b3a;
          --orange: #e85d04;
          --fog: #f5f3ef;
          --muted: #6b7280;
          --border: #d1cdc6;
        }
        body { font-family: 'Barlow', sans-serif; background: var(--fog); }
        .layout { display: flex; min-height: 100vh; }
        .sidebar {
          width: 240px;
          background: var(--steel);
          display: flex;
          flex-direction: column;
          padding: 32px 0;
          flex-shrink: 0;
        }
        .logo {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 26px;
          color: #fff;
          text-decoration: none;
          padding: 0 28px;
          margin-bottom: 40px;
          display: block;
        }
        .logo span { color: var(--orange); }
        .nav-item {
          display: block;
          padding: 12px 28px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: all 0.15s;
          border-left: 3px solid transparent;
        }
        .nav-item:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .nav-item.active { color: #fff; border-left-color: var(--orange); background: rgba(255,255,255,0.05); }
        .nav-section {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          padding: 20px 28px 8px;
        }
        .signout {
          margin-top: auto;
          padding: 12px 28px;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          background: none;
          border: none;
          text-align: left;
          font-family: 'Barlow', sans-serif;
          transition: color 0.15s;
        }
        .signout:hover { color: rgba(255,255,255,0.7); }
        .main { flex: 1; padding: 48px; overflow-y: auto; }
        .page-header { margin-bottom: 40px; }
        .page-header h1 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 36px;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 4px;
        }
        .page-header p { font-size: 14px; color: var(--muted); }
        .form-card {
          background: #fff;
          border: 1.5px solid var(--border);
          padding: 40px;
          max-width: 640px;
          margin-bottom: 24px;
        }
        .card-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 18px;
          text-transform: uppercase;
          color: var(--ink);
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1.5px solid var(--border);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .form-group { display: flex; flex-direction: column; }
        .form-group.full { grid-column: 1 / -1; }
        label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--ink);
          margin-bottom: 6px;
        }
        .label-hint {
          font-size: 11px;
          color: var(--muted);
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
          margin-left: 6px;
        }
        input {
          padding: 11px 13px;
          border: 1.5px solid var(--border);
          background: var(--fog);
          font-family: 'Barlow', sans-serif;
          font-size: 14px;
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
        }
        input:focus { border-color: var(--ink); }
        .error { font-size: 13px; color: #c0392b; margin-bottom: 16px; }
        .success { font-size: 13px; color: #27ae60; margin-bottom: 16px; }
        .form-actions { display: flex; gap: 12px; align-items: center; margin-top: 8px; }
        .btn {
          background: var(--orange);
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 13px 32px;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn:hover { background: #c44d00; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main { padding: 24px 20px; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>

            <div className="layout">
                <aside className="sidebar">
                    <a href="/" className="logo">KUV<span>LO</span></a>
                    <p className="nav-section">Main</p>
                    <a href="/dashboard" className="nav-item">Dashboard</a>
                    <a href="/clients" className="nav-item">Clients</a>
                    <a href="/jobs" className="nav-item">Jobs</a>
                    <a href="/invoices" className="nav-item">Invoices</a>
                    <p className="nav-section">Account</p>
                    <a href="/settings" className="nav-item active">Settings</a>
                    <button className="signout" onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Sign out</button>
                </aside>

                <main className="main">
                    <div className="page-header">
                        <h1>Settings</h1>
                        <p>Your company info appears on invoices sent to clients.</p>
                    </div>

                    <div className="form-card">
                        <p className="card-title">Company Info</p>
                        <div className="form-row">
                            <div className="form-group full">
                                <label>Company Name</label>
                                <input name="company_name" value={form.company_name || ''} onChange={handleChange} placeholder="Acme Plumbing LLC" />
                            </div>
                            <div className="form-group full">
                                <label>Address</label>
                                <input name="address" value={form.address || ''} onChange={handleChange} placeholder="123 Main St" />
                            </div>
                            <div className="form-group">
                                <label>City</label>
                                <input name="city" value={form.city || ''} onChange={handleChange} placeholder="Somerset" />
                            </div>
                            <div className="form-group">
                                <label>State</label>
                                <input name="state" value={form.state || ''} onChange={handleChange} placeholder="KY" />
                            </div>
                            <div className="form-group">
                                <label>Zip Code</label>
                                <input name="zip_code" value={form.zip_code || ''} onChange={handleChange} placeholder="42501" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input name="phone" value={form.phone || ''} onChange={handleChange} placeholder="606-555-0100" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input name="email" value={form.email || ''} onChange={handleChange} placeholder="you@yourbusiness.com" />
                            </div>
                            <div className="form-group">
                                <label>Website</label>
                                <input name="website" value={form.website || ''} onChange={handleChange} placeholder="yourbusiness.com" />
                            </div>
                        </div>
                    </div>

                    <div className="form-card">
                        <p className="card-title">Payment Links <span className="label-hint">— shown on invoices so clients can pay you</span></p>
                        <div className="form-row">
                            <div className="form-group full">
                                <label>PayPal Link</label>
                                <input name="paypal_link" value={form.paypal_link || ''} onChange={handleChange} placeholder="https://paypal.me/yourname" />
                            </div>
                            <div className="form-group full">
                                <label>Stripe Link</label>
                                <input name="stripe_link" value={form.stripe_link || ''} onChange={handleChange} placeholder="https://buy.stripe.com/yourlink" />
                            </div>
                            <div className="form-group full">
                                <label>Venmo</label>
                                <input name="venmo_link" value={form.venmo_link || ''} onChange={handleChange} placeholder="@yourvenmo" />
                            </div>
                        </div>
                    </div>

                    {error && <p className="error">{error}</p>}
                    {success && <p className="success">Settings saved successfully.</p>}
                    <div className="form-actions">
                        <button className="btn" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </main>
            </div>
        </>
    )
}