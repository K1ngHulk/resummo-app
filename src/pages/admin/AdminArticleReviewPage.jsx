import { useEffect, useMemo, useState } from 'react'
import StructuredArticleContent from '../../components/library/StructuredArticleContent.jsx'
import { useAuth } from '../../context/AuthContext'
import './AdminArticleReviewPage.css'

const pendingContentPattern = /\[FALTA CITA\]|\b(?:TODO|PENDIENTE|placeholder|mock)\b/i

function getHumanStatus(status) {
  if (status === 'DRAFT') return 'Borrador'
  if (status === 'PUBLISHED') return 'Publicado'
  if (status === 'ARCHIVED') return 'Archivado'
  return 'Estado desconocido'
}

function buildEditorialChecklist(formData, topicStatus, contentJson, sourceType, hasCurrentApproval) {
  const structuredHeadings = Array.isArray(contentJson?.headings) ? contentJson.headings : []
  const hasSection = structuredHeadings.some((heading) => Number(heading?.level) >= 2)
    || /^#{2,6}\s+\S.*$/m.test(formData.body)
  return [
    { id: 'title', label: 'Tiene un título claro', passed: Boolean(formData.title.trim()) },
    { id: 'summary', label: 'Tiene un resumen editorial', passed: Boolean(formData.summary.trim()) },
    { id: 'body', label: 'Tiene contenido en el cuerpo', passed: Boolean(formData.body.trim()) },
    { id: 'sections', label: 'Incluye al menos una sección estructurada', passed: hasSection },
    { id: 'read-time', label: 'Tiene un tiempo de lectura positivo', passed: Number(formData.readTimeMinutes) > 0 },
    { id: 'pending', label: 'No contiene citas o pendientes editoriales', passed: !pendingContentPattern.test(formData.body) },
    { id: 'structured-approval', label: 'La importación estructurada tiene aprobación editorial explícita para este snapshot', passed: sourceType !== 'NOTION_EXPORT' || hasCurrentApproval },
    { id: 'topic', label: 'El tema asociado está publicado', passed: topicStatus === 'PUBLISHED' },
  ]
}

export default function AdminArticleReviewPage({ onNavigate, searchParams }) {
  const { request } = useAuth()
  const articleId = searchParams?.get('id')
  const [article, setArticle] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    body: '',
    readTimeMinutes: 1,
    tags: '',
    status: 'DRAFT',
  })
  const [isLoading, setIsLoading] = useState(Boolean(articleId))
  const [isSaving, setIsSaving] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState(articleId ? '' : 'No se encontró un artículo válido para revisar.')
  const [successMsg, setSuccessMsg] = useState('')
  const isStructuredImport = Boolean(article?.contentJson?.blocks?.length)
  const hasCurrentEditorialApproval = article?.sourceType !== 'NOTION_EXPORT' || Boolean(
    article?.editorialApprovedAt
    && article?.editorialApprovedByUserId
    && article?.editorialApprovedSnapshotHash
    && article?.sourceSnapshotHash
    && article.editorialApprovedSnapshotHash === article.sourceSnapshotHash,
  )
  const checklist = useMemo(
    () => buildEditorialChecklist(formData, article?.topic?.status, article?.contentJson, article?.sourceType, hasCurrentEditorialApproval),
    [article?.contentJson, article?.sourceType, article?.topic?.status, formData, hasCurrentEditorialApproval],
  )
  const publicationReady = checklist.every((item) => item.passed)

  useEffect(() => {
    if (!articleId) return

    let isMounted = true
    const fetchArticle = async () => {
      setIsLoading(true)
      setError('')
      try {
        const payload = await request(`/api/admin/content/articles/${articleId}`)
        if (isMounted) {
          setArticle(payload.article)
          setFormData({
            title: payload.article.title || '',
            summary: payload.article.summary || '',
            body: payload.article.body || '',
            readTimeMinutes: payload.article.readTimeMinutes || 1,
            tags: payload.article.tags ? payload.article.tags.join(', ') : '',
            status: payload.article.status || 'DRAFT',
          })
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Error al cargar el artículo')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchArticle()
    return () => {
      isMounted = false
    }
  }, [articleId, request])

  const handleEditorialApproval = async () => {
    if (!article || article.sourceType !== 'NOTION_EXPORT') return
    setIsApproving(true)
    setError('')
    setSuccessMsg('')
    try {
      const payload = await request(`/api/admin/content/articles/${article.id}/editorial-approval`, {
        method: 'POST',
        body: { approved: !hasCurrentEditorialApproval },
      })
      setArticle((current) => current ? {
        ...current,
        status: payload.approval.articleStatus || current.status,
        editorialApprovedAt: payload.approval.approvedAt,
        editorialApprovedByUserId: payload.approval.approvedByUserId,
        editorialApprovedSnapshotHash: payload.approval.snapshotHash,
      } : current)
      if (payload.approval.articleStatus) {
        setFormData((current) => ({ ...current, status: payload.approval.articleStatus }))
      }
      setSuccessMsg(payload.approval.approved
        ? 'Aprobación editorial registrada para el snapshot actual.'
        : 'Aprobación editorial revocada.')
    } catch (approvalError) {
      setError(approvalError.message || 'No se pudo actualizar la aprobación editorial.')
    } finally {
      setIsApproving(false)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: name === 'readTimeMinutes' ? Number(value) : value,
    }))
    setSuccessMsg('')
  }

  const handleSave = async (event, forceStatus = null) => {
    event?.preventDefault()
    const statusToSave = forceStatus || formData.status

    if (statusToSave === 'PUBLISHED' && !publicationReady) {
      setError('Completa el checklist editorial antes de publicar. Puedes guardar o volver el artículo a borrador mientras corriges los pendientes.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccessMsg('')
    try {
      const payload = await request(`/api/admin/content/articles/${articleId}`, {
        method: 'PATCH',
        body: {
          title: formData.title.trim(),
          summary: formData.summary.trim(),
          ...(!isStructuredImport ? { body: formData.body.trim() } : {}),
          readTimeMinutes: Number(formData.readTimeMinutes),
          tags: [...new Set(formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean))],
          status: statusToSave,
        },
      })

      setSuccessMsg(statusToSave === 'PUBLISHED' ? 'Artículo publicado correctamente.' : 'Cambios guardados correctamente.')
      setFormData((current) => ({ ...current, status: statusToSave }))
      setArticle((current) => ({ ...current, ...payload.article, topic: current.topic }))
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  if (!articleId) {
    return (
      <div className="admin-review-page">
        <div className="admin-error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button type="button" className="admin-btn admin-btn--secondary" onClick={() => onNavigate('/admin/articles')}>Volver a artículos</button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div className="admin-review-page"><p className="admin-review-loading">Cargando artículo...</p></div>
  }

  if (error && !article) {
    return (
      <div className="admin-review-page">
        <div className="admin-error-container">
          <h2>Error al cargar</h2>
          <p>{error}</p>
          <button type="button" className="admin-btn admin-btn--secondary" onClick={() => onNavigate('/admin/articles')}>Volver a artículos</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-review-page">
      <header className="admin-review-header">
        <div>
          <h1 className="admin-review-title">Revisión de artículo</h1>
          <p className="admin-review-subtitle">Estado actual: <strong>{getHumanStatus(formData.status)}</strong></p>
        </div>
        <div className="admin-review-header__actions">
          {formData.status === 'PUBLISHED' && article.topic?.status === 'PUBLISHED' ? (
            <button type="button" className="admin-btn admin-btn--library" onClick={() => onNavigate(`/learning/library/article?slug=${article.slug}`)}>
              Ver en Biblioteca
            </button>
          ) : null}
          <button type="button" className="admin-back-btn" onClick={() => onNavigate('/admin/articles')}>&larr; Volver a lista</button>
        </div>
      </header>

      {error ? <div className="app-feedback app-feedback--error admin-review-feedback">{error}</div> : null}
      {successMsg ? <div className="app-feedback app-feedback--success admin-review-feedback">{successMsg}</div> : null}

      <div className="admin-review-content">
        <form onSubmit={handleSave} className="admin-form-section">
          <h2>Contenido principal</h2>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="article-title">Título</label>
            <input id="article-title" type="text" className="admin-form-input" name="title" value={formData.title} onChange={handleChange} required />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="article-summary">Resumen</label>
            <textarea id="article-summary" className="admin-form-textarea admin-form-textarea--summary" name="summary" value={formData.summary} onChange={handleChange} />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="article-body">
              {isStructuredImport ? 'Markdown fuente importado' : 'Cuerpo del artículo'}
            </label>
            <textarea
              id="article-body"
              className="admin-form-textarea admin-form-textarea--body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              readOnly={isStructuredImport}
              aria-readonly={isStructuredImport ? 'true' : undefined}
              required
            />
            <small className="admin-form-help">
              {isStructuredImport
                ? 'El Markdown original se conserva como respaldo y queda en solo lectura para no desincronizarlo de la vista estructurada. La edición estructurada completa se resolverá en el editor final.'
                : <>Usa encabezados como <code>## Definición</code> y separa los párrafos con una línea vacía.</>}
            </small>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="article-read-time">Tiempo de lectura (minutos)</label>
            <input id="article-read-time" type="number" min="1" className="admin-form-input" name="readTimeMinutes" value={formData.readTimeMinutes} onChange={handleChange} required />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="article-tags">Etiquetas (separadas por comas)</label>
            <input id="article-tags" type="text" className="admin-form-input" name="tags" value={formData.tags} onChange={handleChange} placeholder="Ej: pediatría, vacunas, infectología" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="article-topic">Tema asociado</label>
            <input id="article-topic" type="text" className="admin-form-input" value={article.topic?.title || 'Sin tema asignado'} disabled />
          </div>

          <div className="admin-review-actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <div className="admin-review-actions-group">
              {formData.status !== 'DRAFT' ? (
                <button type="button" className="admin-btn admin-btn--secondary" disabled={isSaving} onClick={(event) => handleSave(event, 'DRAFT')}>Volver a borrador</button>
              ) : null}
              {formData.status !== 'ARCHIVED' ? (
                <button type="button" className="admin-btn admin-btn--archive" disabled={isSaving} onClick={(event) => handleSave(event, 'ARCHIVED')}>Archivar</button>
              ) : null}
              {formData.status !== 'PUBLISHED' ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--publish"
                  disabled={isSaving || !publicationReady}
                  title={publicationReady ? 'Publicar artículo' : 'Completa el checklist editorial antes de publicar'}
                  onClick={(event) => handleSave(event, 'PUBLISHED')}
                >
                  Publicar artículo
                </button>
              ) : null}
            </div>
          </div>
        </form>

        <div className="admin-review-side-column">
          {article.contentJson?.blocks?.length ? (
            <section className="admin-structured-preview" aria-labelledby="admin-structured-preview-heading">
              <span>Vista importada</span>
              <h2 id="admin-structured-preview-heading">Contenido estructurado</h2>
              <p>Esta vista conserva tablas, callouts, listas, imágenes y formato del último import. El Markdown original sigue disponible para revisión.</p>
              <div className="admin-structured-preview__content">
                <StructuredArticleContent document={article.contentJson} onNavigate={onNavigate} />
              </div>
            </section>
          ) : null}

          {article.sourceType === 'NOTION_EXPORT' ? (
            <section className={`admin-import-approval ${hasCurrentEditorialApproval ? 'admin-import-approval--approved' : ''}`} aria-label="Aprobación editorial del import">
              <span>Snapshot importado</span>
              <h2>{hasCurrentEditorialApproval ? 'Aprobación editorial registrada' : 'Aprobación editorial pendiente'}</h2>
              <p>
                La aprobación queda vinculada al hash exacto del contenido importado. Si una reimportación cambia el snapshot, debe aprobarse nuevamente.
              </p>
              <button
                type="button"
                className={hasCurrentEditorialApproval ? 'admin-btn admin-btn--secondary' : 'admin-btn admin-btn--primary'}
                disabled={isApproving || isSaving}
                onClick={handleEditorialApproval}
              >
                {isApproving
                  ? 'Actualizando...'
                  : hasCurrentEditorialApproval
                    ? 'Revocar aprobación'
                    : 'Aprobar contenido importado'}
              </button>
            </section>
          ) : null}

          <aside className={`admin-editorial-checklist ${publicationReady ? 'admin-editorial-checklist--ready' : ''}`}>
          <span>Control editorial</span>
          <h2>{publicationReady ? 'Listo para publicar' : 'Revisión pendiente'}</h2>
          <p>{publicationReady ? 'El artículo cumple los requisitos mínimos de publicación.' : 'Puedes guardar el borrador, pero debes resolver estos puntos antes de publicar.'}</p>
          <ul>
            {checklist.map((item) => (
              <li key={item.id} className={item.passed ? 'admin-check-pass' : 'admin-check-fail'}>
                <span aria-hidden="true">{item.passed ? '✓' : '!'}</span>
                {item.label}
              </li>
            ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  )
}
