import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient, type Session, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const lemonsqueezyStoreUrl = import.meta.env.VITE_LEMONSQUEEZY_STORE_URL || '';
const lemonsqueezyVariantId = import.meta.env.VITE_LEMONSQUEEZY_VARIANT_ID || '';
const emailApiUrl = import.meta.env.VITE_EMAIL_API_URL || '/api/send-invoice';

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

type AuthMode = 'signin' | 'signup';

type Client = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string | null;
};

type Invoice = {
  id: string;
  user_id: string;
  client_id: string | null;
  total_amount: number;
  payment_status: string;
  invoice_number: string | null;
  description: string | null;
  due_date: string | null;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string | null;
};

type CompanyProfile = {
  id?: string;
  user_id: string;
  business_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
};

type ClientFormState = {
  id: string | null;
  full_name: string;
  email: string;
  phone: string;
  notes: string;
};

type InvoiceFormState = {
  id: string | null;
  client_id: string;
  total_amount: string;
  description: string;
  due_date: string;
  payment_status: string;
  invoice_number: string;
};

const emptyClientForm = (): ClientFormState => ({
  id: null,
  full_name: '',
  email: '',
  phone: '',
  notes: '',
});

const emptyInvoiceForm = (): InvoiceFormState => ({
  id: null,
  client_id: '',
  total_amount: '',
  description: '',
  due_date: '',
  payment_status: 'pending',
  invoice_number: '',
});

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [clientForm, setClientForm] = useState<ClientFormState>(emptyClientForm());
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState>(emptyInvoiceForm());
  const [companyForm, setCompanyForm] = useState<CompanyProfile | null>(null);
  const [activeSection, setActiveSection] = useState<'clients' | 'invoices' | 'company'>('clients');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash App');
  const [paymentAmount, setPaymentAmount] = useState('');

  const loadData = async (currentUser: User) => {
    if (!supabase) return;
    setIsLoading(true);

    try {
      const [{ data: profileData }, { data: clientsData }, { data: invoicesData }] = await Promise.all([
        supabase.from('company_profiles').select('*').eq('user_id', currentUser.id).maybeSingle(),
        supabase.from('clients').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
      ]);

      if (profileData) {
        setCompanyProfile(profileData as CompanyProfile);
        setCompanyForm(profileData as CompanyProfile);
      } else {
        const fallbackProfile: CompanyProfile = {
          user_id: currentUser.id,
          business_name: currentUser.email?.split('@')[0] || 'Your Business',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          email: currentUser.email || '',
          phone: '',
          tax_id: '',
        };
        setCompanyProfile(fallbackProfile);
        setCompanyForm(fallbackProfile);
      }

      setClients((clientsData as Client[]) || []);
      setInvoices((invoicesData as Invoice[]) || []);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load your data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setMessage('Add your Supabase URL and anon key to continue.');
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const nextUser = data.session?.user ?? null;
      setSession(data.session);
      setUser(nextUser);
      if (nextUser) {
        void loadData(nextUser);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUser = nextSession?.user ?? null;
      setSession(nextSession);
      setUser(nextUser);
      if (nextUser) {
        void loadData(nextUser);
      } else {
        setClients([]);
        setInvoices([]);
        setCompanyProfile(null);
        setCompanyForm(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setMessage('Supabase client is not configured.');
      return;
    }

    setMessage('Working...');
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your inbox to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('Signed in successfully.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage('Signed out.');
  };

  const handleSaveCompany = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !user) return;

    try {
      const payload = {
        user_id: user.id,
        business_name: companyForm?.business_name || 'Your Business',
        address: companyForm?.address || '',
        city: companyForm?.city || '',
        state: companyForm?.state || '',
        zip_code: companyForm?.zip_code || '',
        email: companyForm?.email || user.email || '',
        phone: companyForm?.phone || '',
        tax_id: companyForm?.tax_id || '',
      };

      let nextProfile: CompanyProfile | null = null;
      if (companyProfile?.id) {
        const { data, error } = await supabase.from('company_profiles').update(payload).eq('id', companyProfile.id).select().single();
        if (error) throw error;
        nextProfile = data as CompanyProfile;
      } else {
        const { data, error } = await supabase.from('company_profiles').insert(payload).select().single();
        if (error) throw error;
        nextProfile = data as CompanyProfile;
      }

      setCompanyProfile(nextProfile);
      setCompanyForm(nextProfile);
      setMessage('Company details updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update company details.');
    }
  };

  const handleClientSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !user) return;

    try {
      const payload = {
        user_id: user.id,
        full_name: clientForm.full_name.trim(),
        email: clientForm.email.trim() || null,
        phone: clientForm.phone.trim() || null,
        notes: clientForm.notes.trim() || null,
      };

      if (clientForm.id) {
        const { error } = await supabase.from('clients').update(payload).eq('id', clientForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').insert(payload);
        if (error) throw error;
      }

      setClientForm(emptyClientForm());
      await loadData(user);
      setMessage(clientForm.id ? 'Client updated.' : 'Client added.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save client.');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!supabase || !user) return;
    if (!window.confirm('Delete this client?')) return;

    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;
      await loadData(user);
      setMessage('Client removed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete client.');
    }
  };

  const handleInvoiceSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !user) return;

    try {
      const payload = {
        user_id: user.id,
        client_id: invoiceForm.client_id || null,
        total_amount: Number(invoiceForm.total_amount),
        description: invoiceForm.description.trim() || 'Services rendered',
        due_date: invoiceForm.due_date || null,
        payment_status: invoiceForm.payment_status,
        invoice_number: invoiceForm.invoice_number.trim() || `INV-${Date.now().toString().slice(-6)}`,
      };

      if (invoiceForm.id) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', invoiceForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('invoices').insert(payload);
        if (error) throw error;
      }

      setInvoiceForm(emptyInvoiceForm());
      await loadData(user);
      setMessage(invoiceForm.id ? 'Invoice updated.' : 'Invoice created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save invoice.');
    }
  };

  const handleRecordPayment = async (invoice: Invoice) => {
    if (!supabase || !user) return;

    try {
      const amount = Number(paymentAmount || invoice.total_amount);
      const { error } = await supabase.from('invoices').update({
        total_amount: amount,
        payment_status: 'paid',
        payment_method: paymentMethod,
        paid_at: new Date().toISOString(),
      }).eq('id', invoice.id);

      if (error) throw error;
      setPaymentAmount('');
      await loadData(user);
      setMessage('Payment recorded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to record payment.');
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    if (!companyProfile) {
      setMessage('Save your company profile before sending invoices.');
      return;
    }

    const client = clients.find((item) => item.id === invoice.client_id);
    const subject = `Invoice ${invoice.invoice_number || invoice.id.slice(0, 8)} from ${companyProfile.business_name}`;
    const body = [
      `Hi ${client?.full_name || 'there'},`,
      '',
      `Please find your invoice for ${invoice.description || 'services rendered'} in the amount of $${invoice.total_amount.toFixed(2)} due on ${invoice.due_date || 'today'}.`,
      '',
      `Thanks,`,
      companyProfile.business_name,
      companyProfile.email || '',
      companyProfile.phone || '',
    ].filter(Boolean).join('\n');

    if (emailApiUrl) {
      try {
        const response = await fetch(emailApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: client?.email || companyProfile.email,
            subject,
            text: body,
            html: `<p>${body.replace(/\n/g, '<br />')}</p>`,
            from: companyProfile.email || user?.email || 'hello@yourbusiness.com',
          }),
        });

        if (response.ok) {
          setMessage('Invoice sent successfully.');
          return;
        }
      } catch (error) {
        setMessage('Email service is unavailable, so the draft was opened instead.');
      }
    }

    window.location.href = `mailto:${client?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMessage('Invoice draft opened in your email app.');
  };

  const handlePayInvoice = (invoice: Invoice) => {
    const client = clients.find((item) => item.id === invoice.client_id);
    if (!lemonsqueezyStoreUrl || !lemonsqueezyVariantId) {
      setMessage('Add your Lemon Squeezy store URL and variant ID in the environment file to enable checkout.');
      return;
    }

    const url = new URL(`${lemonsqueezyStoreUrl.replace(/\/$/, '')}/checkout/buy/${lemonsqueezyVariantId}`);
    url.searchParams.set('checkout[email]', client?.email || '');
    url.searchParams.set('checkout[name]', client?.full_name || '');
    url.searchParams.set('checkout[custom][invoice_id]', invoice.id);
    url.searchParams.set('checkout[custom][invoice_number]', invoice.invoice_number || '');
    url.searchParams.set('checkout[custom][amount]', String(invoice.total_amount));

    window.open(url.toString(), '_blank', 'noopener,noreferrer');
    setMessage('Lemon Squeezy checkout opened.');
  };

  const featureList = useMemo(
    () => [
      {
        title: 'Job Scheduling',
        description: 'Coordinate appointments, recurring work, and team availability in one calendar view.',
      },
      {
        title: 'Billing & Invoicing',
        description: 'Generate polished invoices, track due dates, and stay on top of payments.',
      },
      {
        title: 'Client Communication',
        description: 'Keep conversations organized with a shared messaging hub for every client.',
      },
      {
        title: 'Modern Payments',
        description: 'Accept Venmo, PayPal, and CashApp with streamlined payment experiences.',
      },
    ],
    []
  );

  return (
    <div className="app-shell">
      <header className="hero">
        <nav className="nav">
          <div className="brand">Kuvlo</div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            {user ? <button onClick={handleSignOut}>Sign Out</button> : null}
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">Centralized business operations</p>
            <h1>Run your business, not your paperwork.</h1>
            <p className="lead">
              Kuvlo helps small businesses manage scheduling, billing, and client communication in one flat-rate workspace.
            </p>
            <div className="hero-actions">
              <a className="primary-btn" href="#pricing">Sign Up</a>
              <a className="secondary-btn" href="#features">Explore Features</a>
            </div>
          </div>

          <div className="auth-card">
            <h2>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
            <form onSubmit={handleAuth}>
              <label>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
              </label>
              <button type="submit">{authMode === 'signup' ? 'Sign Up' : 'Sign In'}</button>
            </form>
            <p className="switcher">
              {authMode === 'signup' ? 'Already have an account?' : "Need an account?"}{' '}
              <button type="button" onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}>
                {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
            {message ? <p className="message">{message}</p> : null}
            {user ? <p className="message">Signed in as {user.email}</p> : null}
          </div>
        </div>
      </header>

      {user ? (
        <main className="dashboard">
          <section className="panel hero-panel">
            <div>
              <p className="eyebrow">Business workspace</p>
              <h2>Manage clients, invoices, and payments from one place.</h2>
              <p>Every invoice is personalized with your company details so your client experience feels polished from day one.</p>
            </div>
            <div className="pill-row">
              <button className="secondary-btn" onClick={() => setActiveSection('clients')}>Clients</button>
              <button className="secondary-btn" onClick={() => setActiveSection('invoices')}>Invoices</button>
              <button className="secondary-btn" onClick={() => setActiveSection('company')}>Company</button>
            </div>
          </section>

          <section className="panel">
            <h3>Company profile</h3>
            <form onSubmit={handleSaveCompany} className="stack-form">
              <input
                value={companyForm?.business_name || ''}
                onChange={(event) => setCompanyForm((current) => current ? { ...current, business_name: event.target.value } : current)}
                placeholder="Business name"
              />
              <input
                value={companyForm?.email || ''}
                onChange={(event) => setCompanyForm((current) => current ? { ...current, email: event.target.value } : current)}
                placeholder="Email"
              />
              <input
                value={companyForm?.phone || ''}
                onChange={(event) => setCompanyForm((current) => current ? { ...current, phone: event.target.value } : current)}
                placeholder="Phone"
              />
              <input
                value={companyForm?.address || ''}
                onChange={(event) => setCompanyForm((current) => current ? { ...current, address: event.target.value } : current)}
                placeholder="Address"
              />
              <div className="grid-two">
                <input
                  value={companyForm?.city || ''}
                  onChange={(event) => setCompanyForm((current) => current ? { ...current, city: event.target.value } : current)}
                  placeholder="City"
                />
                <input
                  value={companyForm?.state || ''}
                  onChange={(event) => setCompanyForm((current) => current ? { ...current, state: event.target.value } : current)}
                  placeholder="State"
                />
              </div>
              <div className="grid-two">
                <input
                  value={companyForm?.zip_code || ''}
                  onChange={(event) => setCompanyForm((current) => current ? { ...current, zip_code: event.target.value } : current)}
                  placeholder="ZIP"
                />
                <input
                  value={companyForm?.tax_id || ''}
                  onChange={(event) => setCompanyForm((current) => current ? { ...current, tax_id: event.target.value } : current)}
                  placeholder="Tax ID"
                />
              </div>
              <button type="submit" className="primary-btn">Save company info</button>
            </form>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h3>Clients</h3>
              <button className="secondary-btn" onClick={() => setActiveSection('clients')}>Manage</button>
            </div>
            <form onSubmit={handleClientSubmit} className="stack-form">
              <input
                value={clientForm.full_name}
                onChange={(event) => setClientForm((current) => ({ ...current, full_name: event.target.value }))}
                placeholder="Client name"
                required
              />
              <input
                value={clientForm.email}
                onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Client email"
                type="email"
              />
              <input
                value={clientForm.phone}
                onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone"
              />
              <textarea
                value={clientForm.notes}
                onChange={(event) => setClientForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Notes"
                rows={3}
              />
              <div className="button-row">
                <button type="submit" className="primary-btn">{clientForm.id ? 'Update client' : 'Add client'}</button>
                {clientForm.id ? <button type="button" className="secondary-btn" onClick={() => setClientForm(emptyClientForm())}>Cancel</button> : null}
              </div>
            </form>
            <div className="list-stack">
              {clients.map((client) => (
                <div className="list-item" key={client.id}>
                  <div>
                    <strong>{client.full_name}</strong>
                    <div className="muted">{client.email || 'No email'} · {client.phone || 'No phone'}</div>
                  </div>
                  <div className="button-row">
                    <button className="secondary-btn" onClick={() => setClientForm({ id: client.id, full_name: client.full_name, email: client.email || '', phone: client.phone || '', notes: client.notes || '' })}>Edit</button>
                    <button className="secondary-btn" onClick={() => handleDeleteClient(client.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h3>Invoices</h3>
              <button className="secondary-btn" onClick={() => setActiveSection('invoices')}>Create invoice</button>
            </div>
            <form onSubmit={handleInvoiceSubmit} className="stack-form">
              <select value={invoiceForm.client_id} onChange={(event) => setInvoiceForm((current) => ({ ...current, client_id: event.target.value }))}>
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option value={client.id} key={client.id}>{client.full_name}</option>
                ))}
              </select>
              <input
                value={invoiceForm.invoice_number}
                onChange={(event) => setInvoiceForm((current) => ({ ...current, invoice_number: event.target.value }))}
                placeholder="Invoice number"
              />
              <input
                value={invoiceForm.description}
                onChange={(event) => setInvoiceForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Service description"
              />
              <input
                value={invoiceForm.total_amount}
                onChange={(event) => setInvoiceForm((current) => ({ ...current, total_amount: event.target.value }))}
                placeholder="Amount"
                type="number"
                step="0.01"
                min="0"
                required
              />
              <input
                value={invoiceForm.due_date}
                onChange={(event) => setInvoiceForm((current) => ({ ...current, due_date: event.target.value }))}
                type="date"
              />
              <select value={invoiceForm.payment_status} onChange={(event) => setInvoiceForm((current) => ({ ...current, payment_status: event.target.value }))}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              <div className="button-row">
                <button type="submit" className="primary-btn">{invoiceForm.id ? 'Update invoice' : 'Create invoice'}</button>
                {invoiceForm.id ? <button type="button" className="secondary-btn" onClick={() => setInvoiceForm(emptyInvoiceForm())}>Cancel</button> : null}
              </div>
            </form>

            <div className="list-stack">
              {invoices.map((invoice) => {
                const client = clients.find((item) => item.id === invoice.client_id);
                return (
                  <div className="list-item invoice-item" key={invoice.id}>
                    <div>
                      <strong>{invoice.invoice_number || 'Invoice'}</strong>
                      <div className="muted">{client?.full_name || 'Unassigned client'} · ${invoice.total_amount.toFixed(2)}</div>
                      <div className="muted">{invoice.description || 'Service'} · Due {invoice.due_date || 'soon'}</div>
                    </div>
                    <div className="button-row">
                      <span className={`status-pill ${invoice.payment_status}`}>{invoice.payment_status}</span>
                      <button className="secondary-btn" onClick={() => {
                        setInvoiceForm({
                          id: invoice.id,
                          client_id: invoice.client_id || '',
                          total_amount: String(invoice.total_amount),
                          description: invoice.description || '',
                          due_date: invoice.due_date || '',
                          payment_status: invoice.payment_status,
                          invoice_number: invoice.invoice_number || '',
                        });
                        setActiveSection('invoices');
                      }}>Edit</button>
                      <button className="secondary-btn" onClick={() => void handleSendInvoice(invoice)}>Send</button>
                      <button className="primary-btn" onClick={() => handlePayInvoice(invoice)}>Pay with Lemon Squeezy</button>
                      {invoice.payment_status !== 'paid' ? (
                        <button className="secondary-btn" onClick={() => {
                          setPaymentAmount(String(invoice.total_amount));
                          void handleRecordPayment(invoice);
                        }}>Record payment</button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      ) : null}

      <main>
        <section id="features" className="section">
          <h2>Everything your business needs</h2>
          <div className="feature-grid">
            {featureList.map((feature) => (
              <article className="card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="section pricing">
          <div className="pricing-card">
            <h2>Simple pricing</h2>
            <p className="price">$39<span>/month</span></p>
            <p>Unlock all scheduling, billing, communications, and payment tools for one flat rate.</p>
            <a className="primary-btn" href="#top">Get Started With Kuvlo</a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
