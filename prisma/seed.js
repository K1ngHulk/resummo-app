import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { prisma } from '../server/lib/prisma.js'

const topics = [
  {
    slug: 'microbiologia',
    title: 'Microbiologia',
    summary: 'Fundamentos de bacterias, virus y mecanismos infecciosos de alto rendimiento.',
    description: 'Contenido curado para repasar microbiologia medica y practicar preguntas relacionadas.',
    color: '#8A342C',
    articles: [
      {
        slug: 'bacteria-overview',
        title: 'Bacteria overview',
        summary: 'Panorama general de bacterias clinicamente relevantes y su organizacion basica.',
        readTimeMinutes: 8,
        tags: ['High-yield', 'Microbiologia'],
        body: `## Definicion\nLas bacterias son microorganismos procariotas con alta relevancia en medicina.\n\n## Clasificacion\nSe organizan por tincion, morfologia y comportamiento metabolico.\n\n## Diagnostico\nLa correlacion entre cuadro clinico y pruebas microbiologicas guia el estudio.\n\n## Manejo inicial\nEl enfoque depende del contexto clinico y del riesgo del paciente.\n\n## Complicaciones\nUna identificacion tardia puede retrasar el tratamiento adecuado.`
      },
      {
        slug: 'gram-positive-bacteria',
        title: 'Bacterias grampositivas',
        summary: 'Organismos grampositivos frecuentes y pistas de memoria para su repaso.',
        readTimeMinutes: 7,
        tags: ['Microbiologia', 'Bacteriologia'],
        body: `## Panorama\nLas bacterias grampositivas suelen recordarse por sus exotoxinas y patrones de cultivo.\n\n## Claves\nStaphylococcus y Streptococcus siguen siendo grupos de alto valor en examenes.`
      },
      {
        slug: 'tuberculosis',
        title: 'Tuberculosis',
        summary: 'Tema infeccioso clave para relacionar microbiologia con pulmon y salud publica.',
        readTimeMinutes: 10,
        tags: ['Respiratorio', 'Infecciosas'],
        body: `## Panorama\nLa tuberculosis sigue siendo una enfermedad relevante en escenarios clinicos y de examen.\n\n## Repaso\nConviene conectar fisiopatologia, diagnostico y tratamiento en una sola linea mental.`
      }
    ],
    questions: [
      {
        prompt: 'Cual caracteristica define mejor a una bacteria grampositiva?',
        explanation: 'Las bacterias grampositivas se caracterizan por una pared celular gruesa rica en peptidoglicano.',
        difficulty: 2,
        hint: 'Piensa en la composicion de la pared celular.',
        articleSlug: 'gram-positive-bacteria',
        options: [
          { label: 'A', text: 'Membrana externa prominente', isCorrect: false },
          { label: 'B', text: 'Pared rica en peptidoglicano', isCorrect: true },
          { label: 'C', text: 'Ausencia total de pared', isCorrect: false },
          { label: 'D', text: 'Solo ADN bicatenario circular', isCorrect: false }
        ]
      },
      {
        prompt: 'Que hallazgo orienta con mas fuerza a tuberculosis activa?',
        explanation: 'La combinacion de sintomas respiratorios cronicos con perdida de peso y estudios compatibles orienta a tuberculosis activa.',
        difficulty: 3,
        hint: 'Busca el cuadro cronico respiratorio sistemico.',
        articleSlug: 'tuberculosis',
        options: [
          { label: 'A', text: 'Tos cronica con perdida de peso', isCorrect: true },
          { label: 'B', text: 'Dolor lumbar aislado agudo', isCorrect: false },
          { label: 'C', text: 'Otalgia recurrente', isCorrect: false },
          { label: 'D', text: 'Rash localizado pruriginoso', isCorrect: false }
        ]
      },
      {
        prompt: 'Que objetivo tiene una lectura inicial de bacteria overview?',
        explanation: 'La lectura inicial ordena conceptos basicos y prepara al estudiante para preguntas de mayor integracion.',
        difficulty: 1,
        hint: 'Piensa en la funcion de un overview.',
        articleSlug: 'bacteria-overview',
        options: [
          { label: 'A', text: 'Memorizar todos los antibioticos', isCorrect: false },
          { label: 'B', text: 'Ordenar conceptos nucleares del tema', isCorrect: true },
          { label: 'C', text: 'Reemplazar la practica con preguntas', isCorrect: false },
          { label: 'D', text: 'Cerrar el estudio del tema para siempre', isCorrect: false }
        ]
      }
    ]
  },
  {
    slug: 'cardiologia',
    title: 'Cardiologia',
    summary: 'Problemas cardiovasculares frecuentes para continuar estudio y repaso clinico.',
    description: 'Articulos introductorios y preguntas de practica de cardiologia.',
    color: '#C44F45',
    articles: [
      {
        slug: 'acute-coronary-syndrome',
        title: 'Sindrome coronario agudo',
        summary: 'Lectura base para entender presentacion, estratificacion y manejo temprano.',
        readTimeMinutes: 11,
        tags: ['Urgencias', 'Cardio'],
        body: `## Definicion\nEl sindrome coronario agudo integra escenarios de isquemia miocardica aguda.\n\n## Evaluacion\nLa historia, el ECG y los biomarcadores marcan la ruta inicial.\n\n## Manejo\nLa prioridad es reconocer riesgo y actuar con rapidez.`
      },
      {
        slug: 'arterial-hypertension',
        title: 'Hipertension arterial',
        summary: 'Marco general para repasar una condicion prevalente del adulto.',
        readTimeMinutes: 9,
        tags: ['Cardio', 'Cronico'],
        body: `## Panorama\nLa hipertension arterial es uno de los temas mas frecuentes en medicina interna.\n\n## Seguimiento\nLa interpretacion correcta del contexto clinico es clave.`
      }
    ],
    questions: [
      {
        prompt: 'Cual es el estudio inicial que no debe omitirse ante dolor toracico sospechoso?',
        explanation: 'El electrocardiograma es esencial en la valoracion inicial de un dolor toracico sospechoso.',
        difficulty: 2,
        hint: 'Piensa en el estudio rapido y disponible en urgencias.',
        articleSlug: 'acute-coronary-syndrome',
        options: [
          { label: 'A', text: 'Electrocardiograma', isCorrect: true },
          { label: 'B', text: 'Colonoscopia', isCorrect: false },
          { label: 'C', text: 'TAC de craneo', isCorrect: false },
          { label: 'D', text: 'Espirometria', isCorrect: false }
        ]
      },
      {
        prompt: 'Que meta educativa aporta estudiar hipertension arterial en el MVP?',
        explanation: 'Permite practicar integracion de factores de riesgo, diagnostico y seguimiento.',
        difficulty: 1,
        hint: 'Enfocate en la utilidad de repaso del tema.',
        articleSlug: 'arterial-hypertension',
        options: [
          { label: 'A', text: 'Solo memorizar siglas', isCorrect: false },
          { label: 'B', text: 'Integrar riesgo, diagnostico y seguimiento', isCorrect: true },
          { label: 'C', text: 'Eliminar la necesidad de anamnesis', isCorrect: false },
          { label: 'D', text: 'Sustituir guias clinicas completas', isCorrect: false }
        ]
      }
    ]
  },
  {
    slug: 'pediatria',
    title: 'Pediatria',
    summary: 'Contenido inicial para infecciones respiratorias y estudio orientado a poblacion pediatrica.',
    description: 'Material introductorio de pediatria para biblioteca y practica.',
    color: '#A94C3A',
    articles: [
      {
        slug: 'acute-respiratory-infections',
        title: 'Infecciones respiratorias agudas',
        summary: 'Tema pediatrico frecuente para conectar biblioteca y preguntas.',
        readTimeMinutes: 7,
        tags: ['Pediatria', 'Respiratorio'],
        body: `## Panorama\nLas infecciones respiratorias agudas son un motivo comun de consulta.\n\n## Valor de estudio\nSirven para relacionar gravedad, edad y orientacion inicial.`
      },
      {
        slug: 'bronchial-asthma',
        title: 'Asma bronquial',
        summary: 'Conceptos clave para comprender exacerbaciones y control cronico.',
        readTimeMinutes: 8,
        tags: ['Respiratorio', 'Pediatria'],
        body: `## Panorama\nEl asma es prevalente y exige reconocer desencadenantes y respuesta al tratamiento.\n\n## Aprendizaje\nConviene dominar definicion, gravedad y seguimiento.`
      }
    ],
    questions: [
      {
        prompt: 'Que factor debe considerarse siempre al evaluar infecciones respiratorias agudas en pediatria?',
        explanation: 'La edad y el compromiso respiratorio orientan el nivel de riesgo en pediatria.',
        difficulty: 2,
        hint: 'Busca el factor que cambia el riesgo rapidamente.',
        articleSlug: 'acute-respiratory-infections',
        options: [
          { label: 'A', text: 'Color favorito del paciente', isCorrect: false },
          { label: 'B', text: 'Edad y compromiso respiratorio', isCorrect: true },
          { label: 'C', text: 'Lateralidad manual', isCorrect: false },
          { label: 'D', text: 'Grupo sanguineo aislado', isCorrect: false }
        ]
      },
      {
        prompt: 'Que elemento educativo es central al estudiar asma bronquial?',
        explanation: 'Reconocer desencadenantes, gravedad y control es central en el repaso del asma.',
        difficulty: 2,
        hint: 'Piensa en lo que estructura el seguimiento.',
        articleSlug: 'bronchial-asthma',
        options: [
          { label: 'A', text: 'Desencadenantes y control', isCorrect: true },
          { label: 'B', text: 'Solo radiologia avanzada', isCorrect: false },
          { label: 'C', text: 'Cirugia cardiaca', isCorrect: false },
          { label: 'D', text: 'Dermatoscopia', isCorrect: false }
        ]
      }
    ]
  }
]

const demoUser = {
  firstName: 'Mathias',
  lastName: 'Demo',
  email: 'demo@resummo.app',
  password: 'Demo12345'
}

const editorUser = {
  firstName: 'Editor',
  lastName: 'Medico',
  email: 'editor@resummo.app',
  password: 'Editor12345'
}

const adminUser = {
  firstName: 'Admin',
  lastName: 'Resummo',
  email: 'admin@resummo.app',
  password: 'Admin12345'
}

async function seedTopics() {
  for (const topic of topics) {
    const createdTopic = await prisma.topic.create({
      data: {
        slug: topic.slug,
        title: topic.title,
        summary: topic.summary,
        description: topic.description,
        color: topic.color,
      },
    })

    const articleMap = new Map()

    for (const article of topic.articles) {
      const createdArticle = await prisma.article.create({
        data: {
          topicId: createdTopic.id,
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          body: article.body,
          readTimeMinutes: article.readTimeMinutes,
          tags: article.tags,
        },
      })

      articleMap.set(article.slug, createdArticle)
    }

    for (const question of topic.questions) {
      const createdQuestion = await prisma.question.create({
        data: {
          topicId: createdTopic.id,
          articleId: articleMap.get(question.articleSlug)?.id,
          prompt: question.prompt,
          explanation: question.explanation,
          difficulty: question.difficulty,
          hint: question.hint,
        },
      })

      await prisma.questionOption.createMany({
        data: question.options.map((option, index) => ({
          questionId: createdQuestion.id,
          label: option.label,
          text: option.text,
          isCorrect: option.isCorrect,
          order: index,
        })),
      })
    }
  }
}

async function seedDemoActivity(userId) {
  const bacteriaArticle = await prisma.article.findUnique({ where: { slug: 'bacteria-overview' } })
  const cardioArticle = await prisma.article.findUnique({ where: { slug: 'acute-coronary-syndrome' } })
  const cardioTopic = await prisma.topic.findUnique({ where: { slug: 'cardiologia' } })
  const cardioQuestions = await prisma.question.findMany({
    where: { topicId: cardioTopic.id },
    include: { options: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })

  await prisma.userArticleProgress.createMany({
    data: [
      {
        userId,
        articleId: bacteriaArticle.id,
        status: 'IN_PROGRESS',
        progressPercent: 68,
        lastViewedAt: new Date(),
      },
      {
        userId,
        articleId: cardioArticle.id,
        status: 'COMPLETED',
        progressPercent: 100,
        lastViewedAt: new Date(Date.now() - 86400000),
        completedAt: new Date(Date.now() - 86400000),
      },
    ],
  })

  const activeSession = await prisma.studySession.create({
    data: {
      userId,
      topicId: cardioTopic.id,
      totalQuestions: Math.min(3, cardioQuestions.length),
      currentQuestionIndex: 1,
      correctCount: 1,
      incorrectCount: 0,
      questions: {
        create: cardioQuestions.slice(0, 3).map((question, index) => ({
          questionId: question.id,
          order: index,
        })),
      },
    },
    include: {
      questions: true,
    },
  })

  const firstSessionQuestion = activeSession.questions[0]
  const firstQuestion = cardioQuestions[0]
  const correctOption = firstQuestion.options.find((option) => option.isCorrect)

  await prisma.studyAnswer.create({
    data: {
      sessionQuestionId: firstSessionQuestion.id,
      sessionId: activeSession.id,
      questionId: firstQuestion.id,
      selectedOptionId: correctOption.id,
      isCorrect: true,
      usedHint: false,
    },
  })

  await prisma.recentActivity.createMany({
    data: [
      {
        userId,
        articleId: bacteriaArticle.id,
        type: 'ARTICLE_VIEWED',
        title: bacteriaArticle.title,
        path: `/learning/library/article?slug=${bacteriaArticle.slug}`,
      },
      {
        userId,
        articleId: cardioArticle.id,
        type: 'ARTICLE_VIEWED',
        title: cardioArticle.title,
        path: `/learning/library/article?slug=${cardioArticle.slug}`,
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        userId,
        sessionId: activeSession.id,
        type: 'SESSION_CREATED',
        title: `Sesion de ${cardioTopic.title}`,
        path: `/learning/qbank/session?id=${activeSession.id}`,
      },
    ],
  })
}

async function main() {
  await prisma.studyAnswer.deleteMany()
  await prisma.studySessionQuestion.deleteMany()
  await prisma.studySession.deleteMany()
  await prisma.recentActivity.deleteMany()
  await prisma.userArticleProgress.deleteMany()
  await prisma.questionOption.deleteMany()
  await prisma.question.deleteMany()
  await prisma.article.deleteMany()
  await prisma.topic.deleteMany()
  await prisma.user.deleteMany()

  await seedTopics()

  const passwordHash = await bcrypt.hash(demoUser.password, 10)
  const user = await prisma.user.create({
    data: {
      firstName: demoUser.firstName,
      lastName: demoUser.lastName,
      email: demoUser.email,
      passwordHash,
      role: 'STUDENT',
    },
  })

  const editorHash = await bcrypt.hash(editorUser.password, 10)
  await prisma.user.create({
    data: {
      firstName: editorUser.firstName,
      lastName: editorUser.lastName,
      email: editorUser.email,
      passwordHash: editorHash,
      role: 'EDITOR',
    },
  })

  const adminHash = await bcrypt.hash(adminUser.password, 10)
  await prisma.user.create({
    data: {
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      email: adminUser.email,
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })

  await seedDemoActivity(user.id)

  console.log('Seed completado')
  console.log(`Usuario demo: ${demoUser.email} / ${demoUser.password}`)
  console.log(`Usuario editor: ${editorUser.email} / ${editorUser.password}`)
  console.log(`Usuario admin: ${adminUser.email} / ${adminUser.password}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
