// Constants
const API_URL = 'https://hapi.fhir.org/baseR4/Patient';

// State
let debounceTimeout;
let nextLink = '';

// DOM Elements
const list = document.getElementById('patient-list');
const errorMsg = document.getElementById('error-msg');
const searchInput = document.getElementById('search-input');
const loadMoreBtn = document.getElementById('load-more-btn');
const detailSection = document.getElementById('patient-detail');
const detailContent = document.getElementById('detail-content');
const obsSection = document.getElementById('observations');
const obsList = document.getElementById('observation-list');
const encSection = document.getElementById('encounters');
const encList = document.getElementById('encounter-list');
const condSection = document.getElementById('conditions');
const condList = document.getElementById('condition-list');
const allergySection = document.getElementById('allergies');
const allergyList = document.getElementById('allergy-list');
const immSection = document.getElementById('immunizations');
const immList = document.getElementById('immunization-list');
const reportSection = document.getElementById('reports');
const reportList = document.getElementById('report-list');
const procSection = document.getElementById('procedures');
const procList = document.getElementById('procedure-list');
const careplanSection = document.getElementById('careplans');
const careplanList = document.getElementById('careplan-list');
const exportBtn = document.getElementById('export-btn');

// Event Listeners
searchInput.addEventListener('keydown', handleSearchKeyDown);
searchInput.addEventListener('input', handleSearchInput);
document.getElementById('load-btn').addEventListener('click', () => loadPatients());
document.getElementById('back-btn').addEventListener('click', resetView);
loadMoreBtn.addEventListener('click', () => loadPatients(true));
exportBtn.addEventListener('click', exportPatientData);
document.getElementById('export-pdf-btn').addEventListener('click', exportPatientPDF)

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

// Utility Functions
function formatPatientName(patient) {
    const given = patient.name?.[0]?.given?.join(' ') || '';
    const family = patient.name?.[0]?.family || '';
    return `${given} ${family}`.trim() || 'Nombre desconocido';
}

function showLoading(target) {
    target.innerHTML = '<p>Cargando...</p>';
}

function createCard(content) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = content;
    return card;
}

function exportPatientData() {
    const content = detailContent.textContent + '\n\n' +
        Array.from(document.querySelectorAll('.card-container'))
            .map(container => Array.from(container.children).map(c => c.textContent).join('\n'))
            .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'paciente.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    list.innerHTML = '';
    patients.forEach(entry => {
        const patient = entry.resource;
        const name = formatPatientName(patient);
        const gender = patient.gender || 'N/A';
        const id = patient.id;

        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => loadPatientDetail(id));
        card.innerHTML = `
            <strong>${name}</strong><br/>
            Género: ${gender}<br/>
            ID: ${id}
        `;
        list.appendChild(card);
    });
}

function renderPatientDetail(patient) {
    const name = formatPatientName(patient);
    const gender = patient.gender || 'N/A';
    const birth = patient.birthDate || 'Desconocido';

    detailContent.textContent = `Nombre: ${name} | Género: ${gender} | Nacimiento: ${birth} | ID: ${patient.id}`;
    detailSection.hidden = false;
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

        await Promise.allSettled([
            loadPatientObservations(id),
            loadPatientEncounters(id),
            loadPatientConditions(id),
            loadPatientMedications(id),
            loadPatientAllergies(id),
            loadPatientImmunizations(id),
            loadPatientReports(id),
            loadPatientProcedures(id),
            loadPatientCarePlans(id)
        ])
        
    } catch (err) {
        console.error(err);
        detailSection.hidden = true;
    }
}

async function loadPatientObservations(patientId) {
    showLoading(obsList)
    try {
      const res = await fetch(`https://hapi.fhir.org/baseR4/Observation?subject=Patient/${patientId}&_count=10`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = data.entry || []
  
      obsList.innerHTML = ''
      if (!list.length) {
        obsList.innerHTML = '<p>No hay observaciones disponibles.</p>'
        obsSection.hidden = false
        return
      }
  
      list.forEach(entry => {
        const obs = entry.resource
        const code = obs.code?.text || 'Sin descripción'
        const value = obs.valueQuantity
          ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit || ''}`.trim()
          : 'Sin valor'
        const date = obs.effectiveDateTime || 'Sin fecha'
  
        const card = createCard(`<strong>${code}</strong><br/>Valor: ${value}<br/>Fecha: ${date}`)
        obsList.appendChild(card)
      })
  
      obsSection.hidden = false
    } catch {
      obsSection.hidden = true
    }
  }
  
  async function loadPatientEncounters(patientId) {
    showLoading(encList)
    try {
      const res = await fetch(`https://hapi.fhir.org/baseR4/Encounter?subject=Patient/${patientId}&_count=10`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = data.entry || []
  
      encList.innerHTML = ''
      if (!list.length) {
        encList.innerHTML = '<p>No hay encuentros disponibles.</p>'
        encSection.hidden = false
        return
      }
  
      list.forEach(entry => {
        const enc = entry.resource
        const type = enc.type?.[0]?.text || 'Tipo desconocido'
        const status = enc.status || 'Sin estado'
        const start = enc.period?.start || 'Sin fecha'
        const facility = enc.serviceProvider?.display || 'Centro no especificado'
  
        const card = createCard(`<strong>${type}</strong><br/>Estado: ${status}<br/>Fecha: ${start}<br/>Centro: ${facility}`)
        encList.appendChild(card)
      })
  
      encSection.hidden = false
    } catch {
      encSection.hidden = true
    }
  }
  
  async function loadPatientConditions(patientId) {
    showLoading(condList)
    try {
      const res = await fetch(`https://hapi.fhir.org/baseR4/Condition?subject=Patient/${patientId}&_count=10`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = data.entry || []
  
      condList.innerHTML = ''
      if (!list.length) {
        condList.innerHTML = '<p>No hay condiciones disponibles.</p>'
        condSection.hidden = false
        return
      }
  
      list.forEach(entry => {
        const cond = entry.resource
        const code = cond.code?.text || 'Condición no especificada'
        const status = cond.clinicalStatus?.text || 'Sin estado'
        const onset = cond.onsetDateTime || 'Fecha desconocida'
  
        const card = createCard(`<strong>${code}</strong><br/>Estado: ${status}<br/>Inicio: ${onset}`)
        condList.appendChild(card)
      })
  
      condSection.hidden = false
    } catch {
      condSection.hidden = true
    }
  }
  
  async function loadPatientMedications(patientId) {
    showLoading(medList)
    try {
      const res = await fetch(`https://hapi.fhir.org/baseR4/MedicationRequest?subject=Patient/${patientId}&_count=10`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = data.entry || []
  
      medList.innerHTML = ''
      if (!list.length) {
        medList.innerHTML = '<p>No hay medicaciones disponibles.</p>'
        medSection.hidden = false
        return
      }
  
      list.forEach(entry => {
        const med = entry.resource
        const medication = med.medicationCodeableConcept?.text || 'Medicación no especificada'
        const status = med.status || 'Sin estado'
        const authored = med.authoredOn || 'Fecha desconocida'
  
        const card = createCard(`<strong>${medication}</strong><br/>Estado: ${status}<br/>Recetado el: ${authored}`)
        medList.appendChild(card)
      })
  
      medSection.hidden = false
    } catch {
      medSection.hidden = true
    }
  }
  
  async function loadPatientAllergies(patientId) {
    showLoading(allergyList)
    try {
      const res = await fetch(`https://hapi.fhir.org/baseR4/AllergyIntolerance?patient=Patient/${patientId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = data.entry || []
  
      allergyList.innerHTML = ''
      if (!list.length) {
        allergyList.innerHTML = '<p>No hay alergias registradas.</p>'
        allergySection.hidden = false
        return
      }
  
      list.forEach(entry => {
        const a = entry.resource
        const code = a.code?.text || 'Sin descripción'
        const status = a.clinicalStatus?.text || 'N/A'
  
        const card = createCard(`<strong>${code}</strong><br/>Estado: ${status}`)
        allergyList.appendChild(card)
      })
  
      allergySection.hidden = false
    } catch {
      allergySection.hidden = true
    }
  }
  
  async function loadPatientImmunizations(patientId) {
    showLoading(immList)
    try {
      const res = await fetch(`https://hapi.fhir.org/baseR4/Immunization?patient=Patient/${patientId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = data.entry || []
  
      immList.innerHTML = ''
      if (!list.length) {
        immList.innerHTML = '<p>No hay vacunaciones registradas.</p>'
        immSection.hidden = false
        return
      }
  
      list.forEach(entry => {
        const i = entry.resource
        const vaccine = i.vaccineCode?.text || 'Vacuna desconocida'
        const date = i.occurrenceDateTime || 'N/A'
  
        const card = createCard(`<strong>${vaccine}</strong><br/>Fecha: ${date}`)
        immList.appendChild(card)
      })
  
      immSection.hidden = false
    } catch {
      immSection.hidden = true
    }
  }
  
  async function loadPatientReports(patientId) {
    showLoading(reportList)
    try {
      const res = await fetch(`https://hapi.fhir.org/baseR4/DiagnosticReport?subject=Patient/${patientId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = data.entry || []
  
      reportList.innerHTML = ''
      if (!list.length) {
        reportList.innerHTML = '<p>No hay informes diagnósticos.</p>'
        reportSection.hidden = false
        return
      }
  
      list.forEach(entry => {
        const r = entry.resource
        const code = r.code?.text || 'Sin título'
        const status = r.status || 'N/A'
        const date = r.effectiveDateTime || 'N/A'
  
        const card = createCard(`<strong>${code}</strong><br/>Estado: ${status}<br/>Fecha: ${date}`)
        reportList.appendChild(card)
      })
  
      reportSection.hidden = false
    } catch {
      reportSection.hidden = true
    }
  }
  
  async function loadPatientProcedures(patientId) {
    showLoading(procList)
    try {
      const res = await fetch(`https://hapi.fhir.org/baseR4/Procedure?subject=Patient/${patientId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = data.entry || []
  
      procList.innerHTML = ''
      if (!list.length) {
        procList.innerHTML = '<p>No hay procedimientos registrados.</p>'
        procSection.hidden = false
        return
      }
  
      list.forEach(entry => {
        const p = entry.resource
        const code = p.code?.text || 'Sin procedimiento'
        const status = p.status || 'N/A'
        const date = p.performedDateTime || 'N/A'
  
        const card = createCard(`<strong>${code}</strong><br/>Estado: ${status}<br/>Fecha: ${date}`)
        procList.appendChild(card)
      })
  
      procSection.hidden = false
    } catch {
      procSection.hidden = true
    }
  }
  
  async function loadPatientCarePlans(patientId) {
    showLoading(careplanList)
    try {
      const res = await fetch(`https://hapi.fhir.org/baseR4/CarePlan?subject=Patient/${patientId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list = data.entry || []
  
      careplanList.innerHTML = ''
      if (!list.length) {
        careplanList.innerHTML = '<p>No hay planes de atención.</p>'
        careplanSection.hidden = false
        return
      }
  
      list.forEach(entry => {
        const cp = entry.resource
        const title = cp.title || 'Plan sin título'
        const status = cp.status || 'N/A'
        const date = cp.period?.start || 'N/A'
  
        const card = createCard(`<strong>${title}</strong><br/>Estado: ${status}<br/>Fecha: ${date}`)
        careplanList.appendChild(card)
      })
  
      careplanSection.hidden = false
    } catch {
      careplanSection.hidden = true
    }
  }

// Reset View
function resetView() {
    detailSection.hidden = true;
    obsSection.hidden = true;
    encSection.hidden = true;
    condSection.hidden = true;
    medSection.hidden = true;
    allergySection.hidden = true;
    immSection.hidden = true;
    reportSection.hidden = true;
    procSection.hidden = true;
    careplanSection.hidden = true;

    detailContent.textContent = '';
    obsList.innerHTML = '';
    encList.innerHTML = '';
    condList.innerHTML = '';
    medList.innerHTML = '';
    allergyList.innerHTML = '';
    immList.innerHTML = '';
    reportList.innerHTML = '';
    procList.innerHTML = '';
    careplanList.innerHTML = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function exportPatientPDF() {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()
  
    let y = 10
    doc.setFontSize(14)
    doc.text('Resumen del Paciente', 10, y)
    y += 10
  
    doc.setFontSize(11)
    doc.text(detailContent.textContent, 10, y)
    y += 20
  
    document.querySelectorAll('section').forEach(section => {
      if (!section.hidden) {
        const title = section.querySelector('h2')?.textContent
        if (title) {
          doc.setFont(undefined, 'bold')
          doc.text(title, 10, y)
          y += 7
          doc.setFont(undefined, 'normal')
        }
  
        const cards = section.querySelectorAll('.card')
        cards.forEach(card => {
          const lines = card.textContent.trim().split('\n')
          lines.forEach(line => {
            doc.text(line.trim(), 10, y)
            y += 6
            if (y > 280) {
              doc.addPage()
              y = 10
            }
          })
          y += 4
        })
      }
    })
  
    doc.save('paciente.pdf')
}