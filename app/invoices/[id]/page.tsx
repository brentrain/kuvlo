'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function InvoiceDetail() {
    const [invoice, setInvoice] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])
    const [client, setClient] = useState<any>(null)
    const [company, setCompany] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            const { data: inv } = await supabase
                .from('invoices')
                .select('*, clients(*)')
                .eq('id', params.id)
                .single()
            if (!inv) { router.push('/invoices'); return }
            setInvoice(inv)
            setClient(inv.clients)
            const { data: lineItems } = await supabase
                .from('invoice_items')
                .select('*')
                .eq('invoice_id', params.id)
            setItems(lineItems || [])
            const { data: companyData } = await supabase
                .from('company_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()
            setCompany(companyData)
            setLoading(false)
        }
        load()
    }, [])

    const handleStatusChange = async (status: string) => {
        setSaving(true)
        await supabase.from('invoices').update({ status }).eq('id', params.id)
        setInvoice({ ...invoice, status })
        setSaving(false)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
    }

    const handleDelete = async () => {
        if (!confirm('Delete this invoice? This cannot be undone.')) return
        await supabase.from('invoices').delete().eq('id', params.id)
        router.push('/invoices')
    }

    const formatMoney = (cents: number) => '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    const statusColor = (status: string) => {
        switch (status) {
            case 'paid': return '#27ae60'
            case 'pending': return '#e85d04'
            case 'overdue': return '#c0392b'
            default: return '#999'
        }
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
        .btn-steel {
          background: var(--steel);
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding: 11px 22px;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-steel:hover { background: #243547; }
        .invoice-card {
          background: #fff;
          border: 1.5px solid var(--border);
          max-width: 720px;
        }
        .invoice-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 40px 40px 32px;
          border-bottom: 1.5px solid var(--border);
        }
        .invoice-brand {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 28px;
          color: var(--ink);
          margin-bottom: 6px;
        }
        .invoice-brand span { color: var(--orange); }
        .invoice-num {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 22px;
          color: var(--ink);
          text-align: right;
        }
        .invoice-meta-label {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
          text-align: right;
        }
        .invoice-body { padding: 40px; }
        .invoice-info {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 32px;
          margin-bottom: 40px;
        }
        .info-label {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .info-value { font-size: 14px; color: var(--ink); font-weight: 500; }
        .status-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 12px;
          border-radius: 20px;
          color: #fff;
        }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .items-table th {
          text-align: left;
          padding: 10px 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--muted);
          border-bottom: 1.5px solid var(--border);
        }
        .items-table th:last-child { text-align: right; }
        .items-table td {
          padding: 12px;
          font-size: 14px;
          color: var(--ink);
          border-bottom: 1px solid var(--border);
        }
        .items-table td:last-child { text-align: right; font-weight: 500; }
        .items-table tr:last-child td { border-bottom: none; }
        .total-section {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1.5px solid var(--border);
          margin-bottom: 32px;
        }
        .total-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .total-amount {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 36px;
          color: var(--ink);
          text-align: right;
        }
        .notes-section { margin-bottom: 24px; }
        .notes-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .notes-text { font-size: 14px; color: var(--muted); font-style: italic; }
        .payment-link { font-size: 14px; margin-bottom: 4px; }
        .payment-link a { color: var(--orange); text-decoration: none; }
        .invoice-footer {
          padding: 24px 40px;
          border-top: 1.5px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-select { display: flex; align-items: center; gap: 10px; }
        .status-select label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
        select {
          padding: 8px 12px;
          border: 1.5px solid var(--border);
          background: var(--fog);
          font-family: 'Barlow', sans-serif;
          font-size: 13px;
          color: var(--ink);
          outline: none;
        }
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
        .success { font-size: 13px; color: #27ae60; }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main { padding: 24px 20px; }
          .invoice-info { grid-template-columns: 1fr 1fr; }
          .invoice-top { flex-direction: column; gap: 20px; }
        }
        @media print {
          .sidebar, .page-header, .invoice-footer { display: none; }
          .main { padding: 0; }
          .invoice-card { border: none; max-width: 100%; }
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
                        <div className="page-header-left">
                            <a href="/invoices" className="back">← Invoices</a>
                            <h1>{invoice.invoice_number}</h1>
                        </div>
                        <button className="btn-steel" onClick={() => window.print()}>Print / PDF</button>
                    </div>

                    <div className="invoice-card">
                        <div className="invoice-top">
                            <div>
                                {company?.company_name ? (
                                    <div className="invoice-brand">{company.company_name}</div>
                                ) : (
                                    <div className="invoice-brand">KUV<span>LO</span></div>
                                )}
                                {company?.address && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{company.address}</div>}
                                {company?.city && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{company.city}{company.state ? ', ' + company.state : ''} {company.zip_code || ''}</div>}
                                {company?.phone && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{company.phone}</div>}
                                {company?.email && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{company.email}</div>}
                                {!company?.company_name && <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>kuvlo.io</div>}
                            </div>
                            <div>
                                <div className="invoice-meta-label">Invoice</div>
                                <div className="invoice-num">{invoice.invoice_number}</div>
                            </div>
                        </div>

                        <div className="invoice-body">
                            <div className="invoice-info">
                                <div>
                                    <div className="info-label">Bill To</div>
                                    <div className="info-value">{client?.name}</div>
                                    {client?.email && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{client.email}</div>}
                                    {client?.phone && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{client.phone}</div>}
                                    {client?.address && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{client.address}</div>}
                                    {client?.city && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{client.city}{client.state ? ', ' + client.state : ''}</div>}
                                </div>
                                <div>
                                    <div className="info-label">Issue Date</div>
                                    <div className="info-value">{new Date(invoice.issue_date).toLocaleDateString()}</div>
                                    <div className="info-label" style={{ marginTop: '16px' }}>Due Date</div>
                                    <div className="info-value">{new Date(invoice.due_date).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="info-label">Status</div>
                                    <span className="status-badge" style={{ background: statusColor(invoice.status) }}>
                                        {invoice.status}
                                    </span>
                                </div>
                            </div>

                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th style={{ textAlign: 'right' }}>Qty</th>
                                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.description}</td>
                                            <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right' }}>{formatMoney(item.unit_price_cents)}</td>
                                            <td>{formatMoney(item.quantity * item.unit_price_cents)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="total-section">
                                <div>
                                    <div className="total-label">Total Due</div>
                                    <div className="total-amount">{formatMoney(invoice.total_cents)}</div>
                                </div>
                            </div>

                            {invoice.notes && (
                                <div className="notes-section">
                                    <div className="notes-label">Notes</div>
                                    <div className="notes-text">{invoice.notes}</div>
                                </div>
                            )}

                            {(company?.paypal_link || company?.stripe_link || company?.venmo_link) && (
                                <div className="notes-section">
                                    <div className="notes-label">Pay This Invoice</div>
                                    {company?.paypal_link && (
                                        <div className="payment-link">PayPal: <a href={company.paypal_link} target="_blank">{company.paypal_link}</a></div>
                                    )}
                                    {company?.stripe_link && (
                                        <div className="payment-link">Card: <a href={company.stripe_link} target="_blank">{company.stripe_link}</a></div>
                                    )}
                                    {company?.venmo_link && (
                                        <div className="payment-link">Venmo: {company.venmo_link}</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="invoice-footer">
                            <div className="status-select">
                                <label>Status</label>
                                <select value={invoice.status} onChange={e => handleStatusChange(e.target.value)} disabled={saving}>
                                    <option value="draft">Draft</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                {success && <span className="success">Saved</span>}
                            </div>
                            <button className="btn-delete" onClick={handleDelete}>Delete invoice</button>
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}