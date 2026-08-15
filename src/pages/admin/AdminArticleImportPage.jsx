import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminArticleImportPage.css'

function formatReviewStatus(status) {
  if (status === 'APPROVED') return 'Aprobado en la fuente'
  if (status === 'CLINICAL_REVIEW') return 'En revisión clínica'
  if (status === 'RETIRED') return 'Retirado en la fuente'
  return 'Borrador'
}

function formatBytes(value) {
  if (!Number.isFinite(value)) return 'No disponible'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toLocaleString('es-PE', { maximumFractionDigits: unitIndex === 0 ? 0 : 1 })} ${units[unitIndex]}`
}

function groupRepeatedMessages(messages = []) {
  const counts = new Map()
  messages.forEach((message) => counts.set(message, (counts.get(message) || 0) + 1))
  return [...counts.entries()].map(([message, count]) => ({ message, count }))
}

function getExistingEditorialTotal(preview) {
  const counts = preview?.existingContent?.counts
  return (counts?.topics || 0) + (counts?.articles || 0) + (counts?.questions || 0)
}

function NotionPreview({ preview }) {
  const headings = preview.document?.headings || []
  const childPages = preview.childPages || []

  return (
    <div className="admin-article-import-preview">
      <header>
        <div>
          <span className="admin-preview-status">Vista previa estructurada</span>
          <h2>{preview.source?.title || 'Página de Notion'}</h2>
          <p>La estructura se normalizó en memoria. Todavía no se creó ni publicó contenido en Resummo.</p>
        </div>
      </header>

      <dl className="admin-article-import-meta">
        <div><dt>Bloques</dt><dd>{preview.stats?.blockCount ?? 0}</dd></div>
        <div><dt>Encabezados</dt><dd>{preview.stats?.headingCount ?? 0}</dd></div>
        <div><dt>Subpáginas</dt><dd>{preview.stats?.childPageCount ?? 0}</dd></div>
        <div><dt>Assets</dt><dd>{preview.stats?.assetCount ?? 0}</dd></div>
        <div><dt>Sin soporte completo</dt><dd>{preview.stats?.unsupportedCount ?? 0}</dd></div>
        <div><dt>Fragmentos indexables</dt><dd>{preview.stats?.searchChunkCount ?? 0}</dd></div>
      </dl>

      {headings.length > 0 ? (
        <section className="admin-notion-outline" aria-labelledby="notion-outline-heading">
          <h3 id="notion-outline-heading">Estructura detectada</h3>
          <ol>
            {headings.slice(0, 24).map((heading) => (
              <li key={heading.blockId} style={{ '--notion-heading-level': heading.level }}>{heading.text || 'Encabezado sin texto'}</li>
            ))}
          </ol>
          {headings.length > 24 ? <small>Se muestran los primeros 24 encabezados.</small> : null}
        </section>
      ) : null}

      {childPages.length > 0 ? (
        <section className="admin-notion-outline" aria-labelledby="notion-child-pages-heading">
          <h3 id="notion-child-pages-heading">Subpáginas detectadas</h3>
          <ul>{childPages.slice(0, 24).map((page) => <li key={page.pageId}>{page.title}</li>)}</ul>
          {childPages.length > 24 ? <small>Se muestran las primeras 24 subpáginas.</small> : null}
        </section>
      ) : null}

      {preview.unsupported?.length ? (
        <section className="admin-article-import-findings">
          <h3>Bloques que requieren decisión</h3>
          <ul>{preview.unsupported.map((item, index) => <li key={`${item.blockType}-${index}`}>{item.blockType}: {item.message}</li>)}</ul>
        </section>
      ) : null}

      {preview.warnings?.length ? (
        <section className="admin-article-import-findings">
          <h3>Advertencias de importación</h3>
          <ul>{preview.warnings.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
        </section>
      ) : null}

      <div className="app-feedback admin-notion-preview-gate">
        La API directa queda disponible como alternativa. Para el MVP de RESUMMO MIR, el flujo principal es el export ZIP.
      </div>
    </div>
  )
}

function NotionExportPreview({ preview, replaceEditorial, onReplaceEditorialChange }) {
  const existing = preview.existingContent
  const counts = existing?.counts
  const canImport = preview.status === 'VALID'
  const existingTotal = getExistingEditorialTotal(preview)
  const groupedWarnings = groupRepeatedMessages(preview.warnings)
  const criticalIssues = (preview.stats?.brokenInternalLinks || 0)
    + (preview.stats?.missingAssets || 0)
    + (preview.stats?.emptyArticles || 0)

  return (
    <div className="admin-article-import-preview admin-article-import-preview--compact">
      <header className="admin-import-validation-head">
        <div>
          <span className={`admin-preview-status ${canImport ? '' : 'admin-preview-status--invalid'}`}>
            {canImport ? 'Listo para importar' : 'Requiere correcciones'}
          </span>
          <h2>{preview.source?.title || 'Export de Notion'}</h2>
          <p>{canImport ? 'Resummo validó la estructura, imágenes y enlaces del ZIP.' : 'Corrige las incidencias críticas antes de importar.'}</p>
        </div>
      </header>

      <dl className="admin-import-key-metrics" aria-label="Resumen de validación">
        <div><dt>Especialidades</dt><dd>{preview.stats?.topics ?? 0}</dd></div>
        <div><dt>Artículos</dt><dd>{preview.stats?.articles ?? 0}</dd></div>
        <div><dt>Imágenes</dt><dd>{preview.stats?.assets ?? 0}</dd></div>
        <div className={criticalIssues > 0 ? 'admin-import-key-metrics__issue' : ''}><dt>Incidencias críticas</dt><dd>{criticalIssues}</dd></div>
      </dl>

      {existingTotal > 0 ? (
        <section className="admin-editorial-replacement">
          <div>
            <h3>Ya existe contenido editorial</h3>
            <p>{counts?.topics ?? 0} temas y {counts?.articles ?? 0} artículos están actualmente en la base local.</p>
          </div>
          <label className="admin-editorial-replacement__control">
            <input
              type="checkbox"
              checked={replaceEditorial}
              onChange={(event) => onReplaceEditorialChange(event.target.checked)}
            />
            <span>
              Confirmo reemplazar el contenido editorial actual.
              <small>Resummo crea un backup antes y conserva los {counts?.users ?? 0} usuarios, autenticación y roles.</small>
            </span>
          </label>
        </section>
      ) : null}

      <details className="admin-import-details">
        <summary>Ver detalles de validación</summary>
        <div className="admin-import-details__body">
          <dl className="admin-article-import-meta">
            <div><dt>Enlaces internos</dt><dd>{preview.stats?.internalLinks ?? 0}</dd></div>
            <div><dt>Enlaces externos</dt><dd>{preview.stats?.externalLinks ?? 0}</dd></div>
            <div><dt>Links rotos</dt><dd>{preview.stats?.brokenInternalLinks ?? 0}</dd></div>
            <div><dt>Assets faltantes</dt><dd>{preview.stats?.missingAssets ?? 0}</dd></div>
            <div><dt>Imágenes huérfanas</dt><dd>{preview.stats?.orphanAssets ?? 0}</dd></div>
            <div><dt>Artículos vacíos</dt><dd>{preview.stats?.emptyArticles ?? 0}</dd></div>
            <div><dt>Tamaño</dt><dd>{formatBytes(preview.stats?.uncompressedBytes)}</dd></div>
          </dl>

          {preview.duplicateTitles?.length ? (
            <section className="admin-article-import-findings">
              <h3>Títulos repetidos resueltos automáticamente</h3>
              <ul>{preview.duplicateTitles.map((item) => <li key={item.title}><strong>{item.title}</strong>: {item.slugs.join(', ')}</li>)}</ul>
            </section>
          ) : null}

          {preview.brokenLinks?.length ? (
            <section className="admin-article-import-findings admin-article-import-findings--error">
              <h3>Enlaces internos sin resolver</h3>
              <ul>{preview.brokenLinks.map((item, index) => <li key={`${item.articleSourceId}-${index}`}>{item.href}</li>)}</ul>
            </section>
          ) : null}

          {preview.missingAssets?.length ? (
            <section className="admin-article-import-findings admin-article-import-findings--error">
              <h3>Assets faltantes</h3>
              <ul>{preview.missingAssets.map((item, index) => <li key={`${item.articleSourceId}-${index}`}>{item.sourcePath}</li>)}</ul>
            </section>
          ) : null}

          {preview.emptyArticles?.length ? (
            <section className="admin-article-import-findings admin-article-import-findings--error">
              <h3>Artículos sin contenido importable</h3>
              <ul>{preview.emptyArticles.map((item) => <li key={item.sourceId}>{item.title}</li>)}</ul>
            </section>
          ) : null}

          {groupedWarnings.length ? (
            <section className="admin-article-import-findings">
              <h3>Advertencias agrupadas</h3>
              <ul>{groupedWarnings.map((item) => <li key={item.message}>{item.count > 1 ? `${item.count}× ` : ''}{item.message}</li>)}</ul>
            </section>
          ) : null}

          {preview.ignoredFiles?.length ? (
            <section className="admin-notion-outline">
              <h3>Archivos ignorados</h3>
              <p>{preview.stats.ignoredFiles} archivos no forman parte del contenido importable.</p>
            </section>
          ) : null}
        </div>
      </details>
    </div>
  )
}

export default function AdminArticleImportPage({ onNavigate }) {
  const { request } = useAuth()
  const [sourceMode, setSourceMode] = useState('notion-export')
  const [zipFile, setZipFile] = useState(null)
  const [zipPreview, setZipPreview] = useState(null)
  const [zipResult, setZipResult] = useState(null)
  const [replaceEditorial, setReplaceEditorial] = useState(false)
  const [notionUrl, setNotionUrl] = useState('')
  const [notionPreview, setNotionPreview] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const resetMarkdown = () => {
    setFileName('')
    setFileContent('')
    setPreview(null)
    setResult(null)
    setError('')
  }

  const resetZip = () => {
    setZipFile(null)
    setZipPreview(null)
    setZipResult(null)
    setReplaceEditorial(false)
    setError('')
  }

  const changeSourceMode = (nextMode) => {
    setSourceMode(nextMode)
    setError('')
    setIsProcessing(false)
  }

  const validateZipFile = async (file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setZipFile(null)
      setZipPreview(null)
      setError('Selecciona el ZIP original exportado desde Notion.')
      return
    }

    setZipFile(file)
    setZipPreview(null)
    setZipResult(null)
    setReplaceEditorial(false)
    setError('')
    setIsProcessing(true)

    try {
      const payload = await request('/api/admin/content/import/notion-export/preview', {
        method: 'POST',
        body: file,
        headers: { 'X-Resummo-File-Name': file.name },
      })
      setZipPreview(payload)
    } catch (previewError) {
      setZipPreview(null)
      setError(previewError.message || 'No se pudo validar el export de Notion.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleZipInput = (event) => validateZipFile(event.target.files?.[0])

  const handleZipDrop = (event) => {
    event.preventDefault()
    validateZipFile(event.dataTransfer.files?.[0])
  }

  const handleZipConfirm = async () => {
    if (!zipFile || zipPreview?.status !== 'VALID') return
    setIsProcessing(true)
    setError('')
    try {
      const payload = await request('/api/admin/content/import/notion-export/confirm', {
        method: 'POST',
        body: zipFile,
        headers: {
          'X-Resummo-File-Name': zipFile.name,
          'X-Resummo-Replace-Editorial': String(replaceEditorial),
        },
      })
      setZipResult(payload)
    } catch (confirmError) {
      setError(confirmError.message || 'No se pudo importar el export de Notion.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setPreview(null)
    setResult(null)
    setError('')
    const reader = new FileReader()
    reader.onload = () => setFileContent(String(reader.result || ''))
    reader.onerror = () => setError('No se pudo leer el archivo seleccionado.')
    reader.readAsText(file)
  }

  const handleNotionPreview = async () => {
    if (!notionUrl.trim()) {
      setError('Pega la URL de una página de Notion primero.')
      return
    }
    setIsProcessing(true)
    setError('')
    setNotionPreview(null)
    try {
      const payload = await request('/api/admin/content/import/notion/preview', {
        method: 'POST',
        body: { url: notionUrl.trim() },
      })
      setNotionPreview(payload)
    } catch (previewError) {
      setError(previewError.message || 'No se pudo obtener la página desde Notion.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePreview = async () => {
    if (!fileContent) {
      setError('Selecciona un archivo Markdown primero.')
      return
    }
    setIsProcessing(true)
    setError('')
    setResult(null)
    try {
      const payload = await request('/api/admin/content/import/articles/preview', {
        method: 'POST',
        body: { format: 'markdown', content: fileContent },
      })
      setPreview(payload)
    } catch (previewError) {
      setError(previewError.message || 'No se pudo validar el artículo.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = async () => {
    if (!preview || preview.status !== 'VALID' || preview.duplicate) return
    setIsProcessing(true)
    setError('')
    try {
      const payload = await request('/api/admin/content/import/articles/confirm', {
        method: 'POST',
        body: { format: 'markdown', content: fileContent },
      })
      setResult(payload)
      setPreview(null)
    } catch (confirmError) {
      setError(confirmError.message || 'No se pudo importar el artículo.')
    } finally {
      setIsProcessing(false)
    }
  }

  const existingEditorialTotal = getExistingEditorialTotal(zipPreview)
  const replacementRequired = existingEditorialTotal > 0

  return (
    <div className="admin-import-page admin-article-import-page">
      <header className="admin-import-header admin-import-header--split">
        <div>
          <h1>Importar contenido</h1>
          <p>Sube la biblioteca completa desde Notion o agrega un artículo individual. Resummo valida el archivo antes de escribir en la base.</p>
        </div>
        <button type="button" className="admin-import-manual-link" onClick={() => onNavigate('/admin/articles/new')}>Nuevo artículo manual</button>
      </header>

      <div className="admin-import-source-tabs" role="tablist" aria-label="Método de importación">
        <button type="button" role="tab" aria-selected={sourceMode === 'notion-export'} className={sourceMode === 'notion-export' ? 'admin-import-source-tab admin-import-source-tab--active' : 'admin-import-source-tab'} onClick={() => changeSourceMode('notion-export')}>Biblioteca desde Notion</button>
        <button type="button" role="tab" aria-selected={sourceMode === 'markdown'} className={sourceMode === 'markdown' ? 'admin-import-source-tab admin-import-source-tab--active' : 'admin-import-source-tab'} onClick={() => changeSourceMode('markdown')}>Artículo Markdown</button>
        <button type="button" role="tab" aria-selected={sourceMode === 'notion-api'} className={sourceMode === 'notion-api' ? 'admin-import-source-tab admin-import-source-tab--active' : 'admin-import-source-tab'} onClick={() => changeSourceMode('notion-api')}>Notion API</button>
      </div>

      <section className="admin-import-guidance" aria-live="polite">
        {sourceMode === 'notion-export' ? (
          <p><strong>Biblioteca completa.</strong> El ZIP reconstruye especialidades, artículos, imágenes y enlaces. Después puedes aprobar y publicar por lote desde Gestión de artículos.</p>
        ) : sourceMode === 'notion-api' ? (
          <p><strong>Alternativa técnica.</strong> Esta opción solo consulta una página compartida con la integración; no sustituye el importador ZIP.</p>
        ) : (
          <p><strong>Un artículo.</strong> El Markdown crea una entrada individual para revisión editorial antes de publicarla.</p>
        )}
      </section>

      {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

      {sourceMode === 'notion-export' ? (
        !zipResult ? (
          <section className="admin-import-card admin-import-card--primary">
            <div className={`admin-zip-dropzone ${zipFile ? 'admin-zip-dropzone--selected' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={handleZipDrop}>
              <input id="notion-export-file" className="visually-hidden" type="file" accept=".zip,application/zip" onChange={handleZipInput} disabled={isProcessing} />
              <div className="admin-zip-dropzone__copy">
                <strong>{zipFile ? zipFile.name : 'Selecciona el ZIP exportado desde Notion'}</strong>
                <span>{zipFile ? 'El archivo se valida automáticamente antes de importar.' : 'También puedes arrastrarlo y soltarlo aquí.'}</span>
              </div>
              <label className="admin-file-picker-button" htmlFor="notion-export-file">
                {zipFile ? 'Cambiar ZIP' : 'Seleccionar ZIP'}
              </label>
            </div>

            {isProcessing && !zipResult ? (
              <div className="admin-import-processing" role="status">
                <span className="admin-import-processing__dot" aria-hidden="true" />
                Validando estructura, imágenes y enlaces…
              </div>
            ) : null}

            {zipPreview ? <NotionExportPreview preview={zipPreview} replaceEditorial={replaceEditorial} onReplaceEditorialChange={setReplaceEditorial} /> : null}

            {zipPreview?.status === 'VALID' ? (
              <div className="admin-import-primary-action">
                <div>
                  <strong>{replacementRequired ? 'La importación reemplazará la biblioteca editorial actual.' : 'La biblioteca está lista para importarse.'}</strong>
                  <span>El contenido entra en revisión editorial; luego puedes aprobarlo y publicarlo desde Gestión de artículos.</span>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleZipConfirm}
                  disabled={isProcessing || (replacementRequired && !replaceEditorial)}
                >
                  {isProcessing ? 'Importando…' : replacementRequired ? 'Crear backup y reemplazar biblioteca' : 'Importar biblioteca'}
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="admin-import-card admin-import-success">
            <span className="admin-preview-status">Importación completada</span>
            <h2>{zipResult.source?.title || 'Biblioteca importada'}</h2>
            <p>El contenido ya está disponible para revisión editorial. Nada se publicó automáticamente.</p>
            <dl className="admin-import-key-metrics">
              <div><dt>Especialidades</dt><dd>{zipResult.validation?.topics ?? zipResult.stats?.topics ?? 0}</dd></div>
              <div><dt>Artículos</dt><dd>{zipResult.validation?.articles ?? zipResult.stats?.articles ?? 0}</dd></div>
              <div><dt>Imágenes</dt><dd>{zipResult.validation?.uniqueAssetFilesReferenced ?? zipResult.assets?.uniqueFiles ?? 0}</dd></div>
              <div><dt>Assets faltantes</dt><dd>{zipResult.validation?.missingAssetFiles ?? 0}</dd></div>
            </dl>
            {zipResult.backup?.fileName ? <p className="admin-import-backup-note">Backup previo: <strong>{zipResult.backup.fileName}</strong></p> : null}
            <div className="admin-import-actions">
              <button type="button" className="outline-pill-button" onClick={() => onNavigate('/learning/library')}>Abrir Biblioteca</button>
              <button type="button" className="primary-button" onClick={() => onNavigate('/admin/articles')}>Gestionar publicación</button>
            </div>
            <button type="button" className="text-link" onClick={resetZip}>Importar otro ZIP</button>
          </section>
        )
      ) : sourceMode === 'notion-api' ? (
        <section className="admin-import-card">
          <div className="admin-notion-url-field">
            <label htmlFor="article-notion-url">URL de la página de Notion</label>
            <input id="article-notion-url" type="url" value={notionUrl} placeholder="https://www.notion.so/..." onChange={(event) => { setNotionUrl(event.target.value); setNotionPreview(null); setError('') }} disabled={isProcessing} autoComplete="off" />
            <small>La página debe estar compartida con la integración de Notion configurada para Resummo.</small>
          </div>
          <div className="admin-import-actions">
            <button type="button" className="outline-pill-button" onClick={handleNotionPreview} disabled={!notionUrl.trim() || isProcessing}>{isProcessing ? 'Obteniendo estructura...' : 'Obtener vista previa'}</button>
          </div>
          {notionPreview ? <NotionPreview preview={notionPreview} /> : null}
        </section>
      ) : !result ? (
        <section className="admin-import-card">
          <div className="admin-import-file-area">
            <label htmlFor="article-markdown-file">Archivo Markdown</label>
            <input id="article-markdown-file" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={handleFileChange} disabled={isProcessing} />
            <small>{fileName || 'No se ha seleccionado ningún archivo.'}</small>
          </div>
          <div className="admin-import-actions">
            <button type="button" className="outline-pill-button" onClick={handlePreview} disabled={!fileContent || isProcessing}>{isProcessing && !preview ? 'Validando...' : 'Previsualizar y validar'}</button>
            {preview?.status === 'VALID' && !preview.duplicate ? <button type="button" className="primary-button" onClick={handleConfirm} disabled={isProcessing}>{isProcessing ? 'Importando...' : 'Crear borrador'}</button> : null}
          </div>
          {preview ? (
            <div className="admin-article-import-preview">
              <header><div><span className={`admin-preview-status ${preview.status === 'INVALID' ? 'admin-preview-status--invalid' : ''}`}>{preview.status === 'VALID' ? 'Archivo válido' : 'Requiere correcciones'}</span><h2>{preview.article?.title || 'No se pudo construir la vista previa'}</h2>{preview.article?.summary ? <p>{preview.article.summary}</p> : null}</div></header>
              {preview.article ? <dl className="admin-article-import-meta"><div><dt>Tema</dt><dd>{preview.article.topicTitle || 'Tema no disponible'}</dd></div><div><dt>Tiempo de lectura</dt><dd>{preview.article.readTimeMinutes} min</dd></div><div><dt>Estado de entrada</dt><dd>{formatReviewStatus(preview.article.editorial?.reviewStatus)}</dd></div><div><dt>Resultado en Resummo</dt><dd>Borrador</dd></div></dl> : null}
              {preview.article?.tags?.length ? <div className="library-chip-row">{preview.article.tags.map((tag) => <span key={tag} className="library-chip">{tag}</span>)}</div> : null}
              {preview.errors?.length ? <section className="admin-article-import-findings admin-article-import-findings--error"><h3>Errores bloqueantes</h3><ul>{preview.errors.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
              {preview.warnings?.length ? <section className="admin-article-import-findings"><h3>Advertencias editoriales</h3><ul>{preview.warnings.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
              {preview.duplicate ? <div className="app-feedback app-feedback--error">Ya existe un artículo con este identificador. Revisa el artículo existente en vez de duplicarlo.</div> : null}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="admin-import-card admin-import-success">
          <span className="admin-preview-status">Borrador creado</span>
          <h2>{result.article.title}</h2>
          <p>{result.message}</p>
          <dl className="admin-article-import-meta"><div><dt>Tema</dt><dd>{result.article.topicTitle}</dd></div><div><dt>Estado</dt><dd>Borrador</dd></div></dl>
          <div className="admin-import-actions">
            <button type="button" className="outline-pill-button" onClick={resetMarkdown}>Importar otro archivo</button>
            <button type="button" className="primary-button" onClick={() => onNavigate(`/admin/articles/review?id=${result.article.id}`)}>Revisar borrador</button>
          </div>
        </section>
      )}
    </div>
  )
}
