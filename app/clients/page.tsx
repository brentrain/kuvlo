'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../utils/supabase'
import { useRouter } from 'next/navigation'

export default function Clients() {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            setUser(user)
            const { data } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false })
            setClients(data || [])
            setLoading(false)
        }
        load()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
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
        .page-header h1 {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 36px;
          text-transform: uppercase;
          color: var(--ink);
        }
        .btn {
          background: var(--orange);
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 12px 24px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          display: inline-block;
        }
        .btn:hover { background: #c44d00; }
        .clients-table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
          border: 1.5px solid var(--border);
        }
        .clients-table th {
          text-align: left;
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--muted);
          border-bottom: 1.5px solid var(--border);
          background: #faf9f7;
        }
        .clients-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: var(--ink);
          border-bottom: 1px solid var(--border);
        }
        .clients-table tr:last-child td { border-bottom: none; }
        .clients-table tr:hover td { background: #faf9f7; cursor: pointer; }
        .empty-state {
          background: #fff;
          border: 1.5px solid var(--border);
          padding: 64px;
          text-align: center;
        }
        .empty-state p { font-size: 15px; color: var(--muted); margin-bottom: 24px; }
        .client-name { font-weight: 500; }
        .client-meta { font-size: 13px; color: var(--muted); }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main { padding: 24px 20px; }
        }
      `}</style>

            <div className="layout">
                <aside className="sidebar">
                    <a href="/" className="logo">KUV<span>LO</span></a>
                    <p className="nav-section">Main</p>
                    <a href="/dashboard" className="nav-item">Dashboard</a>
                    <a href="/clients" className="nav-item active">Clients</a>
                    <a href="/jobs" className="nav-item">Jobs</a>
                    <a href="/invoices" className="nav-item">Invoices</a>
                    <p className="nav-section">Account</p>
                    <a href="/settings" className="nav-item">Settings</a>
                    <button className="signout" onClick={handleSignOut}>Sign out</button>
                </aside>

                <main className="main">
                    <div className="page-header">
                        <h1>Clients</h1>
                        <a href="/clients/new" className="btn">+ Add Client</a>
                    </div>

                    {clients.length === 0 ? (
                        <div className="empty-state">
                            <p>No clients yet. Add your first client to get started.</p>
                            <a href="/clients/new" className="btn">Add your first client</a>
                        </div>
                    ) : (
                        <table className="clients-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>City</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.id} onClick={() => router.push(`/clients/${client.id}`)}>
                                        <td><span className="client-name">{client.name}</span></td>
                                        <td><span className="client-meta">{client.phone || '-'}</span></td>
                                        <td><span className="client-meta">{client.email || '-'}</span></td>
                                        <td><span className="client-meta">{client.city || '-'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </main>
            </div>
        </>
    )
}