import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminArticleImportPage.css'

function formatReviewStatus(status) {
  if (status === 'APPROVED') return 'Aprobado en la fuente'
  if (status === 'CLINICAL_REVIEW') return 'En revisión clínica'
  if (status === 'RETIRED') return 'Retirado en la fuente'
  return 'Borrador'
}

export default function AdminArticleImportPage({ onNavigate }) {
  const { request } = useAuth()
  const [fileName, setFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const reset = () => {
    setFileName('')
    setFileContent('')
    setPreview(null)
    setResult(null)
    setError('')
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

  return (
    <div className="admin-import-page admin-article-import-page">
      <header className="admin-import-header">
        <h1>Importar artículo desde Markdown</h1>
        <p>
          Exporta una página de Notion como Markdown, valida su frontmatter y crea un borrador
          listo para revisión editorial.
        </p>
      </header>

      <section className="admin-import-contract" aria-labelledby="markdown-contract-heading">
        <div>
          <h2 id="markdown-contract-heading">Contrato de importación</h2>
          <p>
            El archivo debe incluir título, slug, tema, resumen, tiempo de lectura y alcance
            educativo. La importación nunca publica automáticamente.
          </p>
        </div>
        <button
          type="button"
          className="text-link"
          onClick={() => onNavigate('/admin/articles/new')}
        >
          Crear manualmente
        </button>
      </section>

      {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

      {!result ? (
        <section className="admin-import-card">
          <div className="admin-import-file-area">
            <label htmlFor="article-markdown-file">Archivo Markdown</label>
            <input
              id="article-markdown-file"
              type="file"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            <small>{fileName || 'No se ha seleccionado ningún archivo.'}</small>
          </div>

          <div className="admin-import-actions">
            <button
              type="button"
              className="outline-pill-button"
              onClick={handlePreview}
              disabled={!fileContent || isProcessing}
            >
              {isProcessing && !preview ? 'Validando...' : 'Previsualizar y validar'}
            </button>
            {preview?.status === 'VALID' && !preview.duplicate ? (
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? 'Importando...' : 'Crear borrador'}
              </button>
            ) : null}
          </div>

          {preview ? (
            <div className="admin-article-import-preview">
              <header>
                <div>
                  <span className={`admin-preview-status ${preview.status === 'INVALID' ? 'admin-preview-status--invalid' : ''}`}>
                    {preview.status === 'VALID' ? 'Archivo válido' : 'Requiere correcciones'}
                  </span>
                  <h2>{preview.article?.title || 'No se pudo construir la vista previa'}</h2>
                  {preview.article?.summary ? <p>{preview.article.summary}</p> : null}
                </div>
              </header>

              {preview.article ? (
                <dl className="admin-article-import-meta">
                  <div>
                    <dt>Tema</dt>
                    <dd>{preview.article.topicTitle || 'Tema no disponible'}</dd>
                  </div>
                  <div>
                    <dt>Tiempo de lectura</dt>
                    <dd>{preview.article.readTimeMinutes} min</dd>
                  </div>
                  <div>
                    <dt>Estado de entrada</dt>
                    <dd>{formatReviewStatus(preview.article.editorial?.reviewStatus)}</dd>
                  </div>
                  <div>
                    <dt>Resultado en Resummo</dt>
                    <dd>Borrador</dd>
                  </div>
                </dl>
              ) : null}

              {preview.article?.tags?.length ? (
                <div className="library-chip-row">
                  {preview.article.tags.map((tag) => (
                    <span key={tag} className="library-chip">{tag}</span>
                  ))}
                </div>
              ) : null}

              {preview.errors?.length ? (
                <section className="admin-article-import-findings admin-article-import-findings--error">
                  <h3>Errores bloqueantes</h3>
                  <ul>{preview.errors.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
              ) : null}

              {preview.warnings?.length ? (
                <section className="admin-article-import-findings">
                  <h3>Advertencias editoriales</h3>
                  <ul>{preview.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
              ) : null}

              {preview.duplicate ? (
                <div className="app-feedback app-feedback--error">
                  Ya existe un artículo con este identificador. Revisa el artículo existente en vez de duplicarlo.
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="admin-import-card admin-import-success">
          <span className="admin-preview-status">Borrador creado</span>
          <h2>{result.article.title}</h2>
          <p>{result.message}</p>
          <dl className="admin-article-import-meta">
            <div>
              <dt>Tema</dt>
              <dd>{result.article.topicTitle}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>Borrador</dd>
            </div>
          </dl>
          <div className="admin-import-actions">
            <button type="button" className="outline-pill-button" onClick={reset}>
              Importar otro archivo
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => onNavigate(`/admin/articles/review?id=${result.article.id}`)}
            >
              Revisar borrador
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
