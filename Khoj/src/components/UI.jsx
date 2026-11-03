import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Activity, Bell, CalendarDays, ChevronDown, Clock3, HeartPulse, LogOut, Menu, Plus, Search, ShieldCheck, Stethoscope, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

export function Card({ children, className = '', ...props }) {
  return <section className={`card ${className}`} {...props}>{children}</section>
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function SeverityBadge({ level }) {
  const tone = (level || 'low').toLowerCase()
  return <span className={`severity-badge severity-${tone}`}><span className="severity-dot" />{level || 'Low'}</span>
}

export function Input({ label, error, id, ...props }) {
  const inputId = id || props.name
  return <label className="field" htmlFor={inputId}>
    <span className="field-label">{label}</span>
    <input id={inputId} className={error ? 'input input-error' : 'input'} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} {...props} />
    {error && <span className="field-error" id={`${inputId}-error`}>{error}</span>}
  </label>
}

export function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])
  if (!open) return null
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><X size={18} /></button>
      <h2 id="modal-title">{title}</h2>{children}
    </section>
  </div>
}

export function AppShell({ children, active = 'overview' }) {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const isDoctor = user?.role === 'doctor'
  const links = isDoctor
    ? [{ to: '/doctor', label: 'Overview', key: 'overview', icon: Activity }, { to: '/doctor/availability', label: 'Availability', key: 'availability', icon: CalendarDays }]
    : [{ to: '/dashboard', label: 'Overview', key: 'overview', icon: Activity }, { to: '/doctors', label: 'Find a doctor', key: 'doctors', icon: Search }]
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <Link to="/" className="brand"><span className="brand-mark"><HeartPulse size={19} /></span><span>derma<span className="brand-accent">.</span>ai</span></Link>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {links.map(({ to, label, key, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={active === key ? 'side-link active' : 'side-link'}><Icon size={18} /><span>{label}</span>{key === 'overview' && isDoctor && <span className="nav-count">3</span>}</NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card"><span className="help-icon"><ShieldCheck size={17} /></span><strong>Your health, protected</strong><p>Your information is private and secure.</p><button onClick={() => navigate('/dashboard')}>Learn about privacy <span>→</span></button></div>
        <button className="user-profile" onClick={() => navigate(isDoctor ? '/doctor/availability' : '/dashboard')}>
          <span className={`avatar avatar-${isDoctor ? 'purple' : 'green'}`}>{user?.name?.split(' ').map((part) => part[0]).slice(-2).join('') || 'OR'}</span>
          <span className="user-meta"><strong>{user?.name || 'Olivia Rhye'}</strong><small>{isDoctor ? 'Dermatologist' : 'Patient account'}</small></span><ChevronDown size={16} />
        </button>
        <button className="sidebar-signout" onClick={() => { signOut(); navigate('/') }}><LogOut size={15} /> Sign out</button>
      </div>
    </aside>
    <div className="shell-main">
      <header className="topbar">
        <button className="icon-button mobile-menu" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{active === 'overview' ? 'Overview' : active === 'doctors' ? 'Find a doctor' : active === 'availability' ? 'Availability' : active}</strong></div>
        <div className="topbar-actions"><span className="secure-label"><ShieldCheck size={15} /> Secure health space</span><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button></div>
      </header>
      <main className="page-content">{children}</main>
      <footer className="app-footer">© 2024 Derma-AI <span>·</span> Your care, made clearer <span className="footer-links">Privacy&nbsp;&nbsp;&nbsp; Help</span></footer>
    </div>
    {menuOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
  </div>
}

export function DoctorCard({ doctor, onBook }) {
  return <Card className="doctor-card">
    <div className="doctor-card-top"><div className={`doctor-avatar avatar-${doctor.color}`}>{doctor.initials}</div><div className="doctor-main"><h3>{doctor.name}</h3><span>{doctor.specialization}</span></div><div className="rating"><span>★</span> {doctor.rating} <small>({doctor.reviews})</small></div></div>
    <div className="doctor-meta"><span><Stethoscope size={15} /> {doctor.experience}</span><span><Activity size={15} /> {doctor.distance}</span><span><Clock3 size={15} /> {doctor.availability}</span></div>
    <div className="doctor-card-bottom"><div><strong>{doctor.price}</strong><small> / consultation</small></div><Button onClick={() => onBook(doctor)}>Book appointment <span>→</span></Button></div>
  </Card>
}

export function EmptyState({ icon: Icon = CalendarDays, title, detail, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={23} /></span><h3>{title}</h3><p>{detail}</p>{action}</div>
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

export function NavBrand() {
  return <Link to="/" className="brand"><span className="brand-mark"><HeartPulse size={19} /></span><span>derma<span className="brand-accent">.</span>ai</span></Link>
}

export function LandingNav() {
  const navigate = useNavigate()
  return <header className="landing-nav"><NavBrand /><nav><a href="#how-it-works">How it works</a><a href="#care">Our approach</a></nav><div className="landing-nav-actions"><button className="text-button" onClick={() => navigate('/auth?mode=login')}>Log in</button><Button onClick={() => navigate('/auth?mode=signup')}>Get started <Plus size={16} /></Button></div></header>
}

export function IconLabel({ icon: Icon, children }) {
  return <span className="icon-label"><Icon size={16} />{children}</span>
}
