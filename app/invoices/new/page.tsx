'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NewInvoice() {
    const [form, setForm] = useState({
        client_id: '', job_id: '', invoice_number: '', issue_date: new Date().toISOString().split('T')[0],
        due_date: '', status: 'pending', notes: ''
    })
    const [items, setItems] = useState([{ description: '', quantity: '1', unit_price: '' }])
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            const { data: clientList } = await supabase.from('clients').select('id, name').order('name')
            setClients(clientList || [])
            const jobId = searchParams.get('job_id')
            const clientId = searchParams.get('client_id')
            const invoiceNum = 'INV-' + Date.now().toString().slice(-6)
            const due = new Date()
            due.setDate(due.getDate() + 30)
            setForm(f => ({
                ...f,
                client_id: clientId || '',
                job_id: jobId || '',
                invoice_number: invoiceNum,
                due_date: due.toISOString().split('T')[0]
            }))
        }
        load()
    }, [])

    const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleItemChange = (index: number, field: string, value: string) => {
        const updated = [...items]
        updated[index] = { ...updated[index], [field]: value }
        setItems(updated)
    }

    const addItem = () => setItems([...items, { description: '', quantity: '1', unit_price: '' }])

    const removeItem = (index: number) => {
        if (items.length === 1) return
        setItems(items.filter((_, i) => i !== index))
    }

    const total = items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0
        const price = parseFloat(item.unit_price) || 0
        return sum + qty * price
    }, 0)

    const handleSubmit = async () => {
        if (!form.client_id) { setError('Please select a client.'); return }
        if (!form.invoice_number) { setError('Invoice number is required.'); return }
        if (!form.due_date) { setError('Due date is required.'); return }
        if (items.some(i => !i.description || !i.unit_price)) { setError('All line items need a description and price.'); return }
        setLoading(true)
        setError('')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const { data: invoice, error: invError } = await supabase
            .from('invoices')
            .insert({
                user_id: user.id,
                client_id: form.client_id,
                job_id: form.job_id || null,
                invoice_number: form.invoice_number,
                issue_date: form.issue_date,
                due_date: form.due_date,
                status: form.status,
                notes: form.notes,
                total_cents: Math.round(total * 100)
            })
            .select()
            .single()
        if (invError) { setError(invError.message); setLoading(false); return }
        const lineItems = items.map(item => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit_price_cents: Math.round(parseFloat(item.unit_price) * 100)
        }))
        const { error: itemsError } = await supabase.from('invoice_items').insert(lineItems)
        if (itemsError) { setError(itemsError.message); setLoading(false); return }
        router.push(`/invoices/${invoice.id}`)
    }

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
          gap: 16px;
          margin-bottom: 40px;
        }
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
          max-width: 720px;
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
        .section-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 16px;
          text-transform: uppercase;
          color: var(--ink);
          margin: 32px 0 16px;
          padding-top: 32px;
          border-top: 1.5px solid var(--border);
        }
        .line-items { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .line-item {
          display: grid;
          grid-template-columns: 1fr 80px 120px 40px;
          gap: 10px;
          align-items: center;
        }
        .remove-item {
          background: none;
          border: none;
          color: #c0392b;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          line-height: 1;
        }
        .add-item {
          background: none;
          border: 1.5px dashed var(--border);
          color: var(--muted);
          font-family: 'Barlow', sans-serif;
          font-size: 13px;
          padding: 10px;
          cursor: pointer;
          width: 100%;
          transition: border-color 0.15s, color 0.15s;
        }
        .add-item:hover { border-color: var(--ink); color: var(--ink); }
        .total-row {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 16px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1.5px solid var(--border);
        }
        .total-label { font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .total-amount {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 800;
          font-size: 28px;
          color: var(--ink);
        }
        .error { font-size: 13px; color: #c0392b; margin-bottom: 16px; margin-top: 16px; }
        .form-actions { display: flex; gap: 12px; align-items: center; margin-top: 24px; }
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
        .btn-cancel {
          font-size: 13px;
          color: var(--muted);
          text-decoration: none;
          border-bottom: 1px solid var(--border);
        }
        .line-header {
          display: grid;
          grid-template-columns: 1fr 80px 120px 40px;
          gap: 10px;
          margin-bottom: 6px;
        }
        .line-header span {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--muted);
        }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main { padding: 24px 20px; }
          .form-row { grid-template-columns: 1fr; }
          .line-item { grid-template-columns: 1fr 60px 100px 30px; }
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
                        <a href="/invoices" className="back">← Invoices</a>
                        <h1>New Invoice</h1>
                    </div>

                    <div className="form-card">
                        <div className="form-row">
                            <div className="form-group full">
                                <label>Client *</label>
                                <select name="client_id" value={form.client_id} onChange={handleChange}>
                                    <option value="">Select a client...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Invoice Number *</label>
                                <input name="invoice_number" value={form.invoice_number} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={form.status} onChange={handleChange}>
                                    <option value="draft">Draft</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Issue Date</label>
                                <input name="issue_date" type="date" value={form.issue_date} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Due Date *</label>
                                <input name="due_date" type="date" value={form.due_date} onChange={handleChange} />
                            </div>
                        </div>

                        <p className="section-title">Line Items</p>
                        <div className="line-header">
                            <span>Description</span>
                            <span>Qty</span>
                            <span>Unit Price</span>
                            <span></span>
                        </div>
                        <div className="line-items">
                            {items.map((item, i) => (
                                <div key={i} className="line-item">
                                    <input
                                        placeholder="e.g. AC repair labor"
                                        value={item.description}
                                        onChange={e => handleItemChange(i, 'description', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="1"
                                        value={item.quantity}
                                        onChange={e => handleItemChange(i, 'quantity', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={item.unit_price}
                                        onChange={e => handleItemChange(i, 'unit_price', e.target.value)}
                                    />
                                    <button className="remove-item" onClick={() => removeItem(i)}>×</button>
                                </div>
                            ))}
                        </div>
                        <button className="add-item" onClick={addItem}>+ Add line item</button>

                        <div className="total-row">
                            <span className="total-label">Total</span>
                            <span className="total-amount">${total.toFixed(2)}</span>
                        </div>

                        <div className="form-group" style={{ marginTop: '24px' }}>
                            <label>Notes</label>
                            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Payment instructions, thank you note, anything for the client..." />
                        </div>

                        {error && <p className="error">{error}</p>}
                        <div className="form-actions">
                            <button className="btn" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Saving...' : 'Save Invoice'}
                            </button>
                            <a href="/invoices" className="btn-cancel">Cancel</a>
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}