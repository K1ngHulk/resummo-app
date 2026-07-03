import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminArticleCreatePage.css'

const pendingContentPattern = /\[FALTA CITA\]|\b(?:TODO|PENDIENTE|placeholder|mock)\b/i

function parseTags(value) {
  return [...new Set(value.split(',').map((tag) => tag.trim()).filter(Boolean))]
}

function analyzeDraft(formData) {
  const sections = formData.body.match(/^##\s+\S.*$/gm) || []
  const tags = parseTags(formData.tags)
  return {
    summaryLength: formData.summary.trim().length,
    sectionCount: sections.length,
    tags,
    hasPendingContent: pendingContentPattern.test(formData.body),
  }
}

export default function AdminArticleCreatePage({ onNavigate }) {
  const { request } = useAuth()
  const [topics, setTopics] = useState([])
  const [isLoadingTopics, setIsLoadingTopics] = useState(true)
  const [topicError, setTopicError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [formData, setFormData] = useState({
    topicId: '',
    slug: '',
    title: '',
    summary: '',
    body: '',
    readTimeMinutes: '',
    tags: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const draftAnalysis = useMemo(() => analyzeDraft(formData), [formData])

  useEffect(() => {
    let isMounted = true

    const fetchTopics = async () => {
      setIsLoadingTopics(true)
      setTopicError('')
      try {
        const payload = await request('/api/admin/content/topics')
        if (isMounted) setTopics(payload.topics || [])
      } catch (err) {
        if (isMounted) setTopicError(err.message || 'Error al cargar temas')
      } finally {
        if (isMounted) setIsLoadingTopics(false)
      }
    }

    fetchTopics()
    return () => {
      isMounted = false
    }
  }, [request])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((current) => ({ ...current, [name]: '' }))
    }
  }

  const validate = () => {
    const errors = {}
    const readTime = Number(formData.readTimeMinutes)

    if (!formData.topicId) errors.topicId = 'Selecciona un tema.'
    if (!formData.slug.trim()) {
      errors.slug = 'El identificador de URL es requerido.'
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim())) {
      errors.slug = 'Usa minúsculas, números y guiones, sin espacios.'
    }
    if (!formData.title.trim()) errors.title = 'El título es requerido.'
    if (!formData.summary.trim()) errors.summary = 'El resumen es requerido.'
    if (!formData.body.trim()) errors.body = 'El cuerpo del artículo es requerido.'
    if (!formData.readTimeMinutes || Number.isNaN(readTime) || readTime <= 0) {
      errors.readTimeMinutes = 'El tiempo de lectura debe ser un número positivo.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const response = await request('/api/admin/content/articles', {
        method: 'POST',
        body: {
          topicId: formData.topicId,
          slug: formData.slug.trim(),
          title: formData.title.trim(),
          summary: formData.summary.trim(),
          body: formData.body.trim(),
          readTimeMinutes: Number(formData.readTimeMinutes),
          tags: draftAnalysis.tags,
        },
      })

      onNavigate(`/admin/articles/review?id=${response.article.id}`)
    } catch (err) {
      setSubmitError(err.message || 'Error al crear el artículo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-article-create-page">
      <header className="admin-article-create-header">
        <button
          type="button"
          className="admin-back-btn"
          onClick={() => onNavigate('/admin/articles')}
          disabled={isSubmitting}
        >
          &larr; Volver a artículos
        </button>
        <h1>Nuevo artículo</h1>
        <p>El artículo se creará como borrador. Solo será visible para estudiantes después de una revisión y publicación explícitas.</p>
      </header>

      <section className="admin-editorial-guide" aria-labelledby="article-format-guide">
        <div>
          <h2 id="article-format-guide">Estructura editorial</h2>
          <p>Separa el cuerpo en secciones usando encabezados como <code>## Definición</code>. Deja una línea vacía entre párrafos.</p>
        </div>
        <strong>No publiques contenido que incluya [FALTA CITA] u otros pendientes editoriales.</strong>
      </section>

      <form className="admin-article-create-form" onSubmit={handleSubmit}>
        {submitError ? <div className="app-feedback app-feedback--error">{submitError}</div> : null}

        <div className="form-group">
          <label htmlFor="topicId">Tema *</label>
          {isLoadingTopics ? (
            <p className="loading-text">Cargando temas...</p>
          ) : topicError ? (
            <p className="error-text">{topicError}</p>
          ) : (
            <select id="topicId" name="topicId" value={formData.topicId} onChange={handleChange} disabled={isSubmitting}>
              <option value="">Selecciona un tema</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>{topic.title}</option>
              ))}
            </select>
          )}
          {formErrors.topicId ? <span className="field-error">{formErrors.topicId}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="title">Título *</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} disabled={isSubmitting} />
          {formErrors.title ? <span className="field-error">{formErrors.title}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="slug">Identificador de URL *</label>
          <input type="text" id="slug" name="slug" value={formData.slug} onChange={handleChange} disabled={isSubmitting} placeholder="ejemplo-de-articulo" />
          <small>Se utiliza en el enlace del artículo y no se muestra como título.</small>
          {formErrors.slug ? <span className="field-error">{formErrors.slug}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="summary">Resumen *</label>
          <textarea id="summary" name="summary" value={formData.summary} onChange={handleChange} disabled={isSubmitting} rows={3} />
          <small>{draftAnalysis.summaryLength} caracteres</small>
          {formErrors.summary ? <span className="field-error">{formErrors.summary}</span> : null}
        </div>

        <div className="form-group">
          <label htmlFor="body">Cuerpo del artículo *</label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleChange}
            disabled={isSubmitting}
            rows={15}
            placeholder={'## Primera sección\nPrimer párrafo del artículo.'}
          />
          {formErrors.body ? <span className="field-error">{formErrors.body}</span> : null}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="readTimeMinutes">Tiempo de lectura (minutos) *</label>
            <input type="number" id="readTimeMinutes" name="readTimeMinutes" value={formData.readTimeMinutes} onChange={handleChange} disabled={isSubmitting} min="1" />
            {formErrors.readTimeMinutes ? <span className="field-error">{formErrors.readTimeMinutes}</span> : null}
          </div>
          <div className="form-group">
            <label htmlFor="tags">Etiquetas (separadas por coma)</label>
            <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleChange} disabled={isSubmitting} placeholder="Ej: pediatría, vacunas" />
          </div>
        </div>

        <section className="admin-draft-summary" aria-label="Resumen del borrador">
          <div><strong>{draftAnalysis.sectionCount}</strong><span>secciones detectadas</span></div>
          <div><strong>{draftAnalysis.tags.length}</strong><span>etiquetas preparadas</span></div>
          <div className={draftAnalysis.hasPendingContent ? 'admin-draft-summary__warning' : ''}>
            <strong>{draftAnalysis.hasPendingContent ? 'Revisar' : 'Sin alertas'}</strong>
            <span>pendientes editoriales</span>
          </div>
        </section>

        <div className="form-actions">
          <button type="button" className="admin-action-btn" onClick={() => onNavigate('/admin/articles')} disabled={isSubmitting}>Cancelar</button>
          <button type="submit" className="admin-action-btn admin-action-btn--publish" disabled={isSubmitting || isLoadingTopics || Boolean(topicError)}>
            {isSubmitting ? 'Guardando...' : 'Crear borrador'}
          </button>
        </div>
      </form>
    </div>
  )
}
