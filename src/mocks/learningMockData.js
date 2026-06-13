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

export const qbankQuestionSession = {
  title: 'Sesión personalizada de estudio',
  backAction: 'Volver al banco',
  progress: {
    current: 3,
    total: 20,
    label: '3/20',
    percent: 15,
  },
  questionPreview: 'Un cirujano es llamado para...',
  difficultyLabels: ['R', 'R', 'R', 'R', 'R'],
  questionList: Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    number: index + 1,
    title: 'Un cirujano es llamado para...',
    difficulty: index < 3 ? 1 : index < 7 ? 3 : 5,
  })),
  clinicalCase:
    'Un cirujano de guardia para el fin de semana es llamado para realizar una apendicectomía de emergencia a un hombre de 19 años diagnosticado con apendicitis perforada y peritonitis generalizada en el servicio de urgencias. El paciente conservaba la capacidad de tomar decisiones al momento del diagnóstico y un residente de cirugía obtuvo su consentimiento informado para el procedimiento. El cirujano de guardia llega con 30 minutos de retraso y el personal del quirófano no puede comunicarse con él por teléfono para confirmar los instrumentos y materiales necesarios para la intervención. Al llegar, el técnico quirúrgico percibe olor a alcohol en el aliento del cirujano y confirma esta sospecha con el enfermero anestesista presente. Si el cirujano de guardia realiza el procedimiento en su estado actual, ¿cuál de los siguientes principios de atención al paciente se violaría con mayor probabilidad?',
  tipButtons: ['Tip médico', 'Tip médico', 'Información clave'],
  options: [
    {
      id: 'a',
      label: 'A',
      text: 'Beneficencia',
      outcome: 'incorrect',
    },
    {
      id: 'b',
      label: 'B',
      text: 'Justicia',
      outcome: 'incorrect',
    },
    {
      id: 'c',
      label: 'C',
      text: 'Autonomía',
      outcome: 'incorrect',
    },
    {
      id: 'd',
      label: 'D',
      text: 'No maleficencia',
      outcome: 'correct',
    },
  ],
  feedback: {
    neutral: {
      label: 'Sin responder',
      selectedOptionId: null,
    },
    correct: {
      label: 'Respuesta correcta',
      selectedOptionId: 'd',
    },
    incorrect: {
      label: 'Respuesta incorrecta',
      selectedOptionId: 'd',
    },
  },
  explanation: {
    title: 'Explicación mock',
    body:
      'En ética médica, la autonomía se refiere al derecho del paciente o su tutor a decidir si se somete o no a un tratamiento. Este paciente está legalmente emancipado, conservaba plena capacidad de decisión al momento del diagnóstico y un residente obtuvo su consentimiento informado para el procedimiento. Por lo tanto, se respeta el principio de autonomía del paciente.',
  },
  incorrectHint:
    'Un médico que se encuentra bajo los efectos del alcohol o las drogas tiene un mayor riesgo de cometer un error médico que cause lesiones al paciente.',
  reportAction: 'Reportar respuesta',
  explanationsAction: 'Mostrar todas las explicaciones',
  actions: {
    simulateCorrect: 'Simular correcta',
    simulateIncorrect: 'Simular incorrecta',
    next: 'Siguiente pregunta',
    finish: 'Terminar sesion',
  },
}

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

export const studyPlanWizard = {
  title: 'Crea un plan de estudio personalizado',
  step1: {
    introTitle: 'Creamos en base a tus objetivos',
    intro:
      'Y adaptamos el contenido para que coincida con ellos. Asegúrate de que tu información sea correcta porque hay muchos cálculos pasando tras bambalinas.',
    question: '¿Para qué estás estudiando?',
    selectedExam: 'Pediatrics (ABP)',
    rows: [
      { id: 'articles', label: 'Artículos', chip: 'Todos' },
      { id: 'systems', label: 'Sistemas', chip: 'Todos' },
    ],
    statusTitle: 'Incluir preguntas con el siguiente estado:',
    statuses: [
      { id: 'unanswered', label: 'Aún no contestado', checked: true },
      { id: 'correct-hints', label: 'Respondido correctamente utilizando pistas', checked: true },
      { id: 'incorrect', label: 'Respondido incorrectamente', checked: true },
      { id: 'correct', label: 'Respondido correctamente', checked: false },
    ],
    action: 'Continuar',
  },
  step2: {
    introTitle: 'Establece una rutina de estudio',
    intro:
      'Basado en tus objetivos, calculamos que necesitas estudiar 3 horas 30 minutos, 3 días una semana para terminar tu plan antes de la fecha límite establecida.',
    hoursLabel: 'Horas por día',
    hoursValue: '3h 30min',
    helper:
      'Incluye el tiempo dedicado a responder preguntas y revisarlas. Asume un promedio de 20 preguntas por hora.',
    daysTitle: 'Días de Estudio',
    days: [
      { id: 'monday', label: 'Lunes', checked: true },
      { id: 'tuesday', label: 'Martes', checked: true },
      { id: 'wednesday', label: 'Miércoles', checked: true },
      { id: 'thursday', label: 'Jueves', checked: false },
      { id: 'friday', label: 'Viernes', checked: false },
      { id: 'saturday', label: 'Sábado', checked: false },
      { id: 'sunday', label: 'Domingo', checked: false },
    ],
    action: 'Crear plan',
  },
}

export const studyPlanCurrent = {
  backAction: 'Volver a los planes',
  title: 'Step 1 Prep Condensed',
  subtitle: '30 Topics en 30 Days',
  badge: 'Step Prep Condensed',
  welcomeTitle: 'Welcome to the Step 1 Prep Condensed Study Plan!',
  welcomeText:
    'Whether you are making the most of a little extra study time or continuing your regular routine, this plan is the perfect way to learn the most important concepts from our most high-yield Articles for Step 1. The study plan presents one Article and one question session every day for 30 days. Each question session contains five questions. The Article and question session will reinforce one another, making the study plan an efficient and effective journey. Jump in and get started today!',
  days: Array.from({ length: 7 }, (_, index) => ({
    id: `day-${index + 1}`,
    label: `Day ${index + 1}`,
    title: 'Bacteria Overview',
    articleProgress: '0/1 Articulo',
    questionProgress: '0/5 Preguntas',
    percent: 0,
    percentLabel: '0% Completado',
  })),
  elements: {
    articlesTitle: 'Articulos',
    sessionsTitle: 'Sesiones',
    articles: [
      {
        id: 'bacteria-description',
        title: 'Descripcion general de las bacterias',
        readLabel: 'Marcar como leido',
      },
    ],
    sessions: [
      {
        id: 'bacteria-session',
        title: 'High-Yield Step 1 - Day 1 - Bacteria Overview',
        progress: '0/5 Preguntas',
        percent: 0,
        action: 'Continuar',
      },
    ],
  },
}

export const library = {
  title: 'Biblioteca',
  ariaLabel: 'Biblioteca Learning',
}
