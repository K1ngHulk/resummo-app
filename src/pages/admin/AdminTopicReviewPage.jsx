import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminTopics.css'

export default function AdminTopicReviewPage({ onNavigate, searchParams }) {
  const { request } = useAuth()
  const topicId = searchParams?.get('id')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    description: '',
    color: '#8A342C',
    status: 'DRAFT',
  })

  const [counts, setCounts] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(topicId))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    if (!topicId) {
      return
    }

    const fetchTopic = async () => {
      setIsLoading(true)
      setError('')
      try {
        const payload = await request(`/api/admin/content/topics/${topicId}`)
        if (isMounted && payload.topic) {
          const t = payload.topic
          setFormData({
            title: t.title || '',
            slug: t.slug || '',
            summary: t.summary || '',
            description: t.description || '',
            color: t.color || '#8A342C',
            status: t.status || 'DRAFT',
          })
          setCounts(t.counts || t._count || null)
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Error al cargar el tema.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchTopic()

    return () => {
      isMounted = false
    }
  }, [request, topicId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.slug || !formData.summary || !formData.description) {
      setError('Todos los campos de texto son requeridos.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await request(`/api/admin/content/topics/${topicId}`, {
        method: 'PATCH',
        body: formData,
      })

      setSuccess('Tema guardado exitosamente.')
    } catch (err) {
      setError(err.message || 'Error al guardar el tema. Revisa si el slug ya existe.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!topicId) {
    return (
      <div className="admin-topics-page">
        <div className="admin-empty-state">
          <p>No se especificó un ID de tema válido.</p>
          <button
            className="admin-action-btn"
            onClick={() => onNavigate && onNavigate('/admin/topics')}
            style={{ marginTop: '1rem' }}
          >
            Volver a Temas
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="admin-topics-page">
        <p style={{ color: 'var(--color-text-soft)' }}>Cargando tema...</p>
      </div>
    )
  }

  return (
    <div className="admin-topics-page">
      <header className="admin-topics-header">
        <h1>Revisar Tema</h1>
        <p>Actualiza la información del tema.</p>
      </header>

      {error && <div className="app-feedback app-feedback--error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="app-feedback app-feedback--success" style={{ marginBottom: '1rem', backgroundColor: 'var(--color-primary-muted)', padding: '1rem', borderRadius: '4px' }}>{success}</div>}

      <form className="admin-topic-form" onSubmit={handleSubmit}>
        <div className="admin-form-group">
          <label htmlFor="title">Título *</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="slug">Slug *</label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={formData.slug}
            onChange={handleChange}
            required
          />
          <small className="admin-form-hint admin-form-hint--warning">
            ⚠️ Cambiar el slug puede afectar enlaces existentes.
          </small>
        </div>

        <div className="admin-form-group">
          <label htmlFor="summary">Resumen *</label>
          <input
            id="summary"
            name="summary"
            type="text"
            value={formData.summary}
            onChange={handleChange}
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="description">Descripción detallada *</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="color">Color (Hexadecimal) *</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              id="color"
              name="color"
              type="color"
              value={formData.color}
              onChange={handleChange}
              style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer' }}
            />
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              pattern="^#[0-9A-Fa-f]{6}$"
              required
            />
          </div>
        </div>

        <div className="admin-form-group">
          <label htmlFor="status">Estado</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="DRAFT">Borrador</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="ARCHIVED">Archivado</option>
          </select>
        </div>

        {counts && (
          <div className="admin-topic-counts-panel">
            <h3>Contenido asociado</h3>
            <ul>
              {counts.articles !== undefined && <li>Artículos: {counts.articles}</li>}
              {counts.questions !== undefined && <li>Preguntas: {counts.questions}</li>}
            </ul>
          </div>
        )}

        <div className="admin-topic-form-actions">
          <button
            type="button"
            className="admin-action-btn"
            onClick={() => onNavigate && onNavigate('/admin/topics')}
            disabled={isSaving}
          >
            Volver a Temas
          </button>
          <button
            type="submit"
            className="admin-action-btn admin-action-btn--publish"
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
