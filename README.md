# 🩺 Kata FHIR - Visualizador de Pacientes

Aplicación web construida como ejercicio técnico para consumir la API pública FHIR (https://hapi.fhir.org/baseR4), con HTML, CSS y JavaScript puro. Permite buscar pacientes, consultar su historial clínico y exportar el resumen.

## 🚀 Funcionalidades

- 🔍 Búsqueda dinámica por nombre con debounce y confirmación por `Enter`
- 📄 Exportación de resumen del paciente (TXT y PDF)
- 👁️ Visualización de:
  - Detalle general del paciente
  - Observaciones clínicas
  - Encuentros médicos
  - Condiciones
  - Medicaciones
  - Alergias
  - Vacunación
  - Informes diagnósticos
  - Procedimientos
  - Planes de atención

## 🛠️ Tecnologías

- HTML5
- CSS3 (responsive + accesible)
- JavaScript (ES6+)
- [jsPDF](https://github.com/parallax/jsPDF) para exportar a PDF
- API pública FHIR: `https://hapi.fhir.org/baseR4`

## 📦 Instalación y uso

```bash
git clone https://github.com/tuusuario/fhir-kata.git
cd fhir-kata
# Abre public/index.html en tu navegador