import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { Activity, ArrowLeft, ArrowRight, CalendarCheck, CalendarDays, Check, CheckCircle2, ChevronRight, CircleHelp, Clock3, Cross, HeartPulse, Image as ImageIcon, LockKeyhole, MapPin, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Stethoscope, UserRound, UsersRound, X } from 'lucide-react'
import { analyzeSymptoms, bookAppointment, getDoctorRequests, getDoctorsNearby, getPatientDashboard, requestDifferentTime, searchDoctors, updateAppointmentRequest, updateDoctorProfile } from './api/mockApi'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { useDebounce } from './hooks/useDebounce'
import { useSessionState } from './hooks/useSessionState'
import { AppShell, Badge, Button, Card, DoctorCard, EmptyState, Input, LandingNav, Modal, SectionHeading, SeverityBadge } from './components/UI'
import { ToastProvider } from './components/ToastProvider'
import { useToast } from './hooks/useToast'
import ImageUploader from './components/ImageUploader'
import './App.css'

function App() {
  return <AuthProvider><ToastProvider><AppRoutes /></ToastProvider></AuthProvider>
}
function ProtectedRoute({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  if (role && role !== user.role) return <Navigate to={user.role === 'doctor' ? '/doctor' : '/dashboard'} replace />
  return children
}

function AppRoutes() {
  const navigate = useNavigate()
  const [consultation, setConsultation] = useSessionState('derma-ai-consultation', null)
  const [doctor, setDoctor] = useSessionState('derma-ai-selected-doctor', null)
  const [appointment, setAppointment] = useSessionState('derma-ai-appointment', null)
  const [params] = useSearchParams()
  const { user } = useAuth()
  const selectDoctor = (item) => { setDoctor(item); navigate('/appointment') }
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/auth" element={<AuthPage initialMode={params.get('mode')} />} />
    <Route path="/dashboard" element={<ProtectedRoute role="patient"><PatientDashboard onConsult={() => navigate('/consultation')} /></ProtectedRoute>} />
    <Route path="/consultation" element={<ProtectedRoute role="patient"><ConsultationPage onResult={setConsultation} /></ProtectedRoute>} />
    <Route path="/results" element={<ProtectedRoute role="patient"><ResultsPage result={consultation} onFind={() => navigate('/doctors')} onSearch={() => navigate('/doctors/search')} /></ProtectedRoute>} />
    <Route path="/doctors" element={<ProtectedRoute role="patient"><DoctorsPage onBook={selectDoctor} /></ProtectedRoute>} />
    <Route path="/doctors/search" element={<ProtectedRoute role="patient"><DoctorSearchPage onBook={selectDoctor} /></ProtectedRoute>} />
    <Route path="/appointment" element={<ProtectedRoute role="patient"><AppointmentPage doctor={doctor} result={consultation} onConfirm={setAppointment} /></ProtectedRoute>} />
    <Route path="/appointment/confirmation" element={<ProtectedRoute role="patient"><ConfirmationPage appointment={appointment} /></ProtectedRoute>} />
    <Route path="/doctor" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
    <Route path="/doctor/availability" element={<ProtectedRoute role="doctor"><DoctorAvailability /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to={user?.role === 'doctor' ? '/doctor' : user ? '/dashboard' : '/'} replace />} />
  </Routes>
}

function LandingPage() {
  const navigate = useNavigate()
  return <div className="landing-page"><LandingNav /><main>
    <section className="landing-hero">
      <div className="hero-copy"><div className="hero-pill"><span /> YOUR SKIN HEALTH, IN FOCUS</div><h1>A clearer path to <em>healthier skin.</em></h1><p>Understand what your skin may be telling you. Get thoughtful guidance and connect with a dermatologist when you need one.</p><div className="hero-actions"><Button onClick={() => navigate('/auth?mode=signup')}>Get started for free <ArrowRight size={17} /></Button><button className="watch-link" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}><span className="play">▶</span> See how it works</button></div><div className="hero-trust"><div className="trust-avatars"><span>MP</span><span>JW</span><span>AK</span><span>+</span></div><div><strong>Care that starts with listening</strong><small>Personalized guidance, wherever you are</small></div></div></div>
      <div className="hero-visual"><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="hero-portrait"><img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=720&q=85" alt="Dermatologist ready to help" /></div><div className="floating-note note-top"><span><Sparkles size={16} /></span><div><strong>A little more clarity</strong><small>Personalized skin insights</small></div></div><div className="floating-note note-bottom"><span className="note-check"><Check size={17} /></span><div><strong>Care you can trust</strong><small>Connect with verified experts</small></div></div><span className="visual-spark spark-a">✳</span><span className="visual-spark spark-b">✳</span></div>
      <div className="hero-bottom-note"><span className="hero-note-icon"><ShieldCheck size={18} /></span><span><strong>Private by design</strong><small>Your health information stays yours.</small></span></div>
    </section>
    <section id="how-it-works" className="how-section"><div className="center-heading"><span className="eyebrow">A SIMPLE FIRST STEP</span><h2>Skin care that starts with you.</h2><p>Whether you have a question or want expert care, we’ll help you take the next step.</p></div><div className="steps-grid"><Step number="01" icon={ImageIcon} title="Share what you notice" text="Tell us what’s going on and optionally add a photo of the area." /><Step number="02" icon={Sparkles} title="Get helpful insights" text="Receive an AI-assisted overview and practical next steps." /><Step number="03" icon={Stethoscope} title="Connect with a doctor" text="Find the right dermatologist and book a time that works." /></div></section>
    <section id="care" className="landing-cta"><div><span className="eyebrow">A BETTER WAY TO BEGIN</span><h2>Feel more confident about your skin.</h2><p>Start a conversation about your skin health, on your terms.</p></div><Button onClick={() => navigate('/auth?mode=signup')}>Create your free account <ArrowRight size={17} /></Button></section>
  </main><footer className="landing-footer"><LandingBrand /><span>© 2024 Derma-AI. Thoughtful care, made accessible.</span><a href="#care">Privacy & safety</a></footer></div>
}

function LandingBrand() { return <a href="/" className="brand"><span className="brand-mark"><HeartPulse size={18} /></span><span>derma<span className="brand-accent">.</span>ai</span></a> }
function Step({ number, icon: Icon, title, text }) { return <article className="step-card"><div className="step-top"><span className="step-icon"><Icon size={20} /></span><span>{number}</span></div><h3>{title}</h3><p>{text}</p></article> }

function AuthPage({ initialMode }) {
  const [, setParams] = useSearchParams()
  const [role, setRole] = useState('patient')
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login')
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const { signIn, register } = useAuth()
  const navigate = useNavigate()
  function update(name, value) { setValues((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: '' })) }
  function switchMode(next) { setMode(next); setParams({ mode: next }); setErrors({}); setFormError('') }
  async function submit(event) {
    event.preventDefault()
    const required = [...(mode === 'signup' ? ['name', 'phone', ...(role === 'patient' ? ['age', 'gender'] : ['specialization', 'license', 'experience', 'address']), 'confirmPassword'] : []), 'email', 'password']
    const next = {}
    required.forEach((key) => { if (!String(values[key] || '').trim()) next[key] = 'This field is required.' })
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = 'Enter a valid email address.'
    if (mode === 'signup' && values.password && values.password.length < 8) next.password = 'Use at least 8 characters.'
    if (mode === 'signup' && values.password !== values.confirmPassword) next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true); setFormError('')
    try {
      const session = mode === 'login' ? await signIn({ email: values.email, password: values.password, role }) : await register({ ...values, role })
      navigate(session.role === 'doctor' ? '/doctor' : '/dashboard')
    } catch (error) { setFormError(error.message || 'We could not complete your request. Please try again.') } finally { setLoading(false) }
  }
  const field = (name, label, type = 'text', placeholder = '') => <Input name={name} label={label} type={type} value={values[name] || ''} onChange={(event) => update(name, event.target.value)} error={errors[name]} placeholder={placeholder} />
  return <div className="auth-page"><aside className="auth-aside"><LandingBrand /><div className="auth-aside-content"><div className="auth-mark"><HeartPulse size={27} /></div><span className="eyebrow">CARE THAT STARTS WITH YOU</span><h1>Better skin health begins with a conversation.</h1><p>Get trusted, thoughtful guidance and connect with care that feels right for you.</p><div className="auth-quote"><div className="quote-stars">★★★★★</div><p>“Finally, a place where I could make sense of what was happening with my skin.”</p><div className="quote-author"><span className="avatar avatar-green">OR</span><span><strong>Olivia R.</strong><small>Derma-AI member</small></span></div></div></div><div className="auth-aside-footer"><ShieldCheck size={15} /> Your health information is always private.</div></aside>
    <main className="auth-main"><button className="auth-back" onClick={() => navigate('/')}><ArrowLeft size={16} /> Back to home</button><div className="auth-form-wrap"><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'A HEALTHIER START'}</span><h2>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Your skin health journey is right where you left it.' : 'A little more clarity is just a few details away.'}</p>
      <div className="role-tabs" role="tablist" aria-label="Choose account type"><button role="tab" aria-selected={role === 'patient'} className={role === 'patient' ? 'selected' : ''} onClick={() => { setRole('patient'); setErrors({}) }}><UserRound size={16} /> Patient</button><button role="tab" aria-selected={role === 'doctor'} className={role === 'doctor' ? 'selected' : ''} onClick={() => { setRole('doctor'); setErrors({}) }}><Stethoscope size={16} /> Doctor</button></div>
      <form className="auth-form" onSubmit={submit} noValidate>
        {mode === 'signup' && <>{field('name', 'Full name', 'text', 'Your full name')}<div className="form-grid">{field('phone', 'Phone number', 'tel', '+1 (555) 000-0000')}{role === 'patient' ? field('age', 'Age', 'number', 'Your age') : field('specialization', 'Specialization', 'text', 'e.g. Dermatologist')}</div>{role === 'patient' ? <label className="field"><span className="field-label">Gender</span><select className="input" value={values.gender || ''} onChange={(event) => update('gender', event.target.value)}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select>{errors.gender && <span className="field-error">{errors.gender}</span>}</label> : <><div className="form-grid">{field('license', 'Medical license number')}{field('experience', 'Years of experience', 'number')}</div>{field('address', 'Clinic address', 'text', 'Street, city, state')}</>}</>}
        {mode === 'signup' && field('email', 'Email address', 'email', 'you@example.com')}
        {mode === 'login' && <label className="field"><span className="field-label">Email address</span><input className={`input ${errors.email ? 'input-error' : ''}`} type="email" placeholder="you@example.com" value={values.email || ''} onChange={(event) => update('email', event.target.value)} aria-invalid={Boolean(errors.email)} />{errors.email && <span className="field-error">{errors.email}</span>}</label>}
        <label className="field"><span className="field-label">Password</span><span className="password-wrap"><LockKeyhole size={16} className="password-icon" /><input className={`input has-leading-icon ${errors.password ? 'input-error' : ''}`} type={showPassword ? 'text' : 'password'} placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'} value={values.password || ''} onChange={(event) => update('password', event.target.value)} aria-invalid={Boolean(errors.password)} /><button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>{errors.password && <span className="field-error">{errors.password}</span>}</span></label>
        {mode === 'signup' && <label className="field"><span className="field-label">Confirm password</span><input className={`input ${errors.confirmPassword ? 'input-error' : ''}`} type={showPassword ? 'text' : 'password'} placeholder="Enter your password again" value={values.confirmPassword || ''} onChange={(event) => update('confirmPassword', event.target.value)} />{errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}</label>}
        {mode === 'login' && <div className="form-options"><label className="check-label"><input type="checkbox" /> Remember me</label><button type="button" className="link-button" onClick={() => setFormError('Please contact support to reset your password.')}>Forgot password?</button></div>}
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <Button type="submit" className="auth-submit" disabled={loading}>{loading ? <><span className="spinner" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</> : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></>}</Button><p className="auth-switch">{mode === 'login' ? 'New to Derma-AI?' : 'Already have an account?'} <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
      </form><p className="auth-terms">By continuing, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</p></div></main></div>
}

function PatientDashboard({ onConsult }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const { user } = useAuth()
  useEffect(() => { getPatientDashboard().then(setData).catch(() => setError('We couldn’t load your health overview. Please refresh to try again.')) }, [])
  return <AppShell><div className="welcome-row"><div><span className="eyebrow">TUESDAY, OCTOBER 29, 2024</span><h1>Good morning, {user?.name?.split(' ')[0] || 'Olivia'} <span className="wave">✦</span></h1><p>Let’s take a moment for your skin health.</p></div><Button onClick={onConsult}><span className="button-plus">+</span> New consultation</Button></div>
    <div className="dashboard-hero"><div className="dashboard-hero-copy"><span className="hero-pill hero-pill-light"><Sparkles size={14} /> YOUR SKIN, UNDERSTOOD</span><h2>Not sure about a skin concern?</h2><p>Share what you’re noticing. We’ll help you understand your next steps.</p><Button variant="white" onClick={onConsult}>Start a consultation <ArrowRight size={16} /></Button></div><div className="dash-art"><div className="dash-art-circle"><HeartPulse size={54} strokeWidth={1.2} /></div><span className="art-dot dot-one" /><span className="art-dot dot-two" /><span className="art-ring" /></div><div className="hero-footnote"><ShieldCheck size={14} /> Private and secure, always</div></div>
    <div className="stat-grid"><Stat icon={Activity} color="blue" label="Consultations" value={data ? '03' : '—'} foot="Across your health journey" /><Stat icon={CalendarCheck} color="green" label="Upcoming visits" value={data ? '01' : '—'} foot="Your care, right on schedule" /><Stat icon={HeartPulse} color="purple" label="Health profile" value="Up to date" foot="Last updated today" /></div>
    <div className="content-grid dashboard-content"><Card className="consultations-card"><div className="card-heading"><div><span className="eyebrow">YOUR HEALTH JOURNEY</span><h2>Recent consultations</h2></div><button className="link-button" onClick={onConsult}>View all <ArrowRight size={14} /></button></div>{error ? <div className="error-state" role="alert">{error}</div> : !data ? <LoadingRows /> : <div className="consultation-list">{data.consultations.map((item) => <article key={item.id} className="consultation-item"><span className="consultation-icon"><Activity size={18} /></span><div className="consultation-detail"><strong>{item.title}</strong><p>{item.detail}</p><small>{item.date} <span>·</span> {item.status}</small></div><SeverityBadge level={item.severity} /><button className="row-arrow" aria-label={`View ${item.title}`}><ChevronRight size={17} /></button></article>)}</div>}</Card>
    <Card className="appointment-card"><div className="card-heading"><div><span className="eyebrow">COMING UP</span><h2>Your next visit</h2></div><CalendarDays size={18} className="muted-icon" /></div>{!data ? <LoadingRows /> : <><div className="appointment-date"><span>THU</span><strong>31</strong><small>OCT</small></div><div className="appointment-info"><strong>{data.appointments[0].doctor}</strong><span>Dermatology follow-up</span><p><Clock3 size={14} /> 10:30 AM – 11:00 AM</p><p><MapPin size={14} /> Soho Skin & Laser, New York</p></div><button className="appointment-link">View appointment <ArrowRight size={14} /></button></>}</Card></div>
  </AppShell>
}

function Stat({ icon: Icon, color, label, value, foot }) { return <Card className="stat-card"><span className={`stat-icon stat-${color}`}><Icon size={18} /></span><div className="stat-body"><span>{label}</span><strong>{value}</strong><small>{foot}</small></div></Card> }
function LoadingRows() { return <div className="skeleton-list" aria-label="Loading"><span /><span /><span /></div> }

function ConsultationPage({ onResult }) {
  const [files, setFiles] = useState([])
  const [symptoms, setSymptoms] = useState('')
  const [duration, setDuration] = useState('')
  const [severity, setSeverity] = useState(4)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const notify = useToast()
  async function submit(event) {
    event.preventDefault()
    if (symptoms.trim().length < 10) { setError('Please describe your symptoms in at least 10 characters.'); return }
    setLoading(true); setError('')
    try { const result = await analyzeSymptoms({ symptoms, severity, duration, images: files.map((item) => item.file) }); onResult(result); navigate('/results') } catch { setError('We couldn’t analyze your information just now. Please try again.'); notify('Your consultation could not be submitted. Please try again.', 'error') } finally { setLoading(false) }
  }
  return <AppShell><div className="flow-page"><button className="back-link" onClick={() => navigate('/dashboard')}><ArrowLeft size={15} /> Back to overview</button><div className="flow-header"><div><span className="eyebrow">NEW CONSULTATION</span><h1>Tell us what you’re noticing.</h1><p>A few details can help us offer more useful guidance.</p></div><div className="step-indicator"><span className="step-active">1</span><i /><span>2</span><i /><span>3</span></div></div>
    <form className="consult-form" onSubmit={submit}><Card className="form-card"><div className="form-card-heading"><span className="form-number">01</span><div><h2>Add a photo <span className="optional">(optional)</span></h2><p>A clear, well-lit photo can help provide more context.</p></div></div><ImageUploader files={files} onChange={setFiles} /></Card>
      <Card className="form-card"><div className="form-card-heading"><span className="form-number">02</span><div><h2>Describe your symptoms</h2><p>What are you experiencing? Include where and how it feels.</p></div></div><label className="field"><span className="field-label">Your description</span><textarea className={`input textarea ${error ? 'input-error' : ''}`} rows="5" maxLength="800" value={symptoms} onChange={(event) => { setSymptoms(event.target.value); setError('') }} placeholder="For example: I noticed a small red, itchy patch on my left forearm about 4 days ago…" /><div className="textarea-meta">{error && <span className="field-error">{error}</span>}<small>{symptoms.length}/800</small></div></label><div className="form-grid symptom-fields"><label className="field"><span className="field-label">How long have you had this?</span><select className="input" value={duration} onChange={(event) => setDuration(event.target.value)}><option value="">Select duration</option><option>Less than a day</option><option>1–3 days</option><option>4–7 days</option><option>1–4 weeks</option><option>More than a month</option></select></label><div className="field"><div className="severity-label-row"><span className="field-label">How severe is it?</span><strong>{severity} <small>/ 10</small></strong></div><input className="range-input" type="range" min="1" max="10" value={severity} onChange={(event) => setSeverity(Number(event.target.value))} aria-label={`Severity ${severity} out of 10`} /><div className="range-labels"><span>Mild</span><span>Severe</span></div></div></div></Card>
      <div className="medical-disclaimer"><span><CircleHelp size={17} /></span><p><strong>A note about your care</strong><br />This is not a medical diagnosis. In an emergency, call your local emergency number.</p></div><div className="form-actions"><span><LockKeyhole size={14} /> Your information is private and secure.</span><Button type="submit" disabled={loading}>{loading ? <><span className="spinner" /> Reviewing your details…</> : <>Submit to AI <Sparkles size={16} /></>}</Button></div>
    </form></div></AppShell>
}

function ResultsPage({ result, onFind, onSearch }) {
  const navigate = useNavigate()
  if (!result) return <Navigate to="/consultation" replace />
  const high = result.severity === 'High' || result.severity === 'Critical'
  return <AppShell><div className="flow-page results-page"><button className="back-link" onClick={() => navigate('/dashboard')}><ArrowLeft size={15} /> Back to overview</button><div className="results-intro"><span className="results-icon"><Sparkles size={21} /></span><span className="eyebrow">YOUR SKIN INSIGHTS</span><h1>A thoughtful first look.</h1><p>Here’s an AI-assisted overview based on what you shared. It’s a starting point for a conversation—not a diagnosis.</p></div>
    {high && <div className="urgent-banner"><span><Cross size={17} /></span><div><strong>Prompt medical attention may be appropriate</strong><p>Please contact a healthcare professional soon. If you feel this is an emergency, call your local emergency number.</p></div></div>}
    <Card className="insights-card"><div className="insights-heading"><div><div className="insights-title"><span className="insights-spark"><Sparkles size={17} /></span><h2>Your AI-assisted overview</h2></div><p>Generated just now · Based on the details you shared</p></div><SeverityBadge level={result.severity} /></div><div className="insight-block"><h3>What we noticed</h3><p>{result.summary}</p></div><div className="insight-columns"><div className="insight-block"><h3>Possible explanations</h3><ul>{result.causes.map((cause) => <li key={cause}><span className="list-check"><Check size={12} /></span>{cause}</li>)}</ul></div><div className="insight-block"><h3>Helpful next steps</h3><ul>{result.nextSteps.map((step) => <li key={step}><span className="list-check"><Check size={12} /></span>{step}</li>)}</ul></div></div><div className="disclaimer-inline"><ShieldCheck size={15} /> This AI-generated content is for informational purposes only and is not a substitute for professional medical advice.</div></Card>
    <div className="doctor-choice-heading"><span className="eyebrow">YOUR NEXT STEP</span><h2>Would you like to talk to a dermatologist?</h2><p>Find the right care for you, whenever you’re ready.</p></div><div className="choice-grid"><button className="choice-card" onClick={onFind}><span className="choice-icon choice-green"><MapPin size={21} /></span><span className="choice-card-copy"><strong>Get nearby doctor assistance</strong><small>Find trusted dermatologists near you.</small></span><ArrowRight size={18} /></button><button className="choice-card" onClick={onSearch}><span className="choice-icon choice-blue"><Search size={20} /></span><span className="choice-card-copy"><strong>Search for a doctor by name</strong><small>Already have someone in mind?</small></span><ArrowRight size={18} /></button></div></div></AppShell>
}

function DoctorsPage({ onBook }) {
  const [doctors, setDoctors] = useState([])
  const [location, setLocation] = useState('')
  const [manualLocation, setManualLocation] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locationMessage, setLocationMessage] = useState('')
  useEffect(() => { getDoctorsNearby('').then(setDoctors).catch(() => setError('Nearby doctors are unavailable right now. Please try again.')).finally(() => setLoading(false)) }, [])
  async function findByCity(event) {
    event.preventDefault()
    if (!manualLocation.trim()) { setLocationMessage('Enter a city or ZIP code to continue.'); return }
    setLoading(true); setLocation(manualLocation.trim()); setLocationMessage('')
    try { setDoctors(await getDoctorsNearby(manualLocation.trim())) } catch { setError('We couldn’t find doctors for that area. Please try again.') } finally { setLoading(false) }
  }
  function useLocation() {
    if (!navigator.geolocation) { setLocationMessage('Location isn’t available in this browser. Enter a city or ZIP code instead.'); return }
    setLocationMessage('Requesting your location…')
    navigator.geolocation.getCurrentPosition(async (position) => {
      const label = `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`
      setLocation(label); setManualLocation('')
      try { setDoctors(await getDoctorsNearby(label)); setLocationMessage(`Showing doctors near ${label}`) } catch { setLocationMessage('We couldn’t load nearby doctors. Please try again.') }
    }, () => setLocationMessage('Location permission wasn’t granted. Enter a city or ZIP code instead.'), { timeout: 8000 })
  }
  return <AppShell active="doctors"><div className="flow-page doctor-finder"><button className="back-link" onClick={() => window.history.back()}><ArrowLeft size={15} /> Back</button><SectionHeading eyebrow="PERSONALIZED CARE" title="Find care close to you." description="Connect with trusted dermatologists who can help you move forward." />
    <Card className="location-card"><div className="location-icon"><MapPin size={19} /></div><div className="location-content"><strong>Find doctors in your area</strong><p>Use your location or enter a city or ZIP code.</p><form className="location-search" onSubmit={findByCity}><input className="input" value={manualLocation} onChange={(event) => setManualLocation(event.target.value)} placeholder="City or ZIP code" aria-label="City or ZIP code" /><Button variant="outline" type="button" onClick={useLocation}><MapPin size={15} /> Use my location</Button><Button type="submit">Search</Button></form>{locationMessage && <small className="location-message">{locationMessage}</small>}</div></Card>
    <div className="nearby-layout"><div className="nearby-list"><div className="list-heading"><div><h2>Recommended dermatologists</h2><span>{location ? `Near ${location}` : 'Based on your area'}</span></div><button className="link-button" onClick={() => window.location.assign('/doctors/search')}>Search by name <ArrowRight size={14} /></button></div>{error ? <p className="error-state">{error}</p> : loading ? <><div className="skeleton-doctor" /><div className="skeleton-doctor" /></> : doctors.map((item) => <DoctorCard doctor={item} onBook={onBook} key={item.id} />)}</div>
    <div className="map-placeholder"><div className="map-toolbar"><span><MapPin size={15} /> {location || 'New York, NY'}</span><button aria-label="Zoom in">+</button></div><div className="map-art"><div className="map-road road-a" /><div className="map-road road-b" /><div className="map-water" /><span className="map-pin pin-a"><MapPin size={16} /></span><span className="map-pin pin-b"><MapPin size={16} /></span><span className="map-pin pin-c"><MapPin size={16} /></span><span className="map-location-dot" /></div><div className="map-caption"><span className="map-legend" /><span>Dermatologists near you</span></div><small className="map-disclaimer">Map preview · Location is approximate</small></div></div>
  </div></AppShell>
}

function DoctorSearchPage({ onBook }) {
  const [query, setQuery] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [rating, setRating] = useState('0')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debouncedQuery = useDebounce(query, 350)
  useEffect(() => {
    let active = true
    searchDoctors({ query: debouncedQuery, specialization, minRating: rating })
      .then((items) => { if (active) setDoctors(items) })
      .catch(() => { if (active) setError('Search is unavailable right now. Please try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [debouncedQuery, specialization, rating])
  return <AppShell active="doctors"><div className="flow-page"><button className="back-link" onClick={() => window.history.back()}><ArrowLeft size={15} /> Back</button><SectionHeading eyebrow="FIND YOUR DERMATOLOGIST" title="The right care, your way." description="Search trusted specialists and find a time that works for you." />
    <div className="search-panel"><label className="search-input-wrap"><Search size={18} /><input value={query} onChange={(event) => { setLoading(true); setError(''); setQuery(event.target.value) }} placeholder="Search by doctor name or specialty" aria-label="Search doctors by name or specialty" />{query && <button aria-label="Clear search" onClick={() => { setLoading(true); setQuery('') }}><X size={16} /></button>}</label><span className="filter-label"><SlidersHorizontal size={15} /> Filters</span><select className="input" aria-label="Filter by specialization" value={specialization} onChange={(event) => { setLoading(true); setError(''); setSpecialization(event.target.value) }}><option value="">All specialties</option><option>Dermatologist</option><option>Cosmetic Dermatologist</option><option>Pediatric Dermatologist</option></select><select className="input" aria-label="Filter by minimum rating" value={rating} onChange={(event) => { setLoading(true); setError(''); setRating(event.target.value) }}><option value="0">Any rating</option><option value="4.8">4.8+ stars</option><option value="4.9">4.9+ stars</option></select></div>
    <div className="search-results-heading"><h2>Dermatologists <span>{loading ? '…' : doctors.length}</span></h2><span>Verified specialists <ShieldCheck size={14} /></span></div>{error ? <p className="error-state">{error}</p> : loading ? <div className="search-result-grid"><div className="skeleton-doctor" /><div className="skeleton-doctor" /></div> : doctors.length ? <div className="search-result-grid">{doctors.map((item) => <DoctorCard doctor={item} onBook={onBook} key={item.id} />)}</div> : <EmptyState icon={Search} title="No doctors found" detail="Try changing your search or filters to find more specialists." action={<Button variant="outline" onClick={() => { setQuery(''); setSpecialization(''); setRating('0') }}>Clear filters</Button>} />}
  </div></AppShell>
}

function appointmentTime(severity) {
  if (severity === 'Critical') return '3:30 PM'
  if (severity === 'High') return '10:00 AM'
  if (severity === 'Low') return '2:00 PM'
  return '10:30 AM'
}

function AppointmentPage({ doctor, result, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeRequestOpen, setTimeRequestOpen] = useState(false)
  const [requestedDate, setRequestedDate] = useState('')
  const [requestedTime, setRequestedTime] = useState('')
  const [requestingTime, setRequestingTime] = useState(false)
  const notify = useToast()
  const navigate = useNavigate()
  const severity = result?.severity || 'Medium'
  async function confirm() {
    if (!doctor) return
    setLoading(true); setError('')
    try { const booking = await bookAppointment({ doctor, severity }); onConfirm(booking); navigate('/appointment/confirmation') } catch { setError('We couldn’t reserve this time. Please try again.'); notify('Booking failed. Please try again.', 'error') } finally { setLoading(false) }
  }
  async function submitTimeRequest(event) {
    event.preventDefault()
    setRequestingTime(true)
    try {
      await requestDifferentTime({ doctorId: doctor.id, date: requestedDate, time: requestedTime })
      setTimeRequestOpen(false)
      notify('Your preferred time was sent to the doctor. This is a request, not a confirmed appointment.')
    } catch {
      setError('We couldn’t send your time preference. Please try again.')
    } finally { setRequestingTime(false) }
  }
  if (!doctor) return <Navigate to="/doctors" replace />
  const urgent = severity === 'Critical'
  const today = new Date()
  const minimumDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return <AppShell><div className="flow-page appointment-flow"><button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back to doctors</button><SectionHeading eyebrow="APPOINTMENT REQUEST" title="Let’s get you the right care." description="Review your appointment details before you confirm." />
    {urgent && <div className="urgent-banner"><span><Cross size={17} /></span><div><strong>Your symptoms may need urgent attention</strong><p>We’ve prioritized the earliest available appointment. If you’re experiencing a medical emergency, call your local emergency number now.</p></div></div>}
    <div className="appointment-layout"><Card className="booking-card"><span className="eyebrow">YOUR DERMATOLOGIST</span><div className="booking-doctor"><div className={`doctor-avatar avatar-${doctor.color}`}>{doctor.initials}</div><div><h2>{doctor.name}</h2><p>{doctor.specialization}</p><div className="booking-rating"><Star size={14} fill="currentColor" /> {doctor.rating} <span>({doctor.reviews} reviews)</span></div></div></div><div className="booking-divider" /><div className="booking-row"><span><CalendarDays size={17} /> Appointment date</span><strong>{severity === 'Critical' ? 'Today' : severity === 'High' ? 'Tomorrow' : severity === 'Medium' ? 'In 2–3 days' : 'Within a week'}</strong></div><div className="booking-row"><span><Clock3 size={17} /> Available time</span><strong>{appointmentTime(severity)}</strong></div><div className="booking-row"><span><MapPin size={17} /> Location</span><strong>{doctor.location}</strong></div><div className="booking-fee"><span>Consultation fee</span><strong>{doctor.price}</strong></div><button className="link-button request-time" onClick={() => setTimeRequestOpen(true)}>Request a different time</button>{error && <p className="form-error">{error}</p>}<Button className="confirm-booking" onClick={confirm} disabled={loading}>{loading ? <><span className="spinner" /> Reserving your time…</> : <>Confirm appointment <ArrowRight size={16} /></>}</Button><p className="booking-secure"><ShieldCheck size={14} /> No payment required to request an appointment.</p></Card>
    <Card className="appointment-note"><span className="note-icon"><CalendarCheck size={18} /></span><h3>Care at the right time</h3><p>Appointment timing is suggested using your AI-assisted severity level. Your doctor will make an independent assessment.</p><div className="timing-guide">{[['Critical', 'Earliest available today'], ['High', 'Within 24 hours'], ['Medium', 'Within 2–3 days'], ['Low', 'Within a week']].map(([level, text]) => <div key={level}><SeverityBadge level={level} /><span>{text}</span></div>)}</div></Card></div>
    <Modal open={timeRequestOpen} onClose={() => setTimeRequestOpen(false)} title="Request a different time"><form className="time-request-form" onSubmit={submitTimeRequest}><p>This sends a preferred time to the doctor’s office. It does not confirm or replace your appointment.</p><label className="field"><span className="field-label">Preferred date</span><input className="input" type="date" min={minimumDate} value={requestedDate} onChange={(event) => setRequestedDate(event.target.value)} required /></label><label className="field"><span className="field-label">Preferred time</span><input className="input" type="time" value={requestedTime} onChange={(event) => setRequestedTime(event.target.value)} required /></label><div className="modal-actions"><Button type="button" variant="outline" onClick={() => setTimeRequestOpen(false)}>Cancel</Button><Button type="submit" disabled={requestingTime}>{requestingTime ? 'Sending…' : 'Send request'} <ArrowRight size={15} /></Button></div></form></Modal>
  </div></AppShell>
}

function ConfirmationPage({ appointment }) {
  const navigate = useNavigate()
  if (!appointment) return <Navigate to="/dashboard" replace />
  function addToCalendar() {
    const [year, month, day] = appointment.dateISO.split('-').map(Number)
    const time = appointment.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    const hour = Number(time[1]) % 12 + (time[3].toUpperCase() === 'PM' ? 12 : 0)
    const start = new Date(year, month - 1, day, hour, Number(time[2]))
    const end = new Date(start.getTime() + 30 * 60 * 1000)
    const format = (date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '')
    const content = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${format(start)}\nDTEND:${format(end)}\nSUMMARY:Derma-AI appointment with ${appointment.doctor.name}\nLOCATION:${appointment.doctor.location}\nEND:VEVENT\nEND:VCALENDAR`
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type: 'text/calendar' })); link.download = 'derma-ai-appointment.ics'; link.click(); URL.revokeObjectURL(link.href)
  }
  return <AppShell><div className="confirmation-wrap"><div className="confirmation-check"><CheckCircle2 size={37} /></div><span className="eyebrow">YOU’RE ALL SET</span><h1>Your appointment is confirmed.</h1><p className="confirmation-subtitle">A little more clarity is on the way. We’ve saved your appointment details below.</p><Card className="confirmed-card"><div className="confirmed-top"><div><span className="eyebrow">CONFIRMATION NUMBER</span><strong>DA-{appointment.id.slice(-6).toUpperCase()}</strong></div><Badge tone="green"><Check size={13} /> Confirmed</Badge></div><div className="booking-doctor"><div className={`doctor-avatar avatar-${appointment.doctor.color}`}>{appointment.doctor.initials}</div><div><h2>{appointment.doctor.name}</h2><p>{appointment.doctor.specialization}</p><div className="booking-rating"><Star size={14} fill="currentColor" /> {appointment.doctor.rating} <span>({appointment.doctor.reviews} reviews)</span></div></div></div><div className="confirmed-details"><div><CalendarDays size={17} /><span><small>DATE</small><strong>{appointment.date}</strong></span></div><div><Clock3 size={17} /><span><small>TIME</small><strong>{appointment.time}</strong></span></div><div><MapPin size={17} /><span><small>LOCATION</small><strong>{appointment.doctor.location}</strong></span></div></div><div className="confirmation-actions"><Button variant="outline" onClick={addToCalendar}><CalendarDays size={16} /> Add to calendar</Button><Button onClick={() => navigate('/dashboard')}>Back to overview <ArrowRight size={16} /></Button></div></Card><p className="confirmation-help"><CircleHelp size={15} /> Need to make a change? Contact your doctor’s office directly.</p></div></AppShell>
}

function DoctorDashboard() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('All')
  const [sort, setSort] = useState('priority')
  const [selected, setSelected] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [savingReschedule, setSavingReschedule] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [note, setNote] = useState('')
  const notify = useToast()
  useEffect(() => { getDoctorRequests().then(setRequests).catch(() => notify('Could not load appointment requests.', 'error')).finally(() => setLoading(false)) }, [notify])
  async function handleAction(request, action) {
    if (action === 'reschedule') {
      setRescheduleOpen(true)
      return
    }
    try { await updateAppointmentRequest(request.id, action, note); setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: action === 'accept' ? 'Accepted' : action === 'decline' ? 'Declined' : 'Rescheduled', note } : item)); setSelected(null); setDetailsOpen(false); setNote(''); notify(`Request ${action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'rescheduled'}.`) } catch { notify('Your update could not be saved. Please try again.', 'error') }
  }
  async function submitReschedule(event) {
    event.preventDefault()
    if (!selected) return
    setSavingReschedule(true)
    try {
      const proposedSlot = { date: rescheduleDate, time: rescheduleTime }
      await updateAppointmentRequest(selected.id, 'reschedule', note, proposedSlot)
      setRequests((current) => current.map((item) => item.id === selected.id ? { ...item, status: 'Reschedule proposed', note, proposedSlot } : item))
      setSelected(null); setDetailsOpen(false); setRescheduleOpen(false); setNote('')
      notify('Your proposed appointment time was sent to the patient.')
    } catch { notify('Your reschedule could not be saved. Please try again.', 'error') } finally { setSavingReschedule(false) }
  }
  const filtered = useMemo(() => requests
    .filter((request) => severityFilter === 'All' || request.severity === severityFilter)
    .sort((a, b) => {
      const severityOrder = ['Critical', 'High', 'Medium', 'Low'].indexOf(a.severity) - ['Critical', 'High', 'Medium', 'Low'].indexOf(b.severity)
      if (severityOrder !== 0 || sort === 'priority') return severityOrder
      return requestTime(b.date) - requestTime(a.date)
    }), [requests, severityFilter, sort])
  return <AppShell><div className="doctor-dashboard"><div className="welcome-row doctor-welcome"><div><span className="eyebrow">TUESDAY, OCTOBER 29, 2024</span><h1>Good morning, Dr. Patel <span className="wave">✦</span></h1><p>Here’s what’s happening with your practice today.</p></div><Button variant="outline"><CalendarDays size={16} /> View calendar</Button></div>
    <div className="doctor-stat-grid"><Stat icon={UsersRound} color="blue" label="New requests" value={loading ? '—' : String(requests.filter((r) => r.status === 'New').length).padStart(2, '0')} foot="Need your attention" /><Stat icon={CalendarCheck} color="green" label="Today’s appointments" value="04" foot="Your schedule is looking good" /><Stat icon={Activity} color="purple" label="Patient satisfaction" value="4.9/5" foot="Based on 128 reviews" /></div>
    <div className="request-section-head"><div><span className="eyebrow">YOUR INBOX</span><h2>Appointment requests <span className="request-count">{requests.filter((r) => r.status === 'New').length}</span></h2><p>Review patient concerns and help them take their next step.</p></div><div className="request-filters"><select className="input" aria-label="Filter requests by severity" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}><option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select><select className="input" aria-label="Sort requests" value={sort} onChange={(event) => setSort(event.target.value)}><option value="priority">Priority first</option><option value="date">Date</option></select></div></div>
    {loading ? <LoadingRows /> : filtered.length ? <div className="requests-list">{filtered.map((request) => <RequestCard key={request.id} request={request} onDetails={(item) => { setSelected(item); setDetailsOpen(true) }} onPhotos={(item) => { setSelected(item); setDetailsOpen(false); setPhotoOpen(true); setPhotoIndex(0) }} />)}</div> : <EmptyState title="No requests match this filter" detail="Try selecting a different severity level." />}
    <div className="calendar-summary"><div className="card-heading"><div><span className="eyebrow">YOUR SCHEDULE</span><h2>Upcoming appointments</h2></div><button className="link-button">Full calendar <ArrowRight size={14} /></button></div><ScheduleRow time="10:30 AM" initials="OR" name="Olivia Rhye" detail="Follow-up · Skin rash assessment" severity="Medium" /><ScheduleRow time="1:00 PM" initials="PB" name="Phoenix Baker" detail="Initial consultation · Dry skin" severity="Low" /></div>
  </div>
  <Modal open={detailsOpen} onClose={() => { setDetailsOpen(false); setSelected(null); setRescheduleOpen(false) }} title="Appointment request">{selected && <div className="request-detail-modal"><div className="request-patient"><span className="avatar avatar-green">{selected.patient.split(' ').map((part) => part[0]).join('')}</span><div><strong>{selected.patient}</strong><span>Age {selected.age} · {selected.date}</span></div><SeverityBadge level={selected.severity} /></div><h3>Symptoms</h3><p>{selected.symptoms}</p><h3>AI-assisted summary</h3><p>{selected.summary}</p><label className="field"><span className="field-label">Add a note (optional)</span><textarea className="input textarea" rows="3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note for the patient…" /></label>{rescheduleOpen ? <form className="reschedule-form" onSubmit={submitReschedule}><p>Choose a proposed appointment time to share with the patient.</p><div className="form-grid"><label className="field"><span className="field-label">Proposed date</span><input className="input" type="date" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} required /></label><label className="field"><span className="field-label">Proposed time</span><input className="input" type="time" value={rescheduleTime} onChange={(event) => setRescheduleTime(event.target.value)} required /></label></div><div className="modal-actions"><Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>Back</Button><Button type="submit" disabled={savingReschedule}>{savingReschedule ? 'Sending…' : 'Send proposed time'} <ArrowRight size={15} /></Button></div></form> : <div className="modal-actions"><Button variant="outline" onClick={() => handleAction(selected, 'decline')}>Decline</Button><Button variant="outline" onClick={() => handleAction(selected, 'reschedule')}>Reschedule</Button><Button onClick={() => handleAction(selected, 'accept')}>Accept request <Check size={15} /></Button></div>}</div>}</Modal>
  <Modal open={photoOpen} onClose={() => { setPhotoOpen(false); setSelected(null) }} title={`Patient photos · ${photoIndex + 1} of ${selected?.photos || 1}`}>{selected && <div className="photo-lightbox"><div className="mock-skin-photo"><span className="mock-skin-mark" /><span className="mock-skin-mark mark-small" /></div><p>Photo preview placeholder · Patient-uploaded image</p><div className="modal-actions"><Button variant="outline" onClick={() => setPhotoIndex((photoIndex + selected.photos - 1) % selected.photos)}>Previous</Button><Button onClick={() => setPhotoIndex((photoIndex + 1) % selected.photos)}>Next photo <ArrowRight size={15} /></Button></div></div>}</Modal></AppShell>
}

function RequestCard({ request, onDetails, onPhotos }) {
  return <Card className={`request-card ${request.severity === 'Critical' ? 'request-critical' : ''}`}><div className="request-card-top"><div className="request-patient"><span className={`avatar avatar-${request.severity === 'Critical' ? 'peach' : 'green'}`}>{request.patient.split(' ').map((part) => part[0]).join('')}</span><div><strong>{request.patient} <small>· {request.age}</small></strong><span>Request received {request.date}</span></div></div><div className="request-badges"><SeverityBadge level={request.severity} /><Badge tone={request.status === 'New' ? 'blue' : 'green'}>{request.status}</Badge></div></div><p className="request-symptoms">“{request.symptoms}”</p><div className="request-ai"><span className="ai-small"><Sparkles size={13} /></span><div><strong>AI-assisted summary</strong><p>{request.summary}</p></div></div><div className="request-card-bottom"><button className="request-photos" onClick={() => onPhotos(request)}><ImageIcon size={15} /> {request.photos} photos</button><button className="link-button" onClick={() => onDetails(request)}>View details <ArrowRight size={14} /></button></div></Card>
}
function requestTime(label) {
  const date = new Date()
  if (label.startsWith('Yesterday')) date.setDate(date.getDate() - 1)
  const time = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (time) date.setHours(Number(time[1]) % 12 + (time[3].toUpperCase() === 'PM' ? 12 : 0), Number(time[2]), 0, 0)
  return date.getTime()
}
function ScheduleRow({ time, initials, name, detail, severity }) { return <div className="schedule-row"><span className="schedule-time">{time}</span><span className="schedule-line" /><span className="schedule-avatar">{initials}</span><div className="schedule-person"><strong>{name}</strong><small>{detail}</small></div><SeverityBadge level={severity} /><button className="row-arrow" aria-label="View appointment"><ChevronRight size={17} /></button></div> }

function DoctorAvailability() {
  const [available, setAvailable] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({ name: 'Dr. Maya Patel', specialization: 'Dermatologist', license: 'NY-28491', experience: '12 years', address: 'Soho Skin & Laser, 128 Spring Street, New York, NY' })
  const [schedule, setSchedule] = useState({ weekdays: '9:00 AM – 5:00 PM', saturday: '10:00 AM – 2:00 PM', sunday: 'Unavailable' })
  const [duration, setDuration] = useState('30 minutes')
  const notify = useToast()
  function updateProfile(key, value) { setProfile((current) => ({ ...current, [key]: value })) }
  function updateSchedule(key, value) { setSchedule((current) => ({ ...current, [key]: value })) }
  async function saveProfile() {
    setSaving(true)
    try { await updateDoctorProfile({ profile, acceptingPatients: available, schedule, duration }); notify('Your profile settings have been saved.') } catch { notify('We couldn’t save your settings. Please try again.', 'error') } finally { setSaving(false) }
  }
  return <AppShell active="availability"><div className="flow-page"><SectionHeading eyebrow="PRACTICE SETTINGS" title="Your profile & availability." description="Keep your patient-facing information current and manage your appointment preferences." /><div className="settings-layout">
    <Card className="settings-card"><div className="settings-title"><span className="settings-icon"><UserRound size={19} /></span><div><h2>Professional profile</h2><p>Information patients see when they find you.</p></div></div><div className="profile-settings"><div className="profile-photo"><span className="doctor-avatar avatar-lavender">MP</span><span className="profile-photo-label">Profile</span></div><div className="profile-grid"><Input label="Full name" name="doctor-name" value={profile.name} onChange={(event) => updateProfile('name', event.target.value)} /><Input label="Specialization" name="doctor-specialization" value={profile.specialization} onChange={(event) => updateProfile('specialization', event.target.value)} /><Input label="License number" name="license-number" value={profile.license} onChange={(event) => updateProfile('license', event.target.value)} /><Input label="Years of experience" name="experience" value={profile.experience} onChange={(event) => updateProfile('experience', event.target.value)} /><label className="field field-wide"><span className="field-label">Clinic address</span><input className="input" value={profile.address} onChange={(event) => updateProfile('address', event.target.value)} /></label></div></div></Card>
    <Card className="settings-card"><div className="settings-title"><span className="settings-icon settings-green"><CalendarDays size={19} /></span><div><h2>Availability</h2><p>Manage your appointment preferences.</p></div></div><div className="availability-toggle"><div><strong>Accepting new patients</strong><p>Patients can request appointments with you.</p></div><button className={`toggle ${available ? 'toggle-on' : ''}`} aria-label="Toggle new patient availability" aria-pressed={available} onClick={() => setAvailable(!available)}><span /></button></div><div className="availability-schedule"><ScheduleSetting day="Monday – Friday" value={schedule.weekdays} onChange={(value) => updateSchedule('weekdays', value)} /><ScheduleSetting day="Saturday" value={schedule.saturday} onChange={(value) => updateSchedule('saturday', value)} /><ScheduleSetting day="Sunday" value={schedule.sunday} onChange={(value) => updateSchedule('sunday', value)} /></div><div className="slot-duration"><label className="field"><span className="field-label">Appointment duration</span><select className="input" value={duration} onChange={(event) => setDuration(event.target.value)}><option>30 minutes</option><option>45 minutes</option><option>60 minutes</option></select></label></div></Card></div><div className="settings-actions"><Button variant="outline" onClick={() => window.location.reload()}>Cancel changes</Button><Button onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save changes'} <Check size={15} /></Button></div></div></AppShell>
}
function ScheduleSetting({ day, value, onChange }) { return <div><label className="availability-day"><strong>{day}</strong><input className="input availability-time" aria-label={`${day} hours`} value={value} onChange={(event) => onChange(event.target.value)} /></label></div> }

export default App
