'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function JobDetail() {
    const [form, setForm] = useState({
        title: '', job_type: '', scheduled_at: '', duration_min: '', price_cents: '',
        status: 'scheduled', address: '', city: '', state: '', zip_code: '', notes: '', client_id: ''
    })
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            const [{ data: job }, { data: clientList }] = await Promise.all([
                supabase.from('jobs').select('*').eq('id', params.id).single(),
                supabase.from('clients').select('id, name').order('name')
            ])
            if (job) {
                setForm({
                    ...job,
                    scheduled_at: job.scheduled_at ? new Date(job.scheduled_at).toISOString().slice(0, 16) : '',
                    price_cents: job.price_cents ? (job.price_cents / 100).toString() : '',
                    duration_min: job.duration_min?.toString() || ''
                })
            }
            setClients(clientList || [])
            setLoading(false)
        }
        load()
    }, [])

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSave = async () => {
        if (!form.title) { setError('Job title is required.'); return }
        if (!form.scheduled_at) { setError('Scheduled date is required.'); return }
        setSaving(true)
        setError('')
        const { error } = await supabase
            .from('jobs')
            .update({
                title: form.title,
                job_type: form.job_type,
                scheduled_at: form.scheduled_at,
                duration_min: form.duration_min ? parseInt(form.duration_min) : null,
                price_cents: form.price_cents ? Math.round(parseFloat(form.price_cents) * 100) : null,
                status: form.status,
                address: form.address,
                city: form.city,
                state: form.state,
                zip_code: form.zip_code,
                notes: form.notes,
                client_id: form.client_id
            })
            .eq('id', params.id)
        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!confirm('Delete this job? This cannot be undone.')) return
        await supabase.from('jobs').delete().eq('id', params.id)
        router.push('/jobs')
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
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .page-header-left { display: flex; align-items: center; gap: 16px; }
        .back {
          font-size: 13px;
          color: var(--muted);
          text-decoration: none;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1px;
        }
        .back:hover { color: var(--ink); }
        .page-header h1 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 36px;
          text-transform: uppercase;
          color: var(--ink);
        }
        .form-card {
          background: #fff;
          border: 1.5px solid var(--border);
          padding: 40px;
          max-width: 640px;
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
        input, select, textarea {
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
        input:focus, select:focus, textarea:focus { border-color: var(--ink); }
        textarea { resize: vertical; min-height: 80px; }
        .error { font-size: 13px; color: #c0392b; margin-bottom: 16px; }
        .success { font-size: 13px; color: #27ae60; margin-bottom: 16px; }
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }
        .form-actions-left { display: flex; gap: 12px; align-items: center; }
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
        .btn-invoice {
          background: var(--steel);
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 12px 24px;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          text-decoration: none;
          display: inline-block;
        }
        .btn-invoice:hover { background: #243547; }
        .btn-delete {
          font-size: 13px;
          color: #c0392b;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Barlow', sans-serif;
          border-bottom: 1px solid #c0392b;
          padding-bottom: 1px;
        }
        .btn-delete:hover { opacity: 0.7; }
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
                    <a href="/jobs" className="nav-item active">Jobs</a>
                    <a href="/invoices" className="nav-item">Invoices</a>
                    <p className="nav-section">Account</p>
                    <a href="/settings" className="nav-item">Settings</a>
                    <button className="signout" onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Sign out</button>
                </aside>

                <main className="main">
                    <div className="page-header">
                        <div className="page-header-left">
                            <a href="/jobs" className="back">← Jobs</a>
                            <h1>{form.title || 'Job'}</h1>
                        </div>
                        <a href={`/invoices/new?job_id=${params.id}&client_id=${form.client_id}`} className="btn-invoice">
                            + Create Invoice
                        </a>
                    </div>

                    <div className="form-card">
                        <div className="form-row">
                            <div className="form-group full">
                                <label>Client</label>
                                <select name="client_id" value={form.client_id} onChange={handleChange}>
                                    <option value="">Select a client...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group full">
                                <label>Job Title *</label>
                                <input name="title" value={form.title} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Job Type</label>
                                <input name="job_type" value={form.job_type || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={form.status} onChange={handleChange}>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Scheduled Date & Time *</label>
                                <input name="scheduled_at" type="datetime-local" value={form.scheduled_at} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Duration (minutes)</label>
                                <input name="duration_min" type="number" value={form.duration_min || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Price ($)</label>
                                <input name="price_cents" type="number" step="0.01" value={form.price_cents || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group full">
                                <label>Job Site Address</label>
                                <input name="address" value={form.address || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>City</label>
                                <input name="city" value={form.city || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>State</label>
                                <input name="state" value={form.state || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group full">
                                <label>Notes</label>
                                <textarea name="notes" value={form.notes || ''} onChange={handleChange} />
                            </div>
                        </div>
                        {error && <p className="error">{error}</p>}
                        {success && <p className="success">Job saved successfully.</p>}
                        <div className="form-actions">
                            <div className="form-actions-left">
                                <button className="btn" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                            <button className="btn-delete" onClick={handleDelete}>Delete job</button>
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}