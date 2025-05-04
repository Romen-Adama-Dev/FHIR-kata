const API_URL = 'https://hapi.fhir.org/baseR4/Patient'

document.getElementById('load-btn').addEventListener('click', async () => {
  const response = await fetch(`${API_URL}?_count=10`)
  const data = await response.json()

  const patients = data.entry || []

  const list = document.getElementById('patient-list')
  list.innerHTML = ''

  patients.forEach(entry => {
    const patient = entry.resource
    const name = patient.name?.[0]?.given?.join(' ') + ' ' + patient.name?.[0]?.family
    const gender = patient.gender
    const li = document.createElement('li')
    li.textContent = `${name} (${gender})`
    list.appendChild(li)
  })
})