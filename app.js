const API_URL = 'https://hapi.fhir.org/baseR4/Patient';

// DOM Elements
const list = document.getElementById('patient-list');
const errorMsg = document.getElementById('error-msg');
const searchInput = document.getElementById('search-input');
const loadMoreBtn = document.getElementById('load-more-btn');
const detailSection = document.getElementById('patient-detail');
const detailContent = document.getElementById('detail-content');
const obsSection = document.getElementById('observations')
const obsList = document.getElementById('observation-list')

// State
let debounceTimeout;
let nextLink = '';

// Event Listeners
searchInput.addEventListener('keydown', handleSearchKeyDown);
searchInput.addEventListener('input', handleSearchInput);
document.getElementById('load-btn').addEventListener('click', () => loadPatients());
document.getElementById('back-btn').addEventListener('click', resetView)
loadMoreBtn.addEventListener('click', () => loadPatients(true));

// Event Handlers
function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
        clearTimeout(debounceTimeout);
        loadPatients();
    }
}

function handleSearchInput() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        loadPatients();
    }, 400);
}

// API Functions
async function fetchPatients(name = '', url = '') {
    const fetchUrl = url || (name ? `${API_URL}?name=${encodeURIComponent(name)}&_count=10` : `${API_URL}?_count=10`);
    
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Error al obtener los pacientes');
    
    const data = await response.json();
    nextLink = data.link?.find(l => l.relation === 'next')?.url || '';
    loadMoreBtn.hidden = !nextLink;

    return data.entry || [];
}

async function fetchPatientDetail(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('No se pudo cargar el detalle');
    return response.json();
}

// Rendering Functions
function renderPatientList(patients) {
    list.innerHTML = ''
    patients.forEach(entry => {
      const patient = entry.resource
      const name = formatPatientName(patient)
      const gender = patient.gender || 'N/A'
      const id = patient.id
  
      const tr = document.createElement('tr')
      tr.style.cursor = 'pointer'
      tr.addEventListener('click', () => loadPatientDetail(id))
  
      tr.innerHTML = `
        <td data-label="Nombre">${name}</td>
        <td data-label="Género">${gender}</td>
        <td data-label="ID">${id}</td>
      `
      list.appendChild(tr)
    })
  }

function renderPatientDetail(patient) {
    const name = formatPatientName(patient);
    const gender = patient.gender || 'N/A';
    const birth = patient.birthDate || 'Desconocido';

    detailContent.textContent = `Nombre: ${name} | Género: ${gender} | Nacimiento: ${birth} | ID: ${patient.id}`;
    detailSection.hidden = false;
}

// Utility Functions
function formatPatientName(patient) {
    return patient.name?.[0]?.given?.join(' ') + ' ' + patient.name?.[0]?.family || 'Nombre desconocido';
}

// Main Functions
async function loadPatients(useNext = false) {
    errorMsg.hidden = true;
    const name = searchInput.value.trim();

    try {
        const patients = await fetchPatients(name, useNext ? nextLink : '');
        if (!useNext) list.innerHTML = '';
        renderPatientList(patients);
    } catch (error) {
        console.error(error);
        errorMsg.hidden = false;
    }
}

async function loadPatientDetail(id) {
    try {
        const patient = await fetchPatientDetail(id);
        renderPatientDetail(patient);
        await loadPatientObservations(id);
    } catch (err) {
        console.error(err);
        detailSection.hidden = true;
    }
}

async function loadPatientObservations(patientId) {
    try {
        const response = await fetch(`https://hapi.fhir.org/baseR4/Observation?subject=Patient/${patientId}&_count=10`);
        if (!response.ok) throw new Error('No se pudieron cargar las observaciones');

        const data = await response.json();
        const observations = data.entry || [];

        obsList.innerHTML = ''
        observations.forEach(entry => {
        const obs = entry.resource
        const code = obs.code?.text || 'Sin descripción'
        const value = obs.valueQuantity?.value + ' ' + obs.valueQuantity?.unit || 'Sin valor'
        const date = obs.effectiveDateTime || 'Sin fecha'

        const tr = document.createElement('tr')
        tr.innerHTML = `
            <td data-label="Observación">${code}</td>
            <td data-label="Valor">${value}</td>
            <td data-label="Fecha">${date}</td>
        `
        obsList.appendChild(tr)
        })

        obsSection.hidden = false;
    } catch (err) {
        console.error(err);
        obsSection.hidden = true;
    }
}

function resetView() {
    detailSection.hidden = true
    obsSection.hidden = true
    detailContent.textContent = ''
    obsList.innerHTML = ''
}