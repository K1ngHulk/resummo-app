import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { prisma } from '../server/lib/prisma.js'

const prohibitedEditorialPattern = /\[FALTA CITA\]|\b(?:TODO|PENDIENTE|placeholder|mock)\b/i

class NeedsHumanError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NeedsHumanError'
  }
}

export const firstLearningPack = {
  topic: {
    slug: 'diagnostic-tests',
    title: 'Pruebas diagnósticas',
    summary: 'Conceptos esenciales para interpretar resultados de pruebas en medicina.',
    description: 'Tema introductorio para aprender sensibilidad, especificidad, valores predictivos y razones de verosimilitud sin convertirlos en decisiones clínicas personalizadas.',
    color: '#8A342C',
  },
  article: {
    slug: 'sensibilidad-especificidad-valores-predictivos',
    title: 'Sensibilidad, especificidad y valores predictivos',
    summary: 'Guía breve para interpretar pruebas diagnósticas usando una tabla 2x2 y evitando errores frecuentes.',
    readTimeMinutes: 6,
    tags: ['Epidemiología clínica', 'Pruebas diagnósticas', 'High-yield'],
    body: `## Objetivo de aprendizaje

Al terminar esta lectura, deberías poder distinguir sensibilidad, especificidad, valor predictivo positivo, valor predictivo negativo y razones de verosimilitud usando una tabla 2x2.

Este contenido es educativo. No reemplaza guías clínicas, protocolos institucionales ni juicio médico.

## La tabla 2x2

Toda prueba diagnóstica binaria puede resumirse comparando el resultado de la prueba con el estado real o estándar de referencia.

- Verdadero positivo: la prueba sale positiva y la condición está presente.
- Falso positivo: la prueba sale positiva, pero la condición no está presente.
- Verdadero negativo: la prueba sale negativa y la condición no está presente.
- Falso negativo: la prueba sale negativa, pero la condición está presente.

Esta tabla permite calcular medidas distintas. El error común es tratarlas como si todas respondieran la misma pregunta.

## Sensibilidad

La sensibilidad responde:

¿Qué proporción de personas que realmente tienen la condición son detectadas por la prueba?

Una prueba muy sensible tiende a producir pocos falsos negativos. Por eso se usa como idea general para reducir el riesgo de pasar por alto una condición cuando el resultado es negativo. Aun así, ninguna prueba debe interpretarse fuera del contexto clínico o del escenario de uso.

## Especificidad

La especificidad responde:

¿Qué proporción de personas que realmente no tienen la condición son correctamente clasificadas como negativas?

Una prueba muy específica tiende a producir pocos falsos positivos. Por eso se usa como idea general para apoyar confirmación cuando el resultado es positivo. Igual que la sensibilidad, debe interpretarse junto con el contexto, la calidad del estudio y la población evaluada.

## Valores predictivos

El valor predictivo positivo responde:

Si la prueba salió positiva, ¿qué probabilidad hay de que la condición esté realmente presente?

El valor predictivo negativo responde:

Si la prueba salió negativa, ¿qué probabilidad hay de que la condición esté realmente ausente?

A diferencia de sensibilidad y especificidad, los valores predictivos cambian cuando cambia la prevalencia o probabilidad previa en la población evaluada.

## Prevalencia y probabilidad previa

Una misma prueba puede tener valores predictivos diferentes en grupos distintos.

Cuando la condición es poco frecuente, incluso una prueba aparentemente buena puede generar una proporción importante de falsos positivos. Cuando la condición es muy frecuente o la sospecha clínica es alta, un resultado negativo puede no ser suficiente para descartar.

Por eso conviene pensar en probabilidad previa antes de interpretar un resultado.

## Razones de verosimilitud

Las razones de verosimilitud ayudan a estimar cuánto cambia la probabilidad después del resultado de una prueba.

- LR+ resume cuánto aumenta la probabilidad cuando la prueba es positiva.
- LR- resume cuánto disminuye la probabilidad cuando la prueba es negativa.

Son útiles porque conectan sensibilidad, especificidad y probabilidad previa en una sola lógica de razonamiento diagnóstico.

## Errores frecuentes

- Creer que sensibilidad alta confirma una condición.
- Creer que especificidad alta descarta una condición.
- Ignorar la prevalencia al interpretar valores predictivos.
- Usar una prueba sin considerar la población en la que fue validada.
- Confundir utilidad educativa de una prueba con una indicación clínica real.

## Resumen high-yield

Sensibilidad y especificidad describen propiedades de la prueba frente a un estándar de referencia.

Los valores predictivos describen lo que significa un resultado para una población concreta.

Las razones de verosimilitud ayudan a pasar de probabilidad previa a probabilidad posterior.

La interpretación de pruebas no debe separarse del contexto clínico, la calidad de la evidencia y el objetivo de la evaluación.

## Fuentes de referencia sugeridas

- Altman DG, Bland JM. Diagnostic tests 1: sensitivity and specificity. BMJ. 1994.
- Altman DG, Bland JM. Diagnostic tests 2: predictive values. BMJ. 1994.
- Deeks JJ, Altman DG. Diagnostic tests 4: likelihood ratios. BMJ. 2004.
- Cochrane Handbook for Systematic Reviews of Diagnostic Test Accuracy.`,
  },
  questions: [
    {
      prompt: '¿Qué mide directamente la sensibilidad de una prueba diagnóstica?',
      explanation: 'La sensibilidad mide la proporción de personas con la condición que son correctamente identificadas como positivas por la prueba.',
      difficulty: 1,
      hint: 'Piensa solo en el grupo que realmente tiene la condición.',
      options: [
        { label: 'A', text: 'La proporción de enfermos correctamente detectados', isCorrect: true },
        { label: 'B', text: 'La proporción de sanos correctamente descartados', isCorrect: false },
        { label: 'C', text: 'La probabilidad de enfermedad después de un resultado positivo', isCorrect: false },
        { label: 'D', text: 'La prevalencia de la condición en la población', isCorrect: false },
      ],
    },
    {
      prompt: '¿Qué mide directamente la especificidad?',
      explanation: 'La especificidad mide la proporción de personas sin la condición que son correctamente clasificadas como negativas.',
      difficulty: 1,
      hint: 'Piensa en el grupo que realmente no tiene la condición.',
      options: [
        { label: 'A', text: 'La proporción de sanos correctamente clasificados como negativos', isCorrect: true },
        { label: 'B', text: 'La proporción de enfermos correctamente detectados', isCorrect: false },
        { label: 'C', text: 'La probabilidad de enfermedad tras un resultado negativo', isCorrect: false },
        { label: 'D', text: 'La frecuencia de la condición en la población', isCorrect: false },
      ],
    },
    {
      prompt: '¿Cuál medida cambia de forma importante cuando cambia la prevalencia de la condición?',
      explanation: 'Los valores predictivos dependen de la prevalencia o probabilidad previa de la condición en la población evaluada.',
      difficulty: 2,
      hint: 'Busca la medida que interpreta el significado de un resultado en una población concreta.',
      options: [
        { label: 'A', text: 'Valor predictivo positivo', isCorrect: true },
        { label: 'B', text: 'Sensibilidad', isCorrect: false },
        { label: 'C', text: 'Especificidad', isCorrect: false },
        { label: 'D', text: 'Orden de las opciones en la tabla', isCorrect: false },
      ],
    },
    {
      prompt: 'Una prueba con alta sensibilidad suele ser más útil para reducir qué tipo de error?',
      explanation: 'Una alta sensibilidad reduce falsos negativos, aunque el resultado siempre debe interpretarse con el contexto clínico.',
      difficulty: 2,
      hint: 'Recuerda que sensibilidad mira a quienes realmente tienen la condición.',
      options: [
        { label: 'A', text: 'Falsos negativos', isCorrect: true },
        { label: 'B', text: 'Falsos positivos', isCorrect: false },
        { label: 'C', text: 'Verdaderos negativos', isCorrect: false },
        { label: 'D', text: 'Errores de digitación', isCorrect: false },
      ],
    },
    {
      prompt: '¿Qué error conceptual es más importante evitar al interpretar valores predictivos?',
      explanation: 'Los valores predictivos no son propiedades fijas de la prueba; dependen de la prevalencia o probabilidad previa en la población evaluada.',
      difficulty: 3,
      hint: 'Piensa en qué cambia entre una población de bajo riesgo y una de alto riesgo.',
      options: [
        { label: 'A', text: 'Asumir que no dependen de la prevalencia', isCorrect: true },
        { label: 'B', text: 'Calcularlos desde una tabla 2x2', isCorrect: false },
        { label: 'C', text: 'Relacionarlos con resultados positivos o negativos', isCorrect: false },
        { label: 'D', text: 'Usarlos solo como apoyo educativo', isCorrect: false },
      ],
    },
    {
      prompt: '¿Para qué sirven las razones de verosimilitud en razonamiento diagnóstico?',
      explanation: 'Las razones de verosimilitud ayudan a estimar cuánto cambia la probabilidad de una condición después de conocer el resultado de una prueba.',
      difficulty: 3,
      hint: 'Piensa en el paso de probabilidad previa a probabilidad posterior.',
      options: [
        { label: 'A', text: 'Para estimar el cambio desde probabilidad previa hacia probabilidad posterior', isCorrect: true },
        { label: 'B', text: 'Para reemplazar por completo la historia clínica', isCorrect: false },
        { label: 'C', text: 'Para publicar automáticamente una pregunta', isCorrect: false },
        { label: 'D', text: 'Para eliminar la necesidad de validar la prueba', isCorrect: false },
      ],
    },
  ],
}

function optionsMatch(existingOptions, desiredOptions) {
  if (existingOptions.length !== desiredOptions.length) return false

  return desiredOptions.every((desiredOption, index) => {
    const existingOption = existingOptions[index]
    return existingOption?.label === desiredOption.label
      && existingOption.text === desiredOption.text
      && existingOption.isCorrect === desiredOption.isCorrect
  })
}

function validatePack() {
  if (firstLearningPack.questions.length !== 6) {
    throw new Error('El pack debe contener exactamente 6 preguntas')
  }

  const prompts = new Set()
  const contentFields = [
    firstLearningPack.topic.title,
    firstLearningPack.topic.summary,
    firstLearningPack.topic.description,
    firstLearningPack.article.title,
    firstLearningPack.article.summary,
    firstLearningPack.article.body,
  ]

  for (const question of firstLearningPack.questions) {
    if (!question.prompt.trim() || prompts.has(question.prompt)) {
      throw new Error('Los enunciados deben ser únicos y no vacíos')
    }
    prompts.add(question.prompt)

    if (!question.explanation.trim()) throw new Error('Cada pregunta requiere explicación')
    if (!Number.isInteger(question.difficulty) || question.difficulty < 1 || question.difficulty > 5) {
      throw new Error('Cada dificultad debe ser un entero entre 1 y 5')
    }
    if (question.options.length < 2 || question.options.length > 5) {
      throw new Error('Cada pregunta debe tener entre 2 y 5 opciones')
    }
    if (question.options.some((option) => !option.label.trim() || !option.text.trim())) {
      throw new Error('Todas las opciones deben tener label y texto')
    }
    if (new Set(question.options.map((option) => option.label)).size !== question.options.length) {
      throw new Error('Los labels de opciones deben ser únicos por pregunta')
    }
    if (question.options.filter((option) => option.isCorrect).length !== 1) {
      throw new Error('Cada pregunta debe tener exactamente una opción correcta')
    }

    contentFields.push(
      question.prompt,
      question.explanation,
      question.hint,
      ...question.options.map((option) => option.text),
    )
  }

  if (contentFields.some((field) => prohibitedEditorialPattern.test(field || ''))) {
    throw new Error('El contenido cargable contiene un marcador editorial prohibido')
  }
}

async function preflight() {
  const existingTopic = await prisma.topic.findUnique({ where: { slug: firstLearningPack.topic.slug } })
  const existingArticle = await prisma.article.findUnique({ where: { slug: firstLearningPack.article.slug } })

  if (existingArticle && (!existingTopic || existingArticle.topicId !== existingTopic.id)) {
    throw new NeedsHumanError('El slug del artículo ya pertenece a otro tema')
  }

  if (!existingTopic) return

  for (const desiredQuestion of firstLearningPack.questions) {
    const matches = await prisma.question.findMany({
      where: { topicId: existingTopic.id, prompt: desiredQuestion.prompt },
      include: {
        options: { orderBy: { order: 'asc' } },
        _count: { select: { answers: true } },
      },
    })

    if (matches.length > 1) {
      throw new NeedsHumanError(`Hay preguntas duplicadas para el enunciado: ${desiredQuestion.prompt}`)
    }

    const existingQuestion = matches[0]
    if (
      existingQuestion
      && existingQuestion._count.answers > 0
      && !optionsMatch(existingQuestion.options, desiredQuestion.options)
    ) {
      throw new NeedsHumanError(`La pregunta con historial requiere revisión manual: ${desiredQuestion.prompt}`)
    }
  }
}

export async function loadFirstLearningPack() {
  validatePack()
  await preflight()

  return prisma.$transaction(async (tx) => {
    const topicBefore = await tx.topic.findUnique({ where: { slug: firstLearningPack.topic.slug } })
    const topic = await tx.topic.upsert({
      where: { slug: firstLearningPack.topic.slug },
      update: { ...firstLearningPack.topic, status: 'DRAFT' },
      create: { ...firstLearningPack.topic, status: 'DRAFT' },
    })

    const articleBefore = await tx.article.findUnique({ where: { slug: firstLearningPack.article.slug } })
    if (articleBefore && articleBefore.topicId !== topic.id) {
      throw new NeedsHumanError('El artículo controlado pertenece a otro tema')
    }
    const article = await tx.article.upsert({
      where: { slug: firstLearningPack.article.slug },
      update: { ...firstLearningPack.article, topicId: topic.id, status: 'DRAFT' },
      create: { ...firstLearningPack.article, topicId: topic.id, status: 'DRAFT' },
    })

    let createdQuestions = 0
    let updatedQuestions = 0
    let preservedOptionSets = 0

    for (const desiredQuestion of firstLearningPack.questions) {
      const matches = await tx.question.findMany({
        where: { topicId: topic.id, prompt: desiredQuestion.prompt },
        include: {
          options: { orderBy: { order: 'asc' } },
          _count: { select: { answers: true } },
        },
      })

      if (matches.length > 1) {
        throw new NeedsHumanError(`Hay preguntas duplicadas para el enunciado: ${desiredQuestion.prompt}`)
      }

      const existingQuestion = matches[0]
      if (!existingQuestion) {
        await tx.question.create({
          data: {
            topicId: topic.id,
            articleId: article.id,
            prompt: desiredQuestion.prompt,
            explanation: desiredQuestion.explanation,
            difficulty: desiredQuestion.difficulty,
            hint: desiredQuestion.hint,
            status: 'DRAFT',
            options: {
              create: desiredQuestion.options.map((option, order) => ({ ...option, order })),
            },
          },
        })
        createdQuestions += 1
        continue
      }

      const sameOptions = optionsMatch(existingQuestion.options, desiredQuestion.options)
      if (existingQuestion._count.answers > 0 && !sameOptions) {
        throw new NeedsHumanError(`La pregunta con historial requiere revisión manual: ${desiredQuestion.prompt}`)
      }

      await tx.question.update({
        where: { id: existingQuestion.id },
        data: {
          articleId: article.id,
          explanation: desiredQuestion.explanation,
          difficulty: desiredQuestion.difficulty,
          hint: desiredQuestion.hint,
          status: 'DRAFT',
        },
      })

      if (existingQuestion._count.answers === 0) {
        await tx.questionOption.deleteMany({ where: { questionId: existingQuestion.id } })
        await tx.questionOption.createMany({
          data: desiredQuestion.options.map((option, order) => ({
            questionId: existingQuestion.id,
            ...option,
            order,
          })),
        })
      } else {
        preservedOptionSets += 1
      }
      updatedQuestions += 1
    }

    const finalQuestions = await tx.question.findMany({
      where: {
        topicId: topic.id,
        prompt: { in: firstLearningPack.questions.map((question) => question.prompt) },
      },
      include: { options: { orderBy: { order: 'asc' } } },
    })

    if (finalQuestions.length !== firstLearningPack.questions.length) {
      throw new Error('La verificación final no encontró las 6 preguntas controladas')
    }
    for (const question of finalQuestions) {
      if (question.status !== 'DRAFT' || question.articleId !== article.id) {
        throw new Error('La verificación final detectó una pregunta fuera de DRAFT o sin el artículo esperado')
      }
      if (question.options.length < 2 || question.options.length > 5) {
        throw new Error('La verificación final detectó un número inválido de opciones')
      }
      if (question.options.filter((option) => option.isCorrect).length !== 1) {
        throw new Error('La verificación final detectó una cantidad inválida de respuestas correctas')
      }
    }
    if (topic.status !== 'DRAFT' || article.status !== 'DRAFT') {
      throw new Error('La verificación final detectó contenido publicado automáticamente')
    }

    return {
      topicAction: topicBefore ? 'actualizado' : 'creado',
      articleAction: articleBefore ? 'actualizado' : 'creado',
      createdQuestions,
      updatedQuestions,
      preservedOptionSets,
    }
  })
}

async function runCli() {
  try {
    const result = await loadFirstLearningPack()
    console.log(`[learning-pack] topic ${result.topicAction}: Pruebas diagnósticas -> DRAFT`)
    console.log(`[learning-pack] article ${result.articleAction}: Sensibilidad, especificidad y valores predictivos -> DRAFT`)
    console.log(`[learning-pack] questions: ${result.createdQuestions} creadas, ${result.updatedQuestions} actualizadas -> DRAFT`)
    if (result.preservedOptionSets > 0) {
      console.log(`[learning-pack] opciones preservadas por historial: ${result.preservedOptionSets}`)
    }
    console.log('[learning-pack] result PASS: 1 topic, 1 article y 6 questions en DRAFT')
  } finally {
    await prisma.$disconnect()
  }
}

const currentFile = fileURLToPath(import.meta.url)
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : ''
const isDirectRun = invokedFile && resolve(currentFile).toLowerCase() === invokedFile.toLowerCase()

if (isDirectRun) {
  runCli()
    .then(() => process.exit(0))
    .catch((error) => {
      const label = error instanceof NeedsHumanError ? 'NEEDS_HUMAN' : 'FAIL'
      console.error(`[learning-pack] ${label}: ${error.message}`)
      process.exit(error instanceof NeedsHumanError ? 2 : 1)
    })
}
