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
