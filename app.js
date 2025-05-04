const API_URL = 'https://hapi.fhir.org/baseR4/Patient'
const list = document.getElementById('patient-list')
const errorMsg = document.getElementById('error-msg')
const searchInput = document.getElementById('search-input')

let debounceTimeout

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    clearTimeout(debounceTimeout)
    loadPatients()
  }
})

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    loadPatients()
  }, 400)
})

document.getElementById('load-btn').addEventListener('click', loadPatients)

async function fetchPatients(name = '') {
  const url = name 
    ? `${API_URL}?name=${encodeURIComponent(name)}&_count=10`
    : `${API_URL}?_count=10`

  const response = await fetch(url)
  if (!response.ok) throw new Error('Error al obtener los pacientes')
  const data = await response.json()
  return data.entry || []
}

function renderPatientList(patients) {
  list.innerHTML = ''
  patients.forEach(entry => {
    const patient = entry.resource
    const name = patient.name?.[0]?.given?.join(' ') + ' ' + patient.name?.[0]?.family || 'Nombre desconocido'
    const gender = patient.gender || 'N/A'
    const id = patient.id
    const li = document.createElement('li')
    li.textContent = `${name} (${gender}) - ID: ${id}`
    list.appendChild(li)
  })
}

async function loadPatients() {
  errorMsg.hidden = true
  const name = searchInput.value.trim()

  try {
    const patients = await fetchPatients(name)
    renderPatientList(patients)
  } catch (error) {
    console.error(error)
    errorMsg.hidden = false
  }
}