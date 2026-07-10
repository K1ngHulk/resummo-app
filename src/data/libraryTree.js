export const libraryTopicNodeMap = {
  'pharmacology-basics': 'library-basic-pharmacology',
  'cardiology-basics': 'library-clinical-cardiovascular',
  'diagnostic-tests': 'library-public-diagnostic-tests',
}

export const libraryFolderDefinitions = [
  {
    id: 'library-basic-sciences',
    parentId: null,
    type: 'folder',
    label: 'Ciencias básicas',
    description: 'Fundamentos que explican mecanismos, procesos y principios biomédicos.',
  },
  {
    id: 'library-basic-pharmacology',
    parentId: 'library-basic-sciences',
    type: 'folder',
    label: 'Farmacología',
    description: 'Principios generales sobre cómo actúan y se estudian los medicamentos.',
  },
  {
    id: 'library-clinical-systems',
    parentId: null,
    type: 'folder',
    label: 'Clínica por sistemas',
    description: 'Contenidos introductorios organizados por sistemas del organismo.',
  },
  {
    id: 'library-clinical-cardiovascular',
    parentId: 'library-clinical-systems',
    type: 'folder',
    label: 'Cardiovascular',
    description: 'Fisiología y conceptos cardiovasculares de base.',
  },
  {
    id: 'library-public-preventive',
    parentId: null,
    type: 'folder',
    label: 'Salud pública y preventiva',
    description: 'Epidemiología, prevención e interpretación de información en salud.',
  },
  {
    id: 'library-public-diagnostic-tests',
    parentId: 'library-public-preventive',
    type: 'folder',
    label: 'Pruebas diagnósticas',
    description: 'Conceptos para comprender el rendimiento y la interpretación de pruebas.',
  },
]

const fallbackRoot = {
  id: 'library-other-published',
  parentId: null,
  type: 'folder',
  label: 'Otros temas publicados',
  description: 'Contenido disponible que todavía no tiene una ubicación definitiva en el árbol.',
  isFallback: true,
}

export function getLibraryNode(nodes, nodeId) {
  return nodes.find((node) => node.id === nodeId) ?? null
}

export function getLibraryChildren(nodes, parentId) {
  return nodes.filter((node) => node.parentId === parentId)
}

export function getLibraryPath(nodes, nodeId) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const path = []
  const visited = new Set()
  let currentNode = nodeMap.get(nodeId)

  while (currentNode && !visited.has(currentNode.id)) {
    path.unshift(currentNode)
    visited.add(currentNode.id)
    currentNode = currentNode.parentId ? nodeMap.get(currentNode.parentId) : null
  }

  return path
}

export function getLibraryDescendantArticles(nodes, nodeId) {
  const articles = []
  const pendingFolderIds = [nodeId]

  while (pendingFolderIds.length > 0) {
    const currentFolderId = pendingFolderIds.shift()

    getLibraryChildren(nodes, currentFolderId).forEach((node) => {
      if (node.type === 'article') {
        articles.push(node)
      } else {
        pendingFolderIds.push(node.id)
      }
    })
  }

  return articles
}

export function getLibraryRootNode(nodes, nodeId) {
  return getLibraryPath(nodes, nodeId)[0] ?? null
}

export function getLibraryRootNodes(nodes) {
  return nodes.filter((node) => node.type === 'folder' && node.parentId === null)
}

export function getTopicLibraryPath(topic) {
  if (!topic) return []

  const mappedNodeId = libraryTopicNodeMap[topic.slug]
  if (!mappedNodeId) {
    return [fallbackRoot.label, topic.title]
  }

  return getLibraryPath(libraryFolderDefinitions, mappedNodeId).map((node) => node.label)
}

function createArticleNode(article, topic, parentId) {
  return {
    id: `library-article-${article.id || article.slug}`,
    parentId,
    type: 'article',
    label: article.title,
    description: article.summary,
    article,
    topic,
  }
}

function createFallbackTopicNode(topic) {
  return {
    id: `library-topic-${topic.id || topic.slug}`,
    parentId: fallbackRoot.id,
    type: 'folder',
    label: topic.title,
    description: topic.description || topic.summary,
    topic,
    isFallback: true,
  }
}

export function buildLibraryTree(topics = []) {
  const nodes = libraryFolderDefinitions.map((node) => ({ ...node }))
  const mappedNodeIds = new Set()
  const fallbackTopics = []

  for (const topic of topics) {
    const mappedNodeId = libraryTopicNodeMap[topic.slug]
    const mappedNodeIndex = nodes.findIndex((node) => node.id === mappedNodeId)

    if (mappedNodeIndex >= 0 && !mappedNodeIds.has(mappedNodeId)) {
      mappedNodeIds.add(mappedNodeId)
      nodes[mappedNodeIndex] = {
        ...nodes[mappedNodeIndex],
        description: topic.description || topic.summary || nodes[mappedNodeIndex].description,
        topic,
      }
      const articles = Array.isArray(topic.articles) ? topic.articles : []
      for (const article of articles) {
        nodes.push(createArticleNode(article, topic, mappedNodeId))
      }
    } else {
      fallbackTopics.push(topic)
    }
  }

  if (fallbackTopics.length > 0) {
    nodes.push({ ...fallbackRoot })
    for (const topic of [...fallbackTopics].sort((a, b) => a.title.localeCompare(b.title, 'es'))) {
      const topicNode = createFallbackTopicNode(topic)
      nodes.push(topicNode)
      const articles = Array.isArray(topic.articles) ? topic.articles : []
      for (const article of articles) {
        nodes.push(createArticleNode(article, topic, topicNode.id))
      }
    }
  }

  return nodes.map((node) => {
    if (node.type !== 'folder') return node
    const directChildren = getLibraryChildren(nodes, node.id)
    return {
      ...node,
      folderCount: directChildren.filter((child) => child.type === 'folder').length,
      articleCount: getLibraryDescendantArticles(nodes, node.id).length,
    }
  })
}
