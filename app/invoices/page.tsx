'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../utils/supabase'
import { useRouter } from 'next/navigation'

export default function Invoices() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            const { data } = await supabase
                .from('invoices')
                .select('*, clients(name)')
                .order('created_at', { ascending: false })
            setInvoices(data || [])
            setLoading(false)
        }
        load()
    }, [])

    const statusColor = (status: string) => {
        switch (status) {
            case 'paid': return '#27ae60'
            case 'pending': return '#e85d04'
            case 'overdue': return '#c0392b'
            case 'draft': return '#999'
            case 'cancelled': return '#999'
            default: return '#999'
        }
    }

    const formatMoney = (cents: number) => {
        return '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
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
        .invoices-table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
          border: 1.5px solid var(--border);
        }
        .invoices-table th {
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
        .invoices-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: var(--ink);
          border-bottom: 1px solid var(--border);
        }
        .invoices-table tr:last-child td { border-bottom: none; }
        .invoices-table tr:hover td { background: #faf9f7; cursor: pointer; }
        .status-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 3px 10px;
          border-radius: 20px;
          color: #fff;
        }
        .empty-state {
          background: #fff;
          border: 1.5px solid var(--border);
          padding: 64px;
          text-align: center;
        }
        .empty-state p { font-size: 15px; color: var(--muted); margin-bottom: 24px; }
        .invoice-num { font-weight: 500; font-family: monospace; }
        .invoice-meta { font-size: 13px; color: var(--muted); }
        .amount { font-weight: 600; }
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
                    <a href="/clients" className="nav-item">Clients</a>
                    <a href="/jobs" className="nav-item">Jobs</a>
                    <a href="/invoices" className="nav-item active">Invoices</a>
                    <p className="nav-section">Account</p>
                    <a href="/settings" className="nav-item">Settings</a>
                    <button className="signout" onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Sign out</button>
                </aside>

                <main className="main">
                    <div className="page-header">
                        <h1>Invoices</h1>
                        <a href="/invoices/new" className="btn">+ New Invoice</a>
                    </div>

                    {invoices.length === 0 ? (
                        <div className="empty-state">
                            <p>No invoices yet. Create your first invoice from a job or from scratch.</p>
                            <a href="/invoices/new" className="btn">Create first invoice</a>
                        </div>
                    ) : (
                        <table className="invoices-table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Client</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}>
                                        <td><span className="invoice-num">{inv.invoice_number}</span></td>
                                        <td><span className="invoice-meta">{inv.clients?.name || '-'}</span></td>
                                        <td><span className="amount">{formatMoney(inv.total_cents)}</span></td>
                                        <td><span className="invoice-meta">{new Date(inv.due_date).toLocaleDateString()}</span></td>
                                        <td>
                                            <span className="status-badge" style={{ background: statusColor(inv.status) }}>
                                                {inv.status}
                                            </span>
                                        </td>
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