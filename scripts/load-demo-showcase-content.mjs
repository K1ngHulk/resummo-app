import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { prisma } from '../server/lib/prisma.js'
import { firstLearningPack } from './load-first-learning-pack.mjs'

const prohibitedEditorialPattern = /\[FALTA CITA\]|\b(?:TODO|PENDIENTE|placeholder|mock)\b/i
const optionLabels = ['A', 'B', 'C', 'D']

class NeedsHumanError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NeedsHumanError'
  }
}

function mcq({ articleSlug, prompt, explanation, difficulty, hint, options, correctIndex }) {
  return {
    articleSlug,
    prompt,
    explanation,
    difficulty,
    hint,
    type: 'MULTIPLE_CHOICE',
    options: options.map((text, index) => ({
      label: optionLabels[index],
      text,
      isCorrect: index === correctIndex,
      order: index,
    })),
  }
}

function flashcard({ articleSlug, prompt, explanation, difficulty, hint }) {
  return {
    articleSlug,
    prompt,
    explanation,
    difficulty,
    hint,
    type: 'FLASHCARD',
    options: [],
  }
}

export const demoShowcase = [
  {
    topic: firstLearningPack.topic,
    articles: [firstLearningPack.article],
    questions: [
      ...firstLearningPack.questions.map((question) => ({
        ...question,
        articleSlug: firstLearningPack.article.slug,
        type: 'MULTIPLE_CHOICE',
        options: question.options.map((option, order) => ({ ...option, order })),
      })),
      flashcard({
        articleSlug: firstLearningPack.article.slug,
        prompt: '¿Qué pregunta responde la sensibilidad?',
        explanation: 'Entre las personas que tienen la condición, indica qué proporción obtiene un resultado positivo.',
        difficulty: 1,
        hint: 'Parte del grupo en el que la condición está presente.',
      }),
      flashcard({
        articleSlug: firstLearningPack.article.slug,
        prompt: '¿Qué pregunta responde la especificidad?',
        explanation: 'Entre las personas que no tienen la condición, indica qué proporción obtiene un resultado negativo.',
        difficulty: 1,
        hint: 'Parte del grupo en el que la condición está ausente.',
      }),
      flashcard({
        articleSlug: firstLearningPack.article.slug,
        prompt: '¿De qué depende el valor predictivo positivo?',
        explanation: 'Depende del rendimiento de la prueba y de la prevalencia o probabilidad previa en la población evaluada.',
        difficulty: 2,
        hint: 'No es una propiedad fija de la prueba.',
      }),
      flashcard({
        articleSlug: firstLearningPack.article.slug,
        prompt: '¿Qué expresa el valor predictivo negativo?',
        explanation: 'La probabilidad de ausencia de la condición cuando el resultado de la prueba es negativo, dentro de una población concreta.',
        difficulty: 2,
        hint: 'Interpreta un resultado negativo.',
      }),
      flashcard({
        articleSlug: firstLearningPack.article.slug,
        prompt: '¿Para qué se usan las razones de verosimilitud?',
        explanation: 'Para estimar cuánto cambia una probabilidad previa después de conocer el resultado de una prueba.',
        difficulty: 3,
        hint: 'Conectan probabilidad previa y posterior.',
      }),
    ],
  },
  {
    topic: {
      slug: 'cardiology-basics',
      title: 'Cardiología básica',
      summary: 'Fundamentos para reconocer el lenguaje del corazón y ordenar una lectura inicial.',
      description: 'Introducción educativa al ciclo cardíaco, la perfusión y la lectura sistemática del ECG, sin interpretar casos clínicos individuales.',
      color: '#8A342C',
    },
    articles: [
      {
        slug: 'lectura-sistematica-del-ecg',
        title: 'Lectura sistemática del ECG',
        summary: 'Una secuencia introductoria para describir un trazado antes de intentar interpretarlo.',
        readTimeMinutes: 6,
        tags: ['Cardiología', 'ECG', 'Fundamentos'],
        body: `## Objetivo de aprendizaje

Al terminar esta lectura, deberías poder nombrar los pasos básicos para describir un electrocardiograma de forma ordenada.

Este contenido es educativo y no sirve para diagnosticar ni orientar decisiones sobre una persona concreta.

## Verifica el registro

Antes de observar ondas o intervalos, confirma que el trazado sea legible y que incluya la calibración indicada. La velocidad y la amplitud del registro determinan cómo se representan el tiempo y el voltaje sobre el papel o la pantalla.

## Sigue siempre el mismo orden

Una lectura inicial puede revisar frecuencia, regularidad, onda P, intervalo PR, complejo QRS y segmento ST. Mantener el mismo orden reduce omisiones y ayuda a separar descripción de interpretación.

## Relaciona cada parte con la actividad eléctrica

La onda P representa despolarización auricular. El complejo QRS representa despolarización ventricular. La onda T representa repolarización ventricular. Estos nombres describen eventos eléctricos, no la fuerza de contracción.

## Describe antes de concluir

Una práctica segura para aprender es escribir primero lo observable: presencia, duración, dirección y relación entre elementos. La interpretación posterior requiere contexto, calidad del registro y formación clínica supervisada.

## Resumen

Comprueba el registro, usa una secuencia fija y describe los hallazgos antes de intentar clasificarlos.`,
      },
      {
        slug: 'ciclo-cardiaco-conceptos-clave',
        title: 'Ciclo cardíaco: conceptos clave',
        summary: 'Sístole, diástole, llenado y eyección explicados como una secuencia funcional.',
        readTimeMinutes: 5,
        tags: ['Cardiología', 'Fisiología', 'Ciclo cardíaco'],
        body: `## Objetivo de aprendizaje

Al terminar, deberías poder diferenciar sístole y diástole y ubicar el llenado y la eyección dentro del ciclo cardíaco.

## Dos fases que se repiten

La diástole es la fase en la que los ventrículos se relajan y reciben sangre. La sístole es la fase en la que los ventrículos se contraen y eyectan sangre hacia las arterias.

## Las válvulas organizan el flujo

Las válvulas se abren o cierran según los gradientes de presión entre cavidades y grandes vasos. Su función general es favorecer un flujo en una sola dirección durante la secuencia.

## Actividad eléctrica y mecánica

Los eventos eléctricos preceden a los cambios mecánicos. Por eso el ECG registra actividad eléctrica, mientras que la contracción, el flujo y los ruidos cardíacos describen otros aspectos del mismo ciclo.

## Frecuencia y duración

Cuando la frecuencia cardíaca aumenta, el ciclo completo se acorta. La diástole suele reducirse proporcionalmente más que la sístole, un concepto útil para comprender el tiempo disponible para el llenado.

## Resumen

Diástole se asocia con relajación y llenado; sístole, con contracción y eyección. Las válvulas responden a gradientes de presión y coordinan la dirección del flujo.`,
      },
      {
        slug: 'presion-flujo-y-perfusion',
        title: 'Presión, flujo y perfusión',
        summary: 'Relaciones básicas entre gradientes de presión, resistencia y flujo sanguíneo.',
        readTimeMinutes: 5,
        tags: ['Cardiología', 'Fisiología', 'Perfusión'],
        body: `## Objetivo de aprendizaje

Al terminar, deberías poder explicar por qué el flujo depende de una diferencia de presión y de la resistencia del circuito.

## El flujo necesita un gradiente

La sangre se desplaza cuando existe una diferencia de presión entre dos puntos. El gradiente indica la dirección general del movimiento, desde una presión mayor hacia una menor.

## La resistencia modifica el flujo

Para un mismo gradiente, una resistencia mayor reduce el flujo. El calibre de los vasos es uno de los factores que más influye en esa resistencia, junto con la longitud del circuito y las propiedades del fluido.

## Presión no es lo mismo que flujo

La presión describe fuerza por unidad de área; el flujo describe volumen que se mueve por unidad de tiempo. Pueden relacionarse, pero no son sinónimos.

## Perfusión como concepto

Perfusión describe el aporte de sangre a un tejido. Su evaluación real depende de múltiples variables y del contexto, por lo que un valor aislado no basta para tomar decisiones clínicas.

## Resumen

El flujo aumenta con el gradiente de presión y disminuye cuando aumenta la resistencia. Presión, flujo y perfusión son conceptos relacionados, pero distintos.`,
      },
    ],
    questions: [
      mcq({
        articleSlug: 'lectura-sistematica-del-ecg',
        prompt: '¿Qué conviene comprobar antes de analizar ondas e intervalos en un ECG?',
        explanation: 'La legibilidad y la calibración del registro condicionan cómo se representan tiempo y voltaje.',
        difficulty: 1,
        hint: 'Revisa primero cómo fue registrado el trazado.',
        options: ['La calibración y la calidad del registro', 'El diagnóstico final', 'La respuesta a un tratamiento', 'La historia familiar completa'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'lectura-sistematica-del-ecg',
        prompt: '¿Qué evento eléctrico representa de forma general la onda P?',
        explanation: 'La onda P representa la despolarización auricular.',
        difficulty: 1,
        hint: 'Ocurre antes del complejo QRS.',
        options: ['Despolarización auricular', 'Repolarización ventricular', 'Eyección ventricular', 'Cierre de válvulas semilunares'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'lectura-sistematica-del-ecg',
        prompt: '¿Qué representa principalmente el complejo QRS?',
        explanation: 'El complejo QRS representa la despolarización ventricular.',
        difficulty: 1,
        hint: 'Se relaciona con la activación eléctrica de los ventrículos.',
        options: ['Despolarización ventricular', 'Despolarización auricular', 'Llenado pasivo', 'Apertura de la válvula mitral'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'lectura-sistematica-del-ecg',
        prompt: '¿Cuál es una ventaja de usar siempre la misma secuencia al leer un ECG?',
        explanation: 'Una secuencia fija reduce omisiones y ayuda a separar la descripción ordenada de la interpretación.',
        difficulty: 2,
        hint: 'Piensa en consistencia y pasos olvidados.',
        options: ['Reduce omisiones durante la descripción', 'Garantiza un diagnóstico', 'Elimina la necesidad de contexto', 'Sustituye la revisión del registro'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'ciclo-cardiaco-conceptos-clave',
        prompt: '¿En qué fase ocurre principalmente el llenado ventricular?',
        explanation: 'El llenado ventricular ocurre principalmente durante la diástole, cuando los ventrículos están relajados.',
        difficulty: 1,
        hint: 'Es la fase de relajación.',
        options: ['Diástole', 'Sístole', 'Despolarización auricular', 'Repolarización auricular'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'ciclo-cardiaco-conceptos-clave',
        prompt: '¿Qué evento caracteriza de forma general a la sístole ventricular?',
        explanation: 'Durante la sístole los ventrículos se contraen y eyectan sangre hacia las arterias.',
        difficulty: 1,
        hint: 'Es la fase de contracción ventricular.',
        options: ['Eyección de sangre', 'Llenado ventricular principal', 'Despolarización auricular aislada', 'Apertura permanente de todas las válvulas'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'presion-flujo-y-perfusion',
        prompt: 'Si el gradiente de presión se mantiene, ¿qué ocurre con el flujo cuando aumenta la resistencia?',
        explanation: 'Para un gradiente constante, una resistencia mayor se asocia con un flujo menor.',
        difficulty: 2,
        hint: 'Gradiente y resistencia influyen en direcciones opuestas.',
        options: ['Disminuye', 'Aumenta siempre', 'No cambia nunca', 'Se convierte en presión'],
        correctIndex: 0,
      }),
      flashcard({
        articleSlug: 'lectura-sistematica-del-ecg',
        prompt: '¿Qué representa la onda P en un ECG?',
        explanation: 'La despolarización auricular.',
        difficulty: 1,
        hint: 'Aurículas antes que ventrículos.',
      }),
      flashcard({
        articleSlug: 'lectura-sistematica-del-ecg',
        prompt: '¿Qué representa el complejo QRS?',
        explanation: 'La despolarización ventricular.',
        difficulty: 1,
        hint: 'Activación eléctrica de los ventrículos.',
      }),
      flashcard({
        articleSlug: 'ciclo-cardiaco-conceptos-clave',
        prompt: '¿Qué es la sístole ventricular?',
        explanation: 'La fase de contracción y eyección de los ventrículos.',
        difficulty: 1,
        hint: 'Contracción.',
      }),
      flashcard({
        articleSlug: 'ciclo-cardiaco-conceptos-clave',
        prompt: '¿Qué es la diástole ventricular?',
        explanation: 'La fase de relajación y llenado de los ventrículos.',
        difficulty: 1,
        hint: 'Relajación.',
      }),
      flashcard({
        articleSlug: 'lectura-sistematica-del-ecg',
        prompt: '¿Cuál es el primer principio de una lectura sistemática del ECG?',
        explanation: 'Comprobar la calidad y la calibración del registro antes de describir ondas e intervalos.',
        difficulty: 2,
        hint: 'Verifica el registro.',
      }),
    ],
  },
  {
    topic: {
      slug: 'pharmacology-basics',
      title: 'Farmacología básica',
      summary: 'Conceptos esenciales para describir el recorrido y el efecto general de un fármaco.',
      description: 'Introducción educativa a farmacocinética, farmacodinamia y seguridad general, sin dosis ni recomendaciones para pacientes.',
      color: '#6F514A',
    },
    articles: [
      {
        slug: 'farmacocinetica-absorcion-y-distribucion',
        title: 'Farmacocinética: absorción y distribución',
        summary: 'Cómo describir la entrada de un fármaco al organismo y su reparto entre compartimentos.',
        readTimeMinutes: 6,
        tags: ['Farmacología', 'Farmacocinética', 'Fundamentos'],
        body: `## Objetivo de aprendizaje

Al terminar, deberías poder definir absorción, biodisponibilidad y distribución en términos generales.

Este contenido es educativo. No incluye dosis, indicaciones ni recomendaciones para una persona concreta.

## Qué estudia la farmacocinética

La farmacocinética describe lo que el organismo hace con un fármaco a través de absorción, distribución, metabolismo y eliminación.

## Absorción

La absorción es el paso desde el sitio de administración hacia la circulación sistémica. Depende de propiedades del compuesto, la vía utilizada y las barreras biológicas que atraviesa.

## Biodisponibilidad

La biodisponibilidad expresa la fracción de una dosis administrada que llega a la circulación sistémica sin cambios. Es un concepto de exposición, no una medida directa de beneficio clínico.

## Distribución

Una vez en circulación, el fármaco puede repartirse entre plasma y tejidos. La unión a proteínas, el flujo sanguíneo y las propiedades químicas influyen en ese reparto.

## Resumen

Absorción describe la entrada; biodisponibilidad, la fracción que alcanza la circulación; distribución, el reparto posterior entre compartimentos.`,
      },
      {
        slug: 'farmacodinamia-receptores-y-respuesta',
        title: 'Farmacodinamia: receptores y respuesta',
        summary: 'Agonistas, antagonistas, potencia y eficacia como vocabulario básico.',
        readTimeMinutes: 6,
        tags: ['Farmacología', 'Farmacodinamia', 'Receptores'],
        body: `## Objetivo de aprendizaje

Al terminar, deberías poder diferenciar agonista, antagonista, potencia y eficacia.

## Qué estudia la farmacodinamia

La farmacodinamia describe lo que un fármaco hace al organismo y cómo su interacción con una diana se relaciona con una respuesta.

## Agonistas y antagonistas

Un agonista se une a un receptor y favorece su activación. Un antagonista se une sin activarlo y reduce o impide la acción de un agonista en ese receptor.

## Potencia

Potencia compara la cantidad necesaria para alcanzar un efecto definido. Una mayor potencia no significa automáticamente mayor eficacia ni mayor seguridad.

## Eficacia

Eficacia describe el efecto máximo que puede producir un fármaco dentro de un sistema experimental determinado.

## Curvas dosis-respuesta

Estas curvas son herramientas conceptuales para relacionar exposición y efecto. Su uso clínico requiere datos específicos, contexto y supervisión profesional.

## Resumen

Agonista activa; antagonista bloquea la activación. Potencia se refiere a la cantidad para un efecto; eficacia, al efecto máximo posible.`,
      },
      {
        slug: 'seguridad-general-de-medicamentos',
        title: 'Seguridad general de medicamentos',
        summary: 'Ideas introductorias sobre margen terapéutico, interacciones y variabilidad.',
        readTimeMinutes: 5,
        tags: ['Farmacología', 'Seguridad', 'Conceptos básicos'],
        body: `## Objetivo de aprendizaje

Al terminar, deberías poder explicar por qué la respuesta a un medicamento depende de más que su mecanismo de acción.

## Beneficio y riesgo

Cada medicamento puede producir efectos deseados y no deseados. La evaluación de seguridad compara esos efectos en un contexto definido, no en abstracto.

## Margen terapéutico

El margen terapéutico es una forma conceptual de comparar exposiciones asociadas con efectos útiles y exposiciones asociadas con toxicidad. No reemplaza recomendaciones oficiales ni seguimiento profesional.

## Interacciones

Dos sustancias pueden modificar sus efectos al alterar absorción, metabolismo, eliminación o respuesta sobre una misma vía. La relevancia depende de los compuestos y del contexto.

## Variabilidad

Edad, función de órganos, genética, otras sustancias y adherencia pueden cambiar la exposición o la respuesta. Por eso no se deben extrapolar dosis o decisiones desde ejemplos educativos.

## Resumen

La seguridad depende de exposición, respuesta, interacciones y características individuales. Los conceptos ayudan a estudiar; las decisiones requieren información validada y evaluación profesional.`,
      },
    ],
    questions: [
      mcq({
        articleSlug: 'farmacocinetica-absorcion-y-distribucion',
        prompt: '¿Qué describe la farmacocinética?',
        explanation: 'Describe lo que el organismo hace con un fármaco mediante absorción, distribución, metabolismo y eliminación.',
        difficulty: 1,
        hint: 'Piensa en el recorrido del fármaco.',
        options: ['El recorrido del fármaco por el organismo', 'Solo el efecto máximo', 'Una recomendación de dosis', 'El diagnóstico de una enfermedad'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'farmacocinetica-absorcion-y-distribucion',
        prompt: '¿Qué es la absorción de un fármaco?',
        explanation: 'Es el paso desde el sitio de administración hacia la circulación sistémica.',
        difficulty: 1,
        hint: 'Describe la entrada a la circulación.',
        options: ['Paso hacia la circulación sistémica', 'Unión exclusiva a un receptor', 'El efecto máximo posible', 'Eliminación por cualquier vía'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'farmacocinetica-absorcion-y-distribucion',
        prompt: '¿Qué expresa la biodisponibilidad?',
        explanation: 'Expresa la fracción administrada que alcanza la circulación sistémica sin cambios.',
        difficulty: 2,
        hint: 'Se refiere a una fracción de la exposición.',
        options: ['La fracción que llega sin cambios a la circulación', 'La intensidad de todos los efectos adversos', 'La afinidad por cualquier receptor', 'El tiempo total de tratamiento'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'farmacocinetica-absorcion-y-distribucion',
        prompt: '¿Cuál proceso describe el reparto de un fármaco entre plasma y tejidos?',
        explanation: 'La distribución describe el reparto posterior del fármaco entre distintos compartimentos.',
        difficulty: 1,
        hint: 'Ocurre después de alcanzar la circulación.',
        options: ['Distribución', 'Absorción', 'Activación del receptor', 'Diagnóstico farmacológico'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'farmacodinamia-receptores-y-respuesta',
        prompt: '¿Qué caracteriza a un agonista?',
        explanation: 'Un agonista se une a un receptor y favorece su activación.',
        difficulty: 1,
        hint: 'Produce activación del receptor.',
        options: ['Se une y activa un receptor', 'Solo elimina el fármaco', 'Impide toda absorción', 'Mide la biodisponibilidad'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'farmacodinamia-receptores-y-respuesta',
        prompt: '¿Qué diferencia básica existe entre potencia y eficacia?',
        explanation: 'Potencia se relaciona con la cantidad necesaria para un efecto; eficacia, con el efecto máximo alcanzable.',
        difficulty: 2,
        hint: 'Cantidad necesaria frente a efecto máximo.',
        options: ['Potencia compara cantidad y eficacia compara efecto máximo', 'Son términos idénticos', 'Potencia siempre indica seguridad', 'Eficacia describe solo eliminación'],
        correctIndex: 0,
      }),
      mcq({
        articleSlug: 'seguridad-general-de-medicamentos',
        prompt: '¿Por qué una mayor potencia no implica automáticamente mayor seguridad?',
        explanation: 'La potencia describe cantidad para alcanzar un efecto, mientras la seguridad depende del margen entre efectos útiles y dañinos y del contexto.',
        difficulty: 3,
        hint: 'Potencia y margen de seguridad describen dimensiones distintas.',
        options: ['Porque potencia y seguridad son conceptos diferentes', 'Porque todos los fármacos potentes son tóxicos', 'Porque la potencia elimina interacciones', 'Porque seguridad solo depende del color del comprimido'],
        correctIndex: 0,
      }),
      flashcard({
        articleSlug: 'farmacocinetica-absorcion-y-distribucion',
        prompt: '¿Qué estudia la farmacocinética?',
        explanation: 'Lo que el organismo hace con un fármaco: absorción, distribución, metabolismo y eliminación.',
        difficulty: 1,
        hint: 'Recorrido del fármaco.',
      }),
      flashcard({
        articleSlug: 'farmacocinetica-absorcion-y-distribucion',
        prompt: '¿Qué significa absorción en farmacología?',
        explanation: 'El paso del fármaco desde el sitio de administración hacia la circulación sistémica.',
        difficulty: 1,
        hint: 'Entrada a la circulación.',
      }),
      flashcard({
        articleSlug: 'farmacocinetica-absorcion-y-distribucion',
        prompt: '¿Qué significa biodisponibilidad?',
        explanation: 'La fracción administrada que alcanza la circulación sistémica sin cambios.',
        difficulty: 2,
        hint: 'Fracción disponible en circulación.',
      }),
      flashcard({
        articleSlug: 'farmacodinamia-receptores-y-respuesta',
        prompt: '¿Qué hace un agonista sobre un receptor?',
        explanation: 'Se une y favorece la activación del receptor.',
        difficulty: 1,
        hint: 'Activación.',
      }),
      flashcard({
        articleSlug: 'farmacodinamia-receptores-y-respuesta',
        prompt: '¿Qué hace un antagonista sobre un receptor?',
        explanation: 'Se une sin activarlo y reduce o impide la acción de un agonista en ese receptor.',
        difficulty: 1,
        hint: 'Bloqueo de la activación.',
      }),
    ],
  },
]

function normalizeOptional(value) {
  return value ?? null
}

function recordMatches(record, desired, fields) {
  return fields.every((field) => {
    const currentValue = normalizeOptional(record[field])
    const desiredValue = normalizeOptional(desired[field])
    return Array.isArray(desiredValue)
      ? JSON.stringify(currentValue) === JSON.stringify(desiredValue)
      : currentValue === desiredValue
  })
}

function optionsMatch(existingOptions, desiredOptions) {
  if (existingOptions.length !== desiredOptions.length) return false

  return desiredOptions.every((desiredOption, index) => {
    const existingOption = existingOptions[index]
    return existingOption?.label === desiredOption.label
      && existingOption.text === desiredOption.text
      && existingOption.isCorrect === desiredOption.isCorrect
      && existingOption.order === desiredOption.order
  })
}

function validateShowcase() {
  const topicSlugs = new Set()
  const articleSlugs = new Set()
  let articleCount = 0
  let multipleChoiceCount = 0
  let flashcardCount = 0
  const contentFields = []

  for (const pack of demoShowcase) {
    if (topicSlugs.has(pack.topic.slug)) throw new Error(`Topic slug duplicado: ${pack.topic.slug}`)
    topicSlugs.add(pack.topic.slug)
    contentFields.push(pack.topic.title, pack.topic.summary, pack.topic.description)

    const topicPrompts = new Set()
    for (const article of pack.articles) {
      if (articleSlugs.has(article.slug)) throw new Error(`Article slug duplicado: ${article.slug}`)
      articleSlugs.add(article.slug)
      articleCount += 1
      contentFields.push(article.title, article.summary, article.body, ...article.tags)
    }

    const topicArticleSlugs = new Set(pack.articles.map((article) => article.slug))
    for (const question of pack.questions) {
      if (topicPrompts.has(question.prompt)) {
        throw new Error(`Prompt duplicado en ${pack.topic.slug}: ${question.prompt}`)
      }
      topicPrompts.add(question.prompt)
      if (!topicArticleSlugs.has(question.articleSlug)) {
        throw new Error(`Article slug no controlado para la pregunta: ${question.prompt}`)
      }
      if (!Number.isInteger(question.difficulty) || question.difficulty < 1 || question.difficulty > 5) {
        throw new Error(`Difficulty invalida para: ${question.prompt}`)
      }
      if (question.type === 'MULTIPLE_CHOICE') {
        multipleChoiceCount += 1
        if (question.options.length !== 4 || question.options.filter((option) => option.isCorrect).length !== 1) {
          throw new Error(`MCQ invalida: ${question.prompt}`)
        }
      } else if (question.type === 'FLASHCARD') {
        flashcardCount += 1
        if (question.options.length !== 0) throw new Error(`Flashcard con opciones: ${question.prompt}`)
      } else {
        throw new Error(`Tipo de pregunta no soportado: ${question.type}`)
      }
      contentFields.push(
        question.prompt,
        question.explanation,
        question.hint,
        ...question.options.map((option) => option.text),
      )
    }
  }

  if (topicSlugs.size !== 3 || articleCount !== 7 || multipleChoiceCount !== 20 || flashcardCount !== 15) {
    throw new Error(
      `Conteos demo inesperados: ${topicSlugs.size} topics, ${articleCount} articles, ${multipleChoiceCount} MCQs, ${flashcardCount} flashcards`,
    )
  }
  if (contentFields.some((field) => prohibitedEditorialPattern.test(field || ''))) {
    throw new Error('El contenido demo contiene un marcador editorial prohibido')
  }
}

async function preflight() {
  for (const pack of demoShowcase) {
    const existingTopic = await prisma.topic.findUnique({
      where: { slug: pack.topic.slug },
      include: { _count: { select: { articles: true, questions: true } } },
    })

    if (
      existingTopic
      && pack.topic.slug !== firstLearningPack.topic.slug
      && existingTopic.title !== pack.topic.title
      && (existingTopic._count.articles > 0 || existingTopic._count.questions > 0)
    ) {
      throw new NeedsHumanError(`El topic slug '${pack.topic.slug}' ya pertenece a contenido no reconocido`)
    }

    for (const article of pack.articles) {
      const existingArticle = await prisma.article.findUnique({
        where: { slug: article.slug },
        include: { topic: { select: { slug: true } } },
      })
      if (existingArticle && existingArticle.topic.slug !== pack.topic.slug) {
        throw new NeedsHumanError(`El article slug '${article.slug}' pertenece a otro topic`)
      }
    }

    if (!existingTopic) continue

    const expectedArticles = new Map()
    for (const article of pack.articles) {
      const existingArticle = await prisma.article.findUnique({ where: { slug: article.slug } })
      if (existingArticle) expectedArticles.set(article.slug, existingArticle.id)
    }

    for (const question of pack.questions) {
      const matches = await prisma.question.findMany({
        where: { topicId: existingTopic.id, prompt: question.prompt },
        include: {
          options: { orderBy: { order: 'asc' } },
          _count: { select: { answers: true, flashcardProgress: true } },
        },
      })
      if (matches.length > 1) {
        throw new NeedsHumanError(`Hay preguntas duplicadas para: ${question.prompt}`)
      }

      const existingQuestion = matches[0]
      if (!existingQuestion) continue
      if (existingQuestion.type !== question.type) {
        throw new NeedsHumanError(`El prompt controlado tiene otro tipo: ${question.prompt}`)
      }

      const hasHistory = existingQuestion._count.answers > 0 || existingQuestion._count.flashcardProgress > 0
      const expectedArticleId = expectedArticles.get(question.articleSlug)
      const sameContent = expectedArticleId
        && recordMatches(existingQuestion, { ...question, articleId: expectedArticleId }, [
          'articleId',
          'explanation',
          'difficulty',
          'hint',
          'type',
        ])
        && optionsMatch(existingQuestion.options, question.options)

      if (hasHistory && !sameContent) {
        throw new NeedsHumanError(`La pregunta con historial requiere revision manual: ${question.prompt}`)
      }
    }
  }
}

function emptySummary() {
  return {
    topics: { created: 0, updated: 0, unchanged: 0 },
    articles: { created: 0, updated: 0, unchanged: 0 },
    multipleChoice: { created: 0, updated: 0, unchanged: 0 },
    flashcards: { created: 0, updated: 0, unchanged: 0 },
  }
}

function increment(summary, key, action) {
  summary[key][action] += 1
}

export async function loadDemoShowcaseContent() {
  validateShowcase()
  await preflight()

  return prisma.$transaction(async (tx) => {
    const summary = emptySummary()

    for (const pack of demoShowcase) {
      const desiredTopic = { ...pack.topic, status: 'PUBLISHED' }
      let topic = await tx.topic.findUnique({ where: { slug: pack.topic.slug } })
      if (!topic) {
        topic = await tx.topic.create({ data: desiredTopic })
        increment(summary, 'topics', 'created')
      } else if (!recordMatches(topic, desiredTopic, ['title', 'summary', 'description', 'color', 'status'])) {
        topic = await tx.topic.update({ where: { id: topic.id }, data: desiredTopic })
        increment(summary, 'topics', 'updated')
      } else {
        increment(summary, 'topics', 'unchanged')
      }

      const articleIds = new Map()
      for (const article of pack.articles) {
        const desiredArticle = { ...article, topicId: topic.id, status: 'PUBLISHED' }
        let storedArticle = await tx.article.findUnique({ where: { slug: article.slug } })
        if (!storedArticle) {
          storedArticle = await tx.article.create({ data: desiredArticle })
          increment(summary, 'articles', 'created')
        } else if (!recordMatches(storedArticle, desiredArticle, [
          'topicId',
          'title',
          'summary',
          'body',
          'readTimeMinutes',
          'tags',
          'status',
        ])) {
          storedArticle = await tx.article.update({ where: { id: storedArticle.id }, data: desiredArticle })
          increment(summary, 'articles', 'updated')
        } else {
          increment(summary, 'articles', 'unchanged')
        }
        articleIds.set(article.slug, storedArticle.id)
      }

      for (const question of pack.questions) {
        const summaryKey = question.type === 'MULTIPLE_CHOICE' ? 'multipleChoice' : 'flashcards'
        const articleId = articleIds.get(question.articleSlug)
        const matches = await tx.question.findMany({
          where: { topicId: topic.id, prompt: question.prompt },
          include: {
            options: { orderBy: { order: 'asc' } },
            _count: { select: { answers: true, flashcardProgress: true } },
          },
        })

        if (matches.length > 1) {
          throw new NeedsHumanError(`Hay preguntas duplicadas para: ${question.prompt}`)
        }

        const desiredQuestion = {
          topicId: topic.id,
          articleId,
          prompt: question.prompt,
          explanation: question.explanation,
          difficulty: question.difficulty,
          hint: question.hint,
          type: question.type,
          status: 'PUBLISHED',
        }
        const existingQuestion = matches[0]

        if (!existingQuestion) {
          await tx.question.create({
            data: {
              ...desiredQuestion,
              ...(question.options.length > 0
                ? { options: { create: question.options } }
                : {}),
            },
          })
          increment(summary, summaryKey, 'created')
          continue
        }

        const sameQuestion = recordMatches(existingQuestion, desiredQuestion, [
          'topicId',
          'articleId',
          'prompt',
          'explanation',
          'difficulty',
          'hint',
          'type',
          'status',
        ])
        const sameOptions = optionsMatch(existingQuestion.options, question.options)

        if (sameQuestion && sameOptions) {
          increment(summary, summaryKey, 'unchanged')
          continue
        }

        const hasHistory = existingQuestion._count.answers > 0 || existingQuestion._count.flashcardProgress > 0
        const sameHistoricalContent = recordMatches(existingQuestion, desiredQuestion, [
          'topicId',
          'articleId',
          'prompt',
          'explanation',
          'difficulty',
          'hint',
          'type',
        ]) && sameOptions
        if (hasHistory && !sameHistoricalContent) {
          throw new NeedsHumanError(`La pregunta con historial requiere revision manual: ${question.prompt}`)
        }

        await tx.question.update({ where: { id: existingQuestion.id }, data: desiredQuestion })
        if (!sameOptions && existingQuestion._count.answers === 0 && existingQuestion._count.flashcardProgress === 0) {
          await tx.questionOption.deleteMany({ where: { questionId: existingQuestion.id } })
          if (question.options.length > 0) {
            await tx.questionOption.createMany({
              data: question.options.map((option) => ({ questionId: existingQuestion.id, ...option })),
            })
          }
        }
        increment(summary, summaryKey, 'updated')
      }
    }

    return summary
  }, { maxWait: 10_000, timeout: 60_000 })
}

function printSummary(summary) {
  const format = (label, values) => (
    `[demo-showcase] ${label}: ${values.created} created, ${values.updated} updated, ${values.unchanged} unchanged`
  )
  console.log(format('topics', summary.topics))
  console.log(format('articles', summary.articles))
  console.log(format('MCQs', summary.multipleChoice))
  console.log(format('flashcards', summary.flashcards))
  console.log('[demo-showcase] result PASS: controlled content is PUBLISHED')
}

async function runCli() {
  try {
    const summary = await loadDemoShowcaseContent()
    printSummary(summary)
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
      console.error(`[demo-showcase] ${label}: ${error.message}`)
      process.exit(error instanceof NeedsHumanError ? 2 : 1)
    })
}
