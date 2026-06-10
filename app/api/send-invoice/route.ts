import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
    try {
        const { invoice, items, client, company } = await request.json()

        const formatMoney = (cents: number) =>
            '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

        const itemRows = items.map((item: any) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e5e5e5;font-size:14px;">${item.description}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e5e5;font-size:14px;text-align:right;">${item.quantity}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e5e5;font-size:14px;text-align:right;">${formatMoney(item.unit_price_cents)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e5e5;font-size:14px;text-align:right;font-weight:600;">${formatMoney(item.quantity * item.unit_price_cents)}</td>
      </tr>
    `).join('')

        const paymentLinks = []
        if (company?.paypal_link) paymentLinks.push(`<a href="${company.paypal_link}" style="display:inline-block;background:#003087;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700;font-size:14px;margin-right:8px;margin-bottom:8px;">Pay with PayPal</a>`)
        if (company?.stripe_link) paymentLinks.push(`<a href="${company.stripe_link}" style="display:inline-block;background:#635bff;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700;font-size:14px;margin-right:8px;margin-bottom:8px;">Pay by Card</a>`)

        const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f5f3ef;font-family:sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #d1cdc6;">

          <div style="background:#1c2b3a;padding:32px 40px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
                ${company?.company_name || '<span style="color:#e85d04">KUVLO</span>'}
              </div>
              ${company?.phone ? `<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">${company.phone}</div>` : ''}
              ${company?.email ? `<div style="font-size:13px;color:rgba(255,255,255,0.5);">${company.email}</div>` : ''}
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Invoice</div>
              <div style="font-size:20px;font-weight:700;color:#fff;">${invoice.invoice_number}</div>
            </div>
          </div>

          <div style="padding:40px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;">
              <div>
                <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Bill To</div>
                <div style="font-size:15px;font-weight:600;color:#0f0f0f;">${client.name}</div>
                ${client.email ? `<div style="font-size:13px;color:#6b7280;">${client.email}</div>` : ''}
                ${client.phone ? `<div style="font-size:13px;color:#6b7280;">${client.phone}</div>` : ''}
              </div>
              <div>
                <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Due Date</div>
                <div style="font-size:15px;font-weight:600;color:#0f0f0f;">${new Date(invoice.due_date).toLocaleDateString()}</div>
              </div>
            </div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <thead>
                <tr style="background:#f5f3ef;">
                  <th style="padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:left;border-bottom:1.5px solid #d1cdc6;">Description</th>
                  <th style="padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:right;border-bottom:1.5px solid #d1cdc6;">Qty</th>
                  <th style="padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:right;border-bottom:1.5px solid #d1cdc6;">Price</th>
                  <th style="padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:right;border-bottom:1.5px solid #d1cdc6;">Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <div style="text-align:right;padding-top:16px;border-top:1.5px solid #d1cdc6;margin-bottom:32px;">
              <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Total Due</div>
              <div style="font-size:36px;font-weight:900;color:#0f0f0f;">${formatMoney(invoice.total_cents)}</div>
            </div>

            ${paymentLinks.length > 0 ? `
            <div style="background:#f5f3ef;padding:24px;margin-bottom:24px;">
              <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Pay This Invoice</div>
              ${paymentLinks.join('')}
              ${company?.venmo_link ? `<div style="font-size:13px;color:#6b7280;margin-top:8px;">Venmo: ${company.venmo_link}</div>` : ''}
            </div>
            ` : ''}

            ${invoice.notes ? `
            <div style="font-size:14px;color:#6b7280;font-style:italic;padding-top:16px;border-top:1px solid #e5e5e5;">
              ${invoice.notes}
            </div>
            ` : ''}
          </div>

          <div style="background:#f5f3ef;padding:20px 40px;border-top:1px solid #d1cdc6;text-align:center;">
            <div style="font-size:12px;color:#6b7280;">Sent via Kuvlo · kuvlo.io</div>
          </div>
        </div>
      </body>
      </html>
    `

        const { data, error } = await resend.emails.send({
            from: 'invoices@kuvlo.io',
            to: client.email,
            subject: `Invoice ${invoice.invoice_number} from ${company?.company_name || 'Kuvlo'} - ${formatMoney(invoice.total_cents)} due ${new Date(invoice.due_date).toLocaleDateString()}`,
            html
        })

        if (error) return NextResponse.json({ error }, { status: 400 })
        return NextResponse.json({ success: true, data })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}