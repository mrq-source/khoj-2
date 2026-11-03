const wait = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms))
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
export const AI_ENDPOINT = import.meta.env.VITE_AI_ENDPOINT || `${API_BASE_URL}/ai/analyze`

const doctors = [
  { id: 'd1', name: 'Dr. Maya Patel', specialization: 'Dermatologist', experience: '12 years', rating: 4.9, reviews: 128, distance: '1.2 mi', availability: 'Today, 3:30 PM', price: '$85', initials: 'MP', color: 'lavender', location: 'Soho Skin & Laser, New York' },
  { id: 'd2', name: 'Dr. James Wilson', specialization: 'Dermatologist', experience: '9 years', rating: 4.8, reviews: 96, distance: '2.4 mi', availability: 'Tomorrow, 10:00 AM', price: '$75', initials: 'JW', color: 'blue', location: 'Greenwich Medical Center, New York' },
  { id: 'd3', name: 'Dr. Aisha Khan', specialization: 'Cosmetic Dermatologist', experience: '15 years', rating: 5.0, reviews: 204, distance: '3.1 mi', availability: 'Today, 5:15 PM', price: '$110', initials: 'AK', color: 'peach', location: 'Union Square Dermatology, New York' },
  { id: 'd4', name: 'Dr. Ethan Brooks', specialization: 'Pediatric Dermatologist', experience: '7 years', rating: 4.7, reviews: 72, distance: '4.8 mi', availability: 'Fri, 9:30 AM', price: '$90', initials: 'EB', color: 'mint', location: 'Chelsea Health, New York' },
]

const consultations = [
  { id: 'c1', title: 'Rash on forearm', date: 'Oct 22, 2024', severity: 'Medium', status: 'Appointment booked', doctor: 'Dr. Maya Patel', detail: 'A few small, itchy patches appeared on your left forearm.' },
  { id: 'c2', title: 'Dry skin around cheeks', date: 'Oct 08, 2024', severity: 'Low', status: 'Completed', doctor: 'Dr. James Wilson', detail: 'Dryness and mild redness around both cheeks.' },
  { id: 'c3', title: 'Mole check', date: 'Sep 14, 2024', severity: 'Low', status: 'Completed', doctor: 'Dr. Maya Patel', detail: 'Routine check for a small mole on your shoulder.' },
]

export async function login({ email, password, role }) {
  await wait()
  if (!email || !password) throw new Error('Enter your email and password to continue.')
  // Replace this mock response with the real authentication API call.
  return {
    id: `${role}-demo`,
    role,
    name: role === 'doctor' ? 'Dr. Maya Patel' : 'Olivia Rhye',
    email,
  }
}

export async function signup({ role, name, email }) {
  await wait(650)
  return { id: `${role}-${Date.now()}`, role, name, email }
}

export async function getPatientDashboard() {
  await wait(380)
  return { consultations, appointments: [{ id: 'a1', doctor: 'Dr. Maya Patel', date: 'Thu, Oct 31', time: '10:30 AM', type: 'Follow-up appointment' }] }
}

export async function analyzeSymptoms({ symptoms, severity, metadata = {}, images }) {
  if (!images?.length) throw new Error('Upload a skin photo to run the image model.')

  const formData = new FormData()
  formData.append('image', images[0], images[0].name)
  formData.append('metadata', JSON.stringify(metadata))
  formData.append('severity', String(severity))

  const response = await fetch(AI_ENDPOINT, { method: 'POST', body: formData })
  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The model service returned an invalid response. Please try again.')
  }
  if (!response.ok) {
    throw new Error(typeof result?.detail === 'string' ? result.detail : 'The model service could not analyze this photo.')
  }
  if (!result || typeof result !== 'object' || !result.prediction) {
    throw new Error('The model service returned an incomplete result. Please try again.')
  }
  return { ...result, symptoms }
}

export async function searchDoctors({ query = '', specialization = '', minRating = 0 } = {}) {
  await wait(280)
  const normalized = query.trim().toLowerCase()
  return doctors.filter((doctor) => (
    (!normalized || doctor.name.toLowerCase().includes(normalized) || doctor.specialization.toLowerCase().includes(normalized))
    && (!specialization || doctor.specialization === specialization)
    && doctor.rating >= Number(minRating || 0)
  ))
}

export async function getDoctorsNearby(location) {
  await wait(500)
  return doctors.map((doctor) => ({ ...doctor, location: location ? `${doctor.location.split(',')[0]}, ${location}` : doctor.location }))
}

export async function bookAppointment({ doctor, severity }) {
  await wait(650)
  const days = { Critical: 0, High: 1, Medium: 2, Low: 5 }
  const date = new Date()
  date.setDate(date.getDate() + (days[severity] ?? 2))
  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const dateISO = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const time = severity === 'Critical' ? 'Today, 3:30 PM' : severity === 'High' ? 'Tomorrow, 10:00 AM' : severity === 'Low' ? '2:00 PM' : '10:30 AM'
  return { id: `a-${Date.now()}`, doctor, severity, date: dateLabel, dateISO, time, status: 'Confirmed' }
}

export async function requestDifferentTime({ doctorId, date, time }) {
  await wait(400)
  return { doctorId, date, time, status: 'Requested' }
}

export async function getDoctorRequests() {
  await wait(420)
  return [
    { id: 'r1', patient: 'Olivia Rhye', age: 28, symptoms: 'A red, itchy rash appeared on my forearm about 4 days ago. It feels warm to the touch.', severity: 'Critical', date: 'Today, 9:42 AM', summary: 'Localized rash with redness and possible inflammation. Recommend prompt in-person assessment.', photos: 2, status: 'New' },
    { id: 'r2', patient: 'Phoenix Baker', age: 34, symptoms: 'Small dry patches on both cheeks, getting worse in cold weather.', severity: 'Medium', date: 'Today, 8:16 AM', summary: 'Symptoms may be consistent with dry skin or mild eczema.', photos: 1, status: 'New' },
    { id: 'r3', patient: 'Lana Steiner', age: 25, symptoms: 'Would like to have a mole on my shoulder checked.', severity: 'Low', date: 'Yesterday', summary: 'Routine mole check requested. No other symptoms reported.', photos: 3, status: 'New' },
  ]
}

export async function updateAppointmentRequest(id, action, note = '', proposedSlot = null) {
  await wait(400)
  return { id, action, note, proposedSlot, updatedAt: new Date().toISOString() }
}

export async function updateDoctorProfile(profile) {
  await wait(500)
  return profile
}
