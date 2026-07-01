import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminTopics.css'

export default function AdminTopicCreatePage({ onNavigate }) {
  const { request } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    description: '',
    color: '#8A342C',
    status: 'DRAFT',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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

    setIsLoading(true)
    setError('')

    try {
      const payload = await request('/api/admin/content/topics', {
        method: 'POST',
        body: formData,
      })

      if (payload.topic && payload.topic.id) {
        onNavigate && onNavigate(`/admin/topics/review?id=${payload.topic.id}`)
      } else {
        setError('Tema creado, pero no se recibió el ID para redirigir.')
      }
    } catch (err) {
      setError(err.message || 'Error al crear el tema. Revisa si el slug ya existe.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-topics-page">
      <header className="admin-topics-header">
        <h1>Nuevo Tema</h1>
        <p>Crea un nuevo tema para la biblioteca de Resummo.</p>
      </header>

      {error && <div className="app-feedback app-feedback--error" style={{ marginBottom: '1rem' }}>{error}</div>}

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
            placeholder="Ej: Fisiología Cardiovascular"
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
            placeholder="Ej: fisiologia-cardiovascular"
          />
          <small className="admin-form-hint">El slug debe ser único y sin espacios.</small>
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
            placeholder="Breve descripción de 1 línea."
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
            placeholder="Descripción completa del tema..."
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

        <div className="admin-topic-form-actions">
          <button
            type="button"
            className="admin-action-btn"
            onClick={() => onNavigate && onNavigate('/admin/topics')}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="admin-action-btn admin-action-btn--publish"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Crear tema'}
          </button>
        </div>
      </form>
    </div>
  )
}
