import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminArticleCreatePage.css'

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
    tags: ''
  })

  const [formErrors, setFormErrors] = useState({})

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
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const errors = {}
    const readTime = Number(formData.readTimeMinutes)

    if (!formData.topicId) errors.topicId = 'El tema es requerido'
    if (!formData.slug.trim()) errors.slug = 'El slug es requerido'
    if (!formData.title.trim()) errors.title = 'El título es requerido'
    if (!formData.summary.trim()) errors.summary = 'El resumen es requerido'
    if (!formData.body.trim()) errors.body = 'El cuerpo es requerido'

    if (!formData.readTimeMinutes || Number.isNaN(readTime) || readTime <= 0) {
      errors.readTimeMinutes = 'El tiempo de lectura debe ser un número positivo'
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
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      const payload = {
        topicId: formData.topicId,
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        body: formData.body.trim(),
        readTimeMinutes: Number(formData.readTimeMinutes),
        tags: tagsArray
      }

      const response = await request('/api/admin/content/articles', {
        method: 'POST',
        body: payload
      })

      if (onNavigate) {
        onNavigate(`/admin/articles/review?id=${response.article.id}`)
      }
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
          className="admin-back-btn"
          onClick={() => onNavigate && onNavigate('/admin/articles')}
          disabled={isSubmitting}
        >
          &larr; Volver a Artículos
        </button>
        <h1>Nuevo Artículo</h1>
      </header>

      <form className="admin-article-create-form" onSubmit={handleSubmit}>
        {submitError && <div className="app-feedback app-feedback--error">{submitError}</div>}

        <div className="form-group">
          <label htmlFor="topicId">Tema *</label>
          {isLoadingTopics ? (
            <p className="loading-text">Cargando temas...</p>
          ) : topicError ? (
            <p className="error-text">{topicError}</p>
          ) : (
            <select
              id="topicId"
              name="topicId"
              value={formData.topicId}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="">Selecciona un tema</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>{topic.title}</option>
              ))}
            </select>
          )}
          {formErrors.topicId && <span className="field-error">{formErrors.topicId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="title">Título *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {formErrors.title && <span className="field-error">{formErrors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="slug">Slug * (identificador en la URL)</label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {formErrors.slug && <span className="field-error">{formErrors.slug}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="summary">Resumen *</label>
          <textarea
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            disabled={isSubmitting}
            rows={3}
          />
          {formErrors.summary && <span className="field-error">{formErrors.summary}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="body">Cuerpo del artículo * (Markdown / HTML)</label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleChange}
            disabled={isSubmitting}
            rows={15}
          />
          {formErrors.body && <span className="field-error">{formErrors.body}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="readTimeMinutes">Tiempo de lectura (minutos) *</label>
            <input
              type="number"
              id="readTimeMinutes"
              name="readTimeMinutes"
              value={formData.readTimeMinutes}
              onChange={handleChange}
              disabled={isSubmitting}
              min="1"
            />
            {formErrors.readTimeMinutes && <span className="field-error">{formErrors.readTimeMinutes}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="tags">Etiquetas (separadas por coma)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Ej: pediatría, vacunas"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="admin-action-btn"
            onClick={() => onNavigate && onNavigate('/admin/articles')}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="admin-action-btn admin-action-btn--publish"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Crear artículo'}
          </button>
        </div>
      </form>
    </div>
  )
}
