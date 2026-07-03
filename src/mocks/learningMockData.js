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
  subtitle: 'Define una meta, organiza tu rutina y retoma cada jornada desde un solo lugar.',
  heroTitle: '¿Estás por dar un examen pronto?',
  heroDescription:
    'Configura un recorrido de estudio según tu objetivo, el tiempo disponible y los días que prefieres dedicar al aprendizaje.',
  heroAction: 'Crea un plan de estudio',
  newPlanAction: 'Crear un plan nuevo',
  continueTitle: 'Continúa tu aprendizaje',
  emptyTitle: 'Aún no has empezado ningún plan de estudio',
  emptyDescription: 'Tu plan se guardará en este dispositivo para que puedas retomarlo después.',
  emptyAction: 'Crear mi primer plan',
  discoverTitle: 'Un recorrido claro para cada jornada',
  discoverDescription: 'El plan reúne lecturas y práctica en una secuencia fácil de retomar.',
  benefits: [
    {
      id: 'goal',
      step: '01',
      title: 'Define tu objetivo',
      description: 'Elige el examen o área que orientará tu preparación.',
    },
    {
      id: 'routine',
      step: '02',
      title: 'Ajusta tu rutina',
      description: 'Selecciona tiempo disponible y días de estudio.',
    },
    {
      id: 'progress',
      step: '03',
      title: 'Avanza por jornadas',
      description: 'Consulta lecturas y sesiones relacionadas en cada día.',
    },
  ],
}

export const studyPlanWizard = {
  title: 'Crea un plan de estudio personalizado',
  planDuration: 'Plan guiado de 7 jornadas',
  step1: {
    introTitle: 'Creamos en base a tus objetivos',
    intro:
      'Selecciona una meta y las preferencias que quieres considerar en tu recorrido de estudio.',
    question: '¿Para qué estás estudiando?',
    objectives: [
      { value: 'pediatrics-abp', label: 'Pediatría (ABP)' },
      { value: 'basic-sciences', label: 'Ciencias básicas' },
      { value: 'internal-medicine', label: 'Medicina interna' },
    ],
    rows: [
      {
        id: 'articles',
        label: 'Artículos',
        options: [
          { value: 'all', label: 'Todos' },
          { value: 'essential', label: 'Esenciales' },
        ],
      },
      {
        id: 'systems',
        label: 'Áreas de estudio',
        options: [
          { value: 'all', label: 'Todas' },
          { value: 'objective', label: 'Relacionadas con mi objetivo' },
        ],
      },
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
      'Elige una rutina que puedas sostener. Podrás consultar tus jornadas y ajustar el ritmo creando un plan nuevo cuando lo necesites.',
    hoursLabel: 'Horas por día',
    defaultMinutes: 210,
    minimumMinutes: 30,
    maximumMinutes: 300,
    minuteStep: 30,
    helper:
      'El tiempo incluye lectura y práctica. Esta configuración se guarda solo en este dispositivo.',
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
  title: 'Plan intensivo de preparación',
  subtitle: 'Plan guiado de 7 jornadas',
  objectiveLabel: 'Ciencias básicas',
  routineLabel: '3 días por semana · 3 h 30 min por jornada',
  sidebarTitle: 'Jornadas del plan',
  articlesTitle: 'Artículos',
  sessionsTitle: 'Sesiones de preguntas',
  welcomeTitle: 'Tu recorrido de estudio está listo',
  welcomeText:
    'Cada jornada combina una lectura breve con una sesión de preguntas relacionada. El avance de lectura se conserva localmente en este dispositivo.',
  days: [
    {
      id: 'day-1',
      label: 'Día 1',
      title: 'Fundamentos de bacteriología',
      articles: [
        {
          id: 'article-bacteria-overview',
          title: 'Descripción general de las bacterias',
          readTime: '8 min de lectura',
          readLabel: 'Marcar como leído',
          path: '/learning/library/article?slug=bacteria-overview',
        },
      ],
      sessions: [
        {
          id: 'session-microbiology-1',
          title: 'Práctica de microbiología',
          completedQuestions: 0,
          totalQuestions: 5,
          percent: 0,
          action: 'Preparar sesión',
          path: '/learning/qbank/new?topic=microbiologia',
        },
      ],
    },
    {
      id: 'day-2',
      label: 'Día 2',
      title: 'Bacterias grampositivas',
      articles: [
        {
          id: 'article-gram-positive-bacteria',
          title: 'Bacterias grampositivas',
          readTime: '10 min de lectura',
          readLabel: 'Marcar como leído',
          path: '/learning/library/article?slug=gram-positive-bacteria',
        },
      ],
      sessions: [
        {
          id: 'session-microbiology-2',
          title: 'Repaso de bacteriología',
          completedQuestions: 0,
          totalQuestions: 5,
          percent: 0,
          action: 'Preparar sesión',
          path: '/learning/qbank/new?topic=microbiologia',
        },
      ],
    },
    {
      id: 'day-3',
      label: 'Día 3',
      title: 'Tuberculosis',
      articles: [
        {
          id: 'article-tuberculosis',
          title: 'Tuberculosis',
          readTime: '12 min de lectura',
          readLabel: 'Marcar como leído',
          path: '/learning/library/article?slug=tuberculosis',
        },
      ],
      sessions: [
        {
          id: 'session-microbiology-3',
          title: 'Práctica de microbiología',
          completedQuestions: 0,
          totalQuestions: 5,
          percent: 0,
          action: 'Preparar sesión',
          path: '/learning/qbank/new?topic=microbiologia',
        },
      ],
    },
    {
      id: 'day-4',
      label: 'Día 4',
      title: 'Síndrome coronario agudo',
      articles: [
        {
          id: 'article-acute-coronary-syndrome',
          title: 'Síndrome coronario agudo',
          readTime: '11 min de lectura',
          readLabel: 'Marcar como leído',
          path: '/learning/library/article?slug=acute-coronary-syndrome',
        },
      ],
      sessions: [
        {
          id: 'session-cardiology-1',
          title: 'Práctica de cardiología',
          completedQuestions: 0,
          totalQuestions: 5,
          percent: 0,
          action: 'Preparar sesión',
          path: '/learning/qbank/new?topic=cardiologia',
        },
      ],
    },
    {
      id: 'day-5',
      label: 'Día 5',
      title: 'Hipertensión arterial',
      articles: [
        {
          id: 'article-arterial-hypertension',
          title: 'Hipertensión arterial',
          readTime: '9 min de lectura',
          readLabel: 'Marcar como leído',
          path: '/learning/library/article?slug=arterial-hypertension',
        },
      ],
      sessions: [
        {
          id: 'session-cardiology-2',
          title: 'Repaso cardiovascular',
          completedQuestions: 0,
          totalQuestions: 5,
          percent: 0,
          action: 'Preparar sesión',
          path: '/learning/qbank/new?topic=cardiologia',
        },
      ],
    },
    {
      id: 'day-6',
      label: 'Día 6',
      title: 'Infecciones respiratorias agudas',
      articles: [
        {
          id: 'article-acute-respiratory-infections',
          title: 'Infecciones respiratorias agudas',
          readTime: '8 min de lectura',
          readLabel: 'Marcar como leído',
          path: '/learning/library/article?slug=acute-respiratory-infections',
        },
      ],
      sessions: [
        {
          id: 'session-pediatrics-1',
          title: 'Práctica de pediatría',
          completedQuestions: 0,
          totalQuestions: 5,
          percent: 0,
          action: 'Preparar sesión',
          path: '/learning/qbank/new?topic=pediatria',
        },
      ],
    },
    {
      id: 'day-7',
      label: 'Día 7',
      title: 'Asma bronquial',
      articles: [
        {
          id: 'article-bronchial-asthma',
          title: 'Asma bronquial',
          readTime: '9 min de lectura',
          readLabel: 'Marcar como leído',
          path: '/learning/library/article?slug=bronchial-asthma',
        },
      ],
      sessions: [
        {
          id: 'session-pediatrics-2',
          title: 'Repaso respiratorio',
          completedQuestions: 0,
          totalQuestions: 5,
          percent: 0,
          action: 'Preparar sesión',
          path: '/learning/qbank/new?topic=pediatria',
        },
      ],
    },
  ],
}

export const library = {
  title: 'Biblioteca médica',
  eyebrow: 'Learning Library',
  ariaLabel: 'Biblioteca Learning',
  subtitle:
    'Explora un repositorio médico organizado por áreas, disciplinas y temas. El contenido sigue siendo temporal para validar la experiencia Learning.',
  searchLabel: 'Buscar en Biblioteca médica',
  searchPlaceholder: 'Buscar carpetas, artículos o temas',
  rootTitle: 'Explora por áreas médicas',
  rootDescription: 'Abre un dominio para avanzar por disciplinas, subcategorías y artículos.',
  domainRailEyebrow: 'Dominios',
  domainRailTitle: 'Áreas médicas',
  domainRailDescription: 'La ubicación principal de cada artículo dentro de Biblioteca.',
  branchPanelTitle: 'Dentro de {branch}',
  branchPanelDescription: 'Selecciona una rama para profundizar en el repositorio.',
  currentBranchEyebrow: 'Rama activa',
  folderSectionTitle: 'Subcategorías',
  folderSectionDescription: 'Carpetas disponibles dentro de esta rama.',
  browseArticlesTitle: 'Artículos disponibles',
  browseArticlesDescription: 'Contenido mock disponible dentro de la ubicación seleccionada.',
  searchResultsTitle: 'Resultados de búsqueda',
  searchResultsDescription: 'Resultados globales de carpetas y artículos en toda la Biblioteca.',
  resultsLabel: '{count} resultados',
  articleCountLabel: '{count} artículos en la rama',
  childCountLabel: '{count} elementos',
  emptyFolderState: 'No hay artículos directos en esta carpeta. Explora sus subcategorías.',
  folderTypeLabel: 'Carpeta',
  articleTypeLabel: 'Artículo',
  openFolderAction: 'Explorar carpeta',
  pendingFolderAction: 'Estructura mock',
  readAction: 'Leer artículo',
  pendingAction: 'Vista mock pendiente',
  emptyTitle: 'No encontramos resultados con esa búsqueda',
  emptyDescription: 'Prueba con otro término para buscar en carpetas, artículos y etiquetas.',
  emptyAction: 'Restablecer búsqueda',
  backToLibrary: 'Volver a Biblioteca',
  breadcrumbRoot: 'Biblioteca',
}

export const libraryNodes = [
  {
    id: 'folder-basic-sciences',
    slug: 'basic-sciences',
    label: 'Ciencias básicas',
    type: 'folder',
    parentId: null,
    description: 'Fundamentos biomédicos organizados por disciplina y tema.',
    path: '/learning/library/browse/basic-sciences',
  },
  {
    id: 'folder-systems',
    slug: 'systems',
    label: 'Sistemas',
    type: 'folder',
    parentId: null,
    description: 'Contenido organizado por sistemas y aparatos del cuerpo humano.',
    path: null,
  },
  {
    id: 'folder-clinical',
    slug: 'clinical',
    label: 'Clínica',
    type: 'folder',
    parentId: null,
    description: 'Especialidades y escenarios para el razonamiento clínico.',
    path: null,
  },
  {
    id: 'folder-microbiology',
    slug: 'microbiology',
    label: 'Microbiología',
    type: 'folder',
    parentId: 'folder-basic-sciences',
    description: 'Microorganismos, mecanismos y conceptos esenciales de repaso.',
    path: '/learning/library/browse/basic-sciences/microbiology',
  },
  {
    id: 'folder-pharmacology',
    slug: 'pharmacology',
    label: 'Farmacología',
    type: 'folder',
    parentId: 'folder-basic-sciences',
    description: 'Principios generales y grupos farmacológicos.',
    path: null,
  },
  {
    id: 'folder-physiology',
    slug: 'physiology',
    label: 'Fisiología',
    type: 'folder',
    parentId: 'folder-basic-sciences',
    description: 'Funciones y mecanismos normales de los sistemas corporales.',
    path: null,
  },
  {
    id: 'folder-bacteriology',
    slug: 'bacteriology',
    label: 'Bacteriología',
    type: 'folder',
    parentId: 'folder-microbiology',
    description: 'Clasificación y conceptos generales sobre bacterias.',
    path: '/learning/library/browse/basic-sciences/microbiology/bacteriology',
  },
  {
    id: 'folder-virology',
    slug: 'virology',
    label: 'Virología',
    type: 'folder',
    parentId: 'folder-microbiology',
    description: 'Principios generales de virus y respuesta del huésped.',
    path: null,
  },
  {
    id: 'folder-parasitology',
    slug: 'parasitology',
    label: 'Parasitología',
    type: 'folder',
    parentId: 'folder-microbiology',
    description: 'Organización inicial de parásitos de importancia médica.',
    path: null,
  },
  {
    id: 'folder-cardiovascular',
    slug: 'cardiovascular',
    label: 'Cardiovascular',
    type: 'folder',
    parentId: 'folder-systems',
    description: 'Temas cardiovasculares frecuentes para aprender y repasar.',
    path: null,
  },
  {
    id: 'folder-respiratory',
    slug: 'respiratory',
    label: 'Respiratorio',
    type: 'folder',
    parentId: 'folder-systems',
    description: 'Vía aérea, infecciones y condiciones respiratorias.',
    path: null,
  },
  {
    id: 'folder-endocrine',
    slug: 'endocrine',
    label: 'Endocrino',
    type: 'folder',
    parentId: 'folder-systems',
    description: 'Conceptos endocrinos y metabólicos de estudio.',
    path: null,
  },
  {
    id: 'folder-pediatrics',
    slug: 'pediatrics',
    label: 'Pediatría',
    type: 'folder',
    parentId: 'folder-clinical',
    description: 'Temas clínicos relevantes para población pediátrica.',
    path: null,
  },
  {
    id: 'folder-gynecology-obstetrics',
    slug: 'gynecology-obstetrics',
    label: 'Ginecología y obstetricia',
    type: 'folder',
    parentId: 'folder-clinical',
    description: 'Salud reproductiva, ginecología y medicina materno-fetal.',
    path: null,
  },
  {
    id: 'folder-internal-medicine',
    slug: 'internal-medicine',
    label: 'Medicina interna',
    type: 'folder',
    parentId: 'folder-clinical',
    description: 'Problemas clínicos frecuentes del adulto.',
    path: null,
  },
  {
    id: 'article-bacteria-overview',
    slug: 'bacteria-overview',
    label: 'Bacteria overview',
    type: 'article',
    parentId: 'folder-bacteriology',
    description: 'Vista mock para validar lectura, índice y conexión visual con preguntas relacionadas.',
    readTime: '8 min',
    tags: ['High-yield', 'Microbiología'],
    badges: ['High-yield', 'Nuevo'],
    path: '/learning/library/articles/bacteria-overview',
  },
  {
    id: 'article-gram-positive-bacteria',
    slug: 'gram-positive-bacteria',
    label: 'Bacterias grampositivas',
    type: 'article',
    parentId: 'folder-bacteriology',
    description: 'Entrada temporal para representar artículos dentro de Bacteriología.',
    readTime: '7 min',
    tags: ['Microbiología', 'Bacteriología'],
    badges: [],
    path: null,
  },
  {
    id: 'article-gram-negative-bacteria',
    slug: 'gram-negative-bacteria',
    label: 'Bacterias gramnegativas',
    type: 'article',
    parentId: 'folder-bacteriology',
    description: 'Entrada temporal para validar un catálogo médico jerárquico.',
    readTime: '7 min',
    tags: ['Microbiología', 'Bacteriología'],
    badges: [],
    path: null,
  },
  {
    id: 'article-acute-coronary-syndrome',
    slug: 'acute-coronary-syndrome',
    label: 'Síndrome coronario agudo',
    type: 'article',
    parentId: 'folder-cardiovascular',
    description: 'Ficha temporal para representar artículos cardiovasculares.',
    readTime: '11 min',
    tags: ['Urgencias', 'Cardio'],
    badges: ['High-yield'],
    path: null,
  },
  {
    id: 'article-fetal-growth-restriction',
    slug: 'fetal-growth-restriction',
    label: 'Restricción del crecimiento fetal',
    type: 'article',
    parentId: 'folder-gynecology-obstetrics',
    description: 'Entrada mock para representar artículos de obstetricia.',
    readTime: '9 min',
    tags: ['Obstetricia', 'Repaso'],
    badges: ['Guardado'],
    path: null,
  },
  {
    id: 'article-tuberculosis',
    slug: 'tuberculosis',
    label: 'Tuberculosis',
    type: 'article',
    parentId: 'folder-respiratory',
    description: 'Artículo placeholder para explorar temas respiratorios e infecciosos.',
    readTime: '10 min',
    tags: ['Respiratorio', 'Infecciosas'],
    badges: ['High-yield'],
    path: null,
  },
  {
    id: 'article-cataracts',
    slug: 'cataracts',
    label: 'Cataratas',
    type: 'article',
    parentId: 'folder-internal-medicine',
    description: 'Recurso mock para representar temas de distintas áreas clínicas.',
    readTime: '6 min',
    tags: ['Clínica', 'Repaso'],
    badges: ['Nuevo'],
    path: null,
  },
  {
    id: 'article-acute-respiratory-infections',
    slug: 'acute-respiratory-infections',
    label: 'Infecciones respiratorias agudas',
    type: 'article',
    parentId: 'folder-pediatrics',
    description: 'Artículo temporal para representar contenido pediátrico.',
    readTime: '7 min',
    tags: ['Pediatría', 'Respiratorio'],
    badges: ['High-yield'],
    path: null,
  },
  {
    id: 'article-diabetes-mellitus-type-2',
    slug: 'diabetes-mellitus-type-2',
    label: 'Diabetes mellitus tipo 2',
    type: 'article',
    parentId: 'folder-endocrine',
    description: 'Placeholder para validar artículos dentro del sistema endocrino.',
    readTime: '12 min',
    tags: ['Endocrino', 'Crónico'],
    badges: [],
    path: null,
  },
  {
    id: 'article-arterial-hypertension',
    slug: 'arterial-hypertension',
    label: 'Hipertensión arterial',
    type: 'article',
    parentId: 'folder-cardiovascular',
    description: 'Entrada mock para representar temas cardiovasculares frecuentes.',
    readTime: '9 min',
    tags: ['Cardio', 'Crónico'],
    badges: ['Guardado'],
    path: null,
  },
  {
    id: 'article-bronchial-asthma',
    slug: 'bronchial-asthma',
    label: 'Asma bronquial',
    type: 'article',
    parentId: 'folder-respiratory',
    description: 'Artículo placeholder para representar temas respiratorios.',
    readTime: '8 min',
    tags: ['Respiratorio', 'Pediatría'],
    badges: ['Nuevo'],
    path: null,
  },
]

export const libraryArticleDetail = {
  nodeId: 'article-bacteria-overview',
  readingTime: '8 min de lectura',
  updatedAt: 'Última actualización mock: junio 2026',
  tags: ['Microbiología', 'High-yield', 'QBank relacionado'],
  initiallySaved: false,
  saveAction: 'Guardar artículo',
  savedAction: 'Artículo guardado',
  indexTitle: 'En este artículo',
  summary:
    'Vista mock para validar cómo se leería un artículo de Biblioteca dentro de Resummo. El contenido médico final queda fuera de alcance.',
  keyPointsTitle: 'Puntos clave',
  keyPoints: [
    'Usa esta pantalla para probar estructura de lectura, no para estudiar contenido real.',
    'El índice lateral prepara artículos largos sin obligar a scroll excesivo.',
    'La conexión con QBank se representa visualmente con preguntas relacionadas mock.',
  ],
  callout: {
    title: 'Nota de aprendizaje',
    body:
      'Cuando exista contenido editorial real, este bloque puede resumir lo que el estudiante debería repasar antes de practicar preguntas.',
  },
  sections: [
    {
      id: 'definition',
      title: 'Definición',
      body:
        'Espacio reservado para una definición editorial breve. En esta fase solo valida jerarquía visual, lectura y navegación interna.',
    },
    {
      id: 'classification',
      title: 'Clasificación',
      body:
        'Bloque placeholder para organizar subtemas y criterios. La clasificación final dependerá del sistema de contenido médico.',
    },
    {
      id: 'diagnosis',
      title: 'Diagnóstico',
      body:
        'Sección mock para representar cómo se vería un apartado clínico sin incluir guías, recomendaciones ni datos médicos reales.',
    },
    {
      id: 'initial-management',
      title: 'Manejo inicial',
      body:
        'Estructura temporal para validar callouts, párrafos y futuros enlaces a preguntas de práctica relacionadas.',
    },
    {
      id: 'complications',
      title: 'Complicaciones',
      body:
        'Cierre placeholder para comprobar consistencia de espaciado y navegación en artículos con varias secciones.',
    },
  ],
  relatedArticlesTitle: 'Artículos relacionados',
  relatedQuestionsTitle: 'Preguntas relacionadas',
  relatedQuestionsDescription:
    'Sesiones mock para validar la conexión visual entre Biblioteca y Banco de Preguntas.',
  qbankAction: 'Practicar preguntas relacionadas',
}

export const relatedLibraryArticles = [
  'article-tuberculosis',
  'article-acute-respiratory-infections',
  'article-bronchial-asthma',
]

export const relatedLibraryQuestions = [
  {
    id: 'bacteria-session-1',
    type: 'QBank mock',
    title: 'Microbiología básica',
    description: '5 preguntas temporales para validar el flujo Biblioteca -> QBank.',
    action: 'Practicar',
  },
  {
    id: 'bacteria-session-2',
    type: 'Repaso mock',
    title: 'Conceptos high-yield',
    description: 'Sesión visual sin lógica real de calificación ni persistencia.',
    action: 'Continuar',
  },
]
