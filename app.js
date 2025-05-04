const API_URL = 'https://hapi.fhir.org/baseR4/Patient'

document.getElementById('load-btn').addEventListener('click', loadPatients)

async function fetchPatients() {
  const response = await fetch(`${API_URL}?_count=10`)
  if (!response.ok) throw new Error('Error al obtener los pacientes')
  const data = await response.json()
  return data.entry || []
}

function renderPatientList(patients) {
  const list = document.getElementById('patient-list')
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
  const errorMsg = document.getElementById('error-msg')
  errorMsg.hidden = true

  try {
    const patients = await fetchPatients()
    renderPatientList(patients)
  } catch (error) {
    console.error(error)
    errorMsg.hidden = false
  }
}