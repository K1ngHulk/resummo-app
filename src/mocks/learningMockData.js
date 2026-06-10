// Temporary Learning-only mock data.
// Replace this file when backend contracts or a real content source exist.

export const learningRoutes = [
  { id: 'general', label: 'General', path: '/learning' },
  { id: 'qbank', label: 'Banco de Preguntas', path: '/learning/qbank' },
  { id: 'analysis', label: 'Análisis', path: null, disabled: true },
  { id: 'study-plans', label: 'Planes de estudio y cursos', path: '/learning/study-plans' },
  { id: 'library', label: 'Biblioteca', path: '/learning/library' },
]

export const mockUser = {
  initials: 'M',
  name: 'Mathias Javier',
  role: 'Estudiante de medicina',
}

export const continueLearning = {
  heading: 'Continúa donde lo dejaste:',
  title: 'Síndrome coronario agudo: Manejo en emergencia',
  updatedLabel: 'Última vez',
  updatedAt: 'Jueves 6/24',
  progress: 68,
  action: 'Continuar estudiando',
}

export const questionSession = {
  heading: 'Continuar sesión de preguntas',
  viewAllLabel: 'Ver todo',
  mode: 'Modo de estudio',
  topic:
    'Preguntas basadas en "Restricción del crecimiento fetal" (aún no visto o leído, correcto)',
  answered: 5,
  total: 10,
  action: 'Continuar',
}

export const recentArticles = [
  'Cataratas',
  'Tuberculosis',
  'Infecciones respiratorias agudas',
  'Enfermedades digestivas',
]

export const progressSegments = [
  {
    label: '57% correctamente (239 preguntas)',
    value: 57,
    color: '#44c8a6',
  },
  {
    label: '1% no correctamente usando pistas (4 preguntas)',
    value: 1,
    color: '#f2c24f',
  },
  {
    label: '42% incorrectamente (176 preguntas)',
    value: 42,
    color: '#ef7f7d',
  },
]

export const overallProgress = {
  heading: 'Análisis de tu progreso',
  value: 58,
  description: 'CORRECTO + USANDO PISTAS',
  totalAnswered: 420,
  intro: 'En general, respondiste',
  action: 'Crear sesión de preguntas',
}

export const loadingScreen = {
  title: 'RESUMMO',
}

export const qbankOverview = {
  title: 'Banco de preguntas',
  heroTitle: 'Crear sesión de QBank',
  heroDescription:
    'Crea una sesión de QBank personalizada adaptada a tus objetivos de estudio. Cada sesión contribuye a tu análisis de rendimiento y te ayuda a seguir tu preparación para el examen.',
  heroAction: 'Crear una sesión de QBank',
  historyTitle: 'Historial de sesión',
  continueTitle: 'Continúa tu sesión',
  continueAction: 'Continuar',
  sessions: [
    {
      id: 'hydrocephalus-1',
      title: 'Hydrocephalus',
      status: 'aún no visto o saltado',
    },
    {
      id: 'hydrocephalus-2',
      title: 'Hydrocephalus',
      status: 'aún no visto o saltado',
    },
  ],
  sessionMode: {
    mode: 'Modo de estudio',
  },
}

export const qbankNewSession = {
  title: 'Nueva sesión personalizada de estudio',
  secondaryAction: 'Volver al banco',
  primaryAction: 'Crear sesión',
  resetAction: 'Restablecer',
  saveAction: 'Guardar',
}

// Panel izquierdo: Establece los temas de tu sesión
export const qbankTopicRows = [
  {
    id: 'exams',
    label: 'Exámenes',
    chips: [{ label: 'USMLE Step 2 CK' }, { label: '+1', isCount: true }],
    opensModal: 'exams',
  },
  {
    id: 'articles',
    label: 'Artículos',
    chips: [{ label: 'Todos' }],
    opensModal: null,
  },
  {
    id: 'systems',
    label: 'Sistemas',
    chips: [{ label: 'Todos' }],
    opensModal: null,
  },
  {
    id: 'disciplines',
    label: 'Disciplinas',
    chips: [{ label: 'Anesthesiology' }, { label: '+10', isCount: true }],
    opensModal: null,
  },
  {
    id: 'symptoms',
    label: 'Síntomas',
    chips: [{ label: 'Todos' }],
    opensModal: null,
  },
]

// Panel derecho: Criterios de sesión
export const qbankSessionRows = [
  {
    id: 'difficulty',
    label: 'Dificultad',
    chips: [{ label: 'Todos' }],
    opensModal: 'difficulty',
  },
  {
    id: 'status',
    label: 'Estado',
    chips: [{ label: 'Aún no contestado' }],
    opensModal: 'status',
  },
]

export const qbankSessionSwitches = [
  { id: 'marked-only', label: 'Solo preguntas marcadas', defaultOn: false },
  { id: 'images-only', label: 'Preguntas con imágenes solamente', defaultOn: false },
]

// Modal de Exámenes
export const qbankExamOptions = [
  { id: 'usmle-step2', label: 'USMLE Step 2 CK', defaultChecked: true },
  { id: 'supplemental-step2', label: 'Supplemental Step 2', defaultChecked: true },
  { id: 'clinical-shelf', label: 'Clinical Shelf Exams', defaultChecked: true },
  { id: 'usmle-step1', label: 'USMLE Step 1', defaultChecked: false },
  { id: 'usmle-step3', label: 'USMLE Step 3', defaultChecked: false },
  { id: 'family-medicine', label: 'Family Medicine Shelf', defaultChecked: false },
  { id: 'internal-medicine', label: 'Internal Medicine Shelf', defaultChecked: false },
  { id: 'surgery-shelf', label: 'Surgery Shelf', defaultChecked: false },
  { id: 'ob-shelf', label: 'OB/GYN Shelf', defaultChecked: false },
  { id: 'pediatrics-shelf', label: 'Pediatrics Shelf', defaultChecked: false },
]

// Modal de Dificultad
export const qbankDifficultyLevels = [
  { id: 'level-1', level: 1, label: 'Nivel 1', defaultChecked: true },
  { id: 'level-2', level: 2, label: 'Nivel 2', defaultChecked: true },
  { id: 'level-3', level: 3, label: 'Nivel 3', defaultChecked: true },
  { id: 'level-4', level: 4, label: 'Nivel 4', defaultChecked: false },
  { id: 'level-5', level: 5, label: 'Nivel 5', defaultChecked: false },
]

// Modal de Estado
export const qbankStatusOptions = [
  { id: 'unanswered', label: 'Aún no contestado', defaultChecked: true },
  { id: 'correct-hints', label: 'Respondido correctamente utilizando pistas', defaultChecked: true },
  { id: 'incorrect', label: 'Respondido incorrectamente', defaultChecked: true },
  { id: 'correct', label: 'Respondido correctamente', defaultChecked: false },
]

export const qbankStatusModes = [
  { id: 'all-attempts', label: 'Basado en todos los intentos de preguntas anteriores', defaultSelected: false },
  { id: 'latest-attempt', label: 'Basado en el intento de pregunta más reciente', defaultSelected: true },
]

export const studyPlans = {
  title: 'Planes de Estudio',
  heroTitle: '¿Estás por dar un examen pronto?',
  heroDescription:
    'Obtén un plan de estudio personalizado basado en los patrones de los mejores puntajes y el aprendizaje automático, adaptado exactamente a tus necesidades y hábitos.',
  heroAction: 'Crea un plan de estudio',
  continueTitle: 'Continúa tu aprendizaje',
  emptyTitle: 'Aún no has empezado ningún plan de estudio',
  emptyAction: 'Puedes crearlo dando clic aquí',
  discoverTitle: 'Descubre todos los Planes de Estudio',
}

export const library = {
  title: 'Biblioteca',
  ariaLabel: 'Biblioteca Learning',
}
