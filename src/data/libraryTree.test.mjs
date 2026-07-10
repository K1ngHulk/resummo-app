import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildLibraryTree,
  getLibraryPath,
  getTopicLibraryPath,
} from './libraryTree.js'

const topics = [
  {
    id: 'topic-cardio-id',
    slug: 'cardiology-basics',
    title: 'Cardiología básica',
    summary: 'Fundamentos cardiovasculares.',
    description: 'Contenido introductorio del sistema cardiovascular.',
    articles: [
      {
        id: 'article-ecg-id',
        slug: 'lectura-sistematica-del-ecg',
        title: 'Lectura sistemática del ECG',
        summary: 'Secuencia introductoria para describir un trazado.',
        readTimeMinutes: 6,
        tags: ['Cardiología'],
      },
    ],
  },
  {
    id: 'topic-neuro-id',
    slug: 'neurology-intro',
    title: 'Neurología introductoria',
    summary: 'Topic todavía no clasificado.',
    description: 'Contenido publicado pendiente de ubicación definitiva.',
    articles: [
      {
        id: 'article-neuro-id',
        slug: 'exploracion-neurologica-basica',
        title: 'Exploración neurológica básica',
        summary: 'Principios educativos generales.',
        readTimeMinutes: 5,
        tags: ['Neurología'],
      },
    ],
  },
]

test('maps a known backend topic into a human Library path', () => {
  const nodes = buildLibraryTree(topics)
  const topicNode = nodes.find((node) => node.topic?.slug === 'cardiology-basics')

  assert.ok(topicNode)
  assert.equal(topicNode.label, 'Cardiovascular')
  assert.deepEqual(
    getLibraryPath(nodes, topicNode.id).map((node) => node.label),
    ['Clínica por sistemas', 'Cardiovascular'],
  )
})

test('places real published articles below the mapped topic folder', () => {
  const nodes = buildLibraryTree(topics)
  const articleNode = nodes.find((node) => node.article?.slug === 'lectura-sistematica-del-ecg')

  assert.ok(articleNode)
  assert.equal(articleNode.label, 'Lectura sistemática del ECG')
  assert.deepEqual(
    getLibraryPath(nodes, articleNode.id).map((node) => node.label),
    ['Clínica por sistemas', 'Cardiovascular', 'Lectura sistemática del ECG'],
  )
})

test('keeps an unmapped topic visible under Otros temas publicados', () => {
  const nodes = buildLibraryTree(topics)
  const fallbackTopic = nodes.find((node) => node.topic?.slug === 'neurology-intro')

  assert.ok(fallbackTopic)
  assert.equal(fallbackTopic.label, 'Neurología introductoria')
  assert.deepEqual(
    getLibraryPath(nodes, fallbackTopic.id).map((node) => node.label),
    ['Otros temas publicados', 'Neurología introductoria'],
  )
})

test('builds article-header paths without exposing mapped or fallback slugs', () => {
  assert.deepEqual(
    getTopicLibraryPath(topics[0]),
    ['Clínica por sistemas', 'Cardiovascular'],
  )
  assert.deepEqual(
    getTopicLibraryPath(topics[1]),
    ['Otros temas publicados', 'Neurología introductoria'],
  )
})
