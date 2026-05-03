// Datos mock para Plan-B (UNSTA, Lic. en Sistemas).
// Modelo simplificado: el plan tiene 5 años x 2 cuatrimestres.
// Los estados por materia son: approved, regularized, coursing, failed, pending, libre_eligible.

const CAREER = {
  university: "UNSTA",
  career: "Licenciatura en Sistemas",
  totalSubjects: 38,
  totalHours: 3200,
};

// Cada materia: { code, name, year, semester, hours, credits, prereqs[], difficulty (1-5), passRate, reviewsCount, profs[] }
const SUBJECTS = [
  // Año 1
  { code: "MAT101", name: "Análisis Matemático I", year: 1, sem: 1, hours: 96, diff: 4.2, passRate: 0.42, reviews: 29, profs: ["Dra. Romero", "Ing. Salinas"] },
  { code: "ALG101", name: "Álgebra y Geometría Analítica", year: 1, sem: 1, hours: 96, diff: 3.8, passRate: 0.51, reviews: 24, profs: ["Lic. Vega"] },
  { code: "PRG101", name: "Programación I", year: 1, sem: 1, hours: 128, diff: 3.1, passRate: 0.68, reviews: 41, profs: ["Ing. Méndez", "Lic. Castro"] },
  { code: "ARQ101", name: "Arquitectura de Computadoras", year: 1, sem: 1, hours: 64, diff: 2.9, passRate: 0.74, reviews: 20, profs: ["Ing. Paz"] },
  { code: "ING101", name: "Inglés Técnico I", year: 1, sem: 1, hours: 32, diff: 1.8, passRate: 0.91, reviews: 16, profs: ["Prof. Lynch"] },

  { code: "MAT102", name: "Análisis Matemático II", year: 1, sem: 2, hours: 96, diff: 4.5, passRate: 0.34, reviews: 31, prereqs: ["MAT101"], profs: ["Dra. Romero"] },
  { code: "DIS101", name: "Matemática Discreta", year: 1, sem: 2, hours: 64, diff: 3.6, passRate: 0.58, reviews: 17, prereqs: ["ALG101"], profs: ["Lic. Vega"] },
  { code: "PRG102", name: "Programación II", year: 1, sem: 2, hours: 128, diff: 3.4, passRate: 0.62, reviews: 39, prereqs: ["PRG101"], profs: ["Ing. Méndez"] },
  { code: "SIS101", name: "Sistemas y Organizaciones", year: 1, sem: 2, hours: 64, diff: 2.4, passRate: 0.81, reviews: 14, profs: ["Lic. Brandt"] },
  { code: "ING102", name: "Inglés Técnico II", year: 1, sem: 2, hours: 32, diff: 1.9, passRate: 0.89, reviews: 13, prereqs: ["ING101"], profs: ["Prof. Lynch"] },

  // Año 2
  { code: "MAT201", name: "Probabilidad y Estadística", year: 2, sem: 1, hours: 96, diff: 4.0, passRate: 0.46, reviews: 22, prereqs: ["MAT102"], profs: ["Dr. Iturralde"] },
  { code: "BDD201", name: "Bases de Datos I", year: 2, sem: 1, hours: 96, diff: 3.2, passRate: 0.71, reviews: 30, prereqs: ["PRG102"], profs: ["Ing. Sosa", "Lic. Domínguez"] },
  { code: "EDD201", name: "Estructuras de Datos", year: 2, sem: 1, hours: 96, diff: 4.1, passRate: 0.49, reviews: 28, prereqs: ["PRG102", "DIS101"], profs: ["Ing. Méndez"] },
  { code: "RED201", name: "Redes I", year: 2, sem: 1, hours: 64, diff: 3.3, passRate: 0.66, reviews: 19, prereqs: ["ARQ101"], profs: ["Ing. Paz"] },

  { code: "POO202", name: "Programación Orientada a Objetos", year: 2, sem: 2, hours: 128, diff: 3.7, passRate: 0.55, reviews: 34, prereqs: ["PRG102"], profs: ["Lic. Castro"] },
  { code: "BDD202", name: "Bases de Datos II", year: 2, sem: 2, hours: 96, diff: 3.5, passRate: 0.62, reviews: 21, prereqs: ["BDD201"], profs: ["Ing. Sosa"] },
  { code: "ALG202", name: "Algoritmos y Complejidad", year: 2, sem: 2, hours: 96, diff: 4.4, passRate: 0.38, reviews: 26, prereqs: ["EDD201"], profs: ["Dr. Iturralde"] },
  { code: "SOP202", name: "Sistemas Operativos", year: 2, sem: 2, hours: 96, diff: 4.3, passRate: 0.41, reviews: 27, prereqs: ["ARQ101", "PRG102"], profs: ["Ing. Paz"] },

  // Año 3
  { code: "ISW301", name: "Ingeniería de Software I", year: 3, sem: 1, hours: 96, diff: 3.4, passRate: 0.68, reviews: 23, prereqs: ["POO202"], profs: ["Lic. Brandt"] },
  { code: "WEB301", name: "Desarrollo Web", year: 3, sem: 1, hours: 96, diff: 3.0, passRate: 0.75, reviews: 31, prereqs: ["POO202", "BDD201"], profs: ["Lic. Castro"] },
  { code: "RED302", name: "Redes II", year: 3, sem: 1, hours: 96, diff: 3.6, passRate: 0.59, reviews: 18, prereqs: ["RED201"], profs: ["Ing. Paz"] },
  { code: "PAR301", name: "Paradigmas de Programación", year: 3, sem: 1, hours: 96, diff: 4.0, passRate: 0.53, reviews: 20, prereqs: ["POO202"], profs: ["Dr. Iturralde"] },

  { code: "ISW302", name: "Ingeniería de Software II", year: 3, sem: 2, hours: 96, diff: 3.6, passRate: 0.61, reviews: 19, prereqs: ["ISW301"], profs: ["Lic. Brandt"] },
  { code: "MOV302", name: "Aplicaciones Móviles", year: 3, sem: 2, hours: 96, diff: 3.2, passRate: 0.72, reviews: 25, prereqs: ["WEB301"], profs: ["Lic. Castro"] },
  { code: "INT302", name: "Inteligencia Artificial I", year: 3, sem: 2, hours: 96, diff: 4.3, passRate: 0.44, reviews: 16, prereqs: ["ALG202", "MAT201"], profs: ["Dr. Iturralde"] },
  { code: "SEG302", name: "Seguridad Informática", year: 3, sem: 2, hours: 64, diff: 3.5, passRate: 0.64, reviews: 13, prereqs: ["RED302", "SOP202"], profs: ["Ing. Sosa"] },

  // Año 4
  { code: "DIS401", name: "Diseño de Sistemas", year: 4, sem: 1, hours: 96, diff: 3.7, passRate: 0.58, reviews: 15, prereqs: ["ISW302"], profs: ["Lic. Brandt"] },
  { code: "DAT401", name: "Ciencia de Datos", year: 4, sem: 1, hours: 96, diff: 4.0, passRate: 0.51, reviews: 12, prereqs: ["MAT201", "BDD202"], profs: ["Dr. Iturralde"] },
  { code: "CAL401", name: "Calidad de Software", year: 4, sem: 1, hours: 64, diff: 2.8, passRate: 0.78, reviews: 10, prereqs: ["ISW302"], profs: ["Lic. Brandt"] },
  { code: "GES401", name: "Gestión de Proyectos", year: 4, sem: 1, hours: 64, diff: 2.6, passRate: 0.83, reviews: 13, profs: ["Lic. Brandt"] },

  { code: "INT402", name: "Inteligencia Artificial II", year: 4, sem: 2, hours: 96, diff: 4.4, passRate: 0.42, reviews: 9, prereqs: ["INT302"], profs: ["Dr. Iturralde"] },
  { code: "DIS402", name: "Sistemas Distribuidos", year: 4, sem: 2, hours: 96, diff: 4.2, passRate: 0.47, reviews: 11, prereqs: ["SOP202", "RED302"], profs: ["Ing. Paz"] },
  { code: "EMP402", name: "Emprendimientos Tecnológicos", year: 4, sem: 2, hours: 64, diff: 2.4, passRate: 0.86, reviews: 15, profs: ["Lic. Brandt"] },
  { code: "ELE402", name: "Electiva I", year: 4, sem: 2, hours: 64, diff: 3.0, passRate: 0.74, reviews: 7, profs: ["Varios"] },

  // Año 5
  { code: "PRA501", name: "Práctica Profesional", year: 5, sem: 1, hours: 200, diff: 2.5, passRate: 0.92, reviews: 9, prereqs: ["DIS401"], profs: ["Lic. Brandt"] },
  { code: "ELE501", name: "Electiva II", year: 5, sem: 1, hours: 64, diff: 3.0, passRate: 0.74, reviews: 5, profs: ["Varios"] },
  { code: "TES501", name: "Tesina / Trabajo Final", year: 5, sem: 2, hours: 200, diff: 3.8, passRate: 0.68, reviews: 8, prereqs: ["PRA501"], profs: ["Tutores"] },
  { code: "ETI501", name: "Ética Profesional", year: 5, sem: 2, hours: 32, diff: 1.6, passRate: 0.94, reviews: 13, profs: ["Lic. Brandt"] },
];

// Estado del alumno (avanzado por defecto). El estado de cada materia se calcula en USER_STATES.
// approved: cursada y aprobada en final
// regularized: cursada aprobada, pendiente de final
// coursing: cursando ahora
// failed: recursando (la cursó y no aprobó)
// pending: aún no la cursó
// available: aún no la cursó pero ya tiene correlativas

const USER_STATES = {
  // Avanzado: 3er año en marcha, con un par de recursadas
  advanced: {
    "MAT101": "approved", "ALG101": "approved", "PRG101": "approved", "ARQ101": "approved", "ING101": "approved",
    "MAT102": "regularized", "DIS101": "approved", "PRG102": "approved", "SIS101": "approved", "ING102": "approved",
    "MAT201": "failed", "BDD201": "approved", "EDD201": "approved", "RED201": "approved",
    "POO202": "approved", "BDD202": "regularized", "ALG202": "failed", "SOP202": "approved",
    "ISW301": "coursing", "WEB301": "coursing", "RED302": "coursing", "PAR301": "coursing",
  },
  // Nuevo: en primer año
  new: {
    "MAT101": "coursing", "ALG101": "coursing", "PRG101": "coursing", "ARQ101": "coursing", "ING101": "coursing",
  },
  // En problemas: trabaja, recursó varias, atrasado
  troubled: {
    "MAT101": "approved", "ALG101": "approved", "PRG101": "approved", "ARQ101": "approved", "ING101": "approved",
    "MAT102": "failed", "DIS101": "approved", "PRG102": "approved", "SIS101": "approved", "ING102": "approved",
    "MAT201": "failed", "BDD201": "regularized", "EDD201": "failed", "RED201": "approved",
    "POO202": "coursing", "ALG202": "coursing",
  },
};

// Comisiones / horarios
// Cada comisión: { id, subject, code, slots: [{day, start, end}], prof, ratingProf, capacity, enrolled }
const COMMISSIONS = {
  "ISW302": [
    { id: "ISW302-A", code: "A", slots: [{d: "Lun", s: 18, e: 22}, {d: "Mié", s: 18, e: 22}], prof: "Lic. Brandt", profRating: 4.2, capacity: 60, enrolled: 47 },
    { id: "ISW302-B", code: "B", slots: [{d: "Mar", s: 8, e: 12}, {d: "Jue", s: 8, e: 12}], prof: "Lic. Castro", profRating: 4.6, capacity: 50, enrolled: 50 },
  ],
  "MOV302": [
    { id: "MOV302-A", code: "A", slots: [{d: "Mar", s: 19, e: 22}, {d: "Vie", s: 19, e: 22}], prof: "Lic. Castro", profRating: 4.6, capacity: 50, enrolled: 38 },
  ],
  "INT302": [
    { id: "INT302-A", code: "A", slots: [{d: "Lun", s: 14, e: 18}, {d: "Vie", s: 14, e: 18}], prof: "Dr. Iturralde", profRating: 3.4, capacity: 40, enrolled: 31 },
    { id: "INT302-B", code: "B", slots: [{d: "Mié", s: 18, e: 22}, {d: "Sáb", s: 9, e: 13}], prof: "Ing. Sosa", profRating: 4.1, capacity: 40, enrolled: 22 },
  ],
  "SEG302": [
    { id: "SEG302-A", code: "A", slots: [{d: "Jue", s: 19, e: 22}], prof: "Ing. Sosa", profRating: 4.1, capacity: 35, enrolled: 19 },
  ],
  "MAT201": [
    { id: "MAT201-A", code: "A", slots: [{d: "Lun", s: 8, e: 12}, {d: "Mié", s: 8, e: 12}], prof: "Dr. Iturralde", profRating: 3.4, capacity: 60, enrolled: 54 },
    { id: "MAT201-B", code: "B", slots: [{d: "Mar", s: 18, e: 22}, {d: "Jue", s: 18, e: 22}], prof: "Lic. Vega", profRating: 4.4, capacity: 50, enrolled: 41 },
  ],
  "ALG202": [
    { id: "ALG202-A", code: "A", slots: [{d: "Mar", s: 14, e: 18}, {d: "Jue", s: 14, e: 18}], prof: "Dr. Iturralde", profRating: 3.4, capacity: 40, enrolled: 35 },
  ],
};

// Reseñas mock
const REVIEWS = {
  "ISW302": [
    { id: 1, rating: 4, difficulty: 4, workload: 4, recommend: true, year: "2025-1c", carreer: "Lic. Sistemas", verified: true,
      title: "Pesada pero te enseña de verdad",
      body: "El TP final es un proyecto en equipo de 6 personas que se extiende todo el cuatrimestre. Subestimar la carga es el error #1. Si lo arrancás temprano y el grupo funciona, sale bien. Brandt corrige con criterio, no con checklist.",
      helpful: 9, notHelpful: 1, prof: "Lic. Brandt" },
    { id: 2, rating: 3, difficulty: 4, workload: 5, recommend: false, year: "2024-2c", carreer: "Lic. Sistemas", verified: true,
      title: "No la cursen en cuatrimestre con muchas materias",
      body: "Es buena materia pero la carga es real. Si tenés trabajo + 4 materias más, va a explotar. Yo recursé porque no llegué con el TP final.",
      helpful: 18, notHelpful: 2, prof: "Lic. Brandt" },
    { id: 3, rating: 5, difficulty: 3, workload: 3, recommend: true, year: "2025-1c", carreer: "Lic. Sistemas", verified: true,
      title: "Castro es otro nivel",
      body: "Si podés, tomá la comisión B con Castro. Hace clases prácticas que te explican el porqué de las cosas. La A con Brandt es más teórica.",
      helpful: 25, notHelpful: 2, prof: "Lic. Castro" },
    { id: 4, rating: 4, difficulty: 4, workload: 4, recommend: true, year: "2024-1c", carreer: "Lic. Sistemas", verified: true,
      title: "Materia bisagra de la carrera",
      body: "Marca un antes y un después. Te enseñan a pensar como ingeniero, no como programador. El TP integra todo lo que viste hasta ahora.",
      helpful: 11, notHelpful: 1, prof: "Lic. Brandt" },
  ],
  "INT302": [
    { id: 5, rating: 2, difficulty: 5, workload: 4, recommend: false, year: "2025-1c", carreer: "Lic. Sistemas", verified: true,
      title: "Iturralde no enseña, evalúa",
      body: "Da por supuesto que sabés todo. Si no leíste el Russell & Norvig antes de la primera clase, vas perdido. Estudiá por tu cuenta.",
      helpful: 41, notHelpful: 4, prof: "Dr. Iturralde" },
  ],
};

// Reseñas docente (agregadas)
const PROFESSORS = {
  "Lic. Brandt": {
    name: "Lic. Esteban Brandt",
    subjects: ["ISW301", "ISW302", "DIS401", "CAL401", "GES401", "EMP402", "ETI501", "SIS101"],
    rating: 4.2, ratings: 312, verified: true, replies: 14,
    summary: "Riguroso, exigente con los TPs, justo en la corrección. La parte teórica puede sentirse densa. Disponible para consultas por mail.",
  },
  "Dr. Iturralde": {
    name: "Dr. Marcelo Iturralde",
    subjects: ["MAT201", "ALG202", "PAR301", "INT302", "INT402", "DAT401"],
    rating: 3.4, ratings: 487, verified: false, replies: 0,
    summary: "Conocimiento profundo pero pedagogía irregular. Da por supuesto contenido previo. Las materias con él requieren estudio autónomo intensivo.",
  },
};

window.PB_DATA = { CAREER, SUBJECTS, USER_STATES, COMMISSIONS, REVIEWS, PROFESSORS };
