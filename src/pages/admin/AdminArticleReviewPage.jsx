import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminArticleReviewPage.css'

function getHumanStatus(status) {
  if (status === 'DRAFT') return 'Borrador'
  if (status === 'PUBLISHED') return 'Publicado'
  if (status === 'ARCHIVED') return 'Archivado'
  return status
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
    status: 'DRAFT'
  })
  
  const [isLoading, setIsLoading] = useState(!!articleId)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(articleId ? '' : 'No se encontró un artículo válido para revisar.')
  const [successMsg, setSuccessMsg] = useState('')

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
            status: payload.article.status || 'DRAFT'
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'readTimeMinutes' ? parseInt(value, 10) || 1 : value
    }))
  }

  const handleSave = async (e, forceStatus = null) => {
    if (e) e.preventDefault()
    
    setIsSaving(true)
    setError('')
    setSuccessMsg('')
    
    const statusToSave = forceStatus || formData.status

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      await request(`/api/admin/content/articles/${articleId}`, {
        method: 'PATCH',
        body: {
          title: formData.title,
          summary: formData.summary,
          body: formData.body,
          readTimeMinutes: formData.readTimeMinutes,
          tags: tagsArray,
          status: statusToSave
        }
      })
      
      setSuccessMsg('Cambios guardados correctamente.')
      setFormData(prev => ({ ...prev, status: statusToSave }))
      setArticle(prev => ({ ...prev, status: statusToSave }))
      
      // Auto-hide success message
      setTimeout(() => setSuccessMsg(''), 3000)
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
          <button className="admin-btn admin-btn--secondary" onClick={() => onNavigate('/admin/articles')}>
            Volver a Artículos
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="admin-review-page">
        <p style={{ color: 'var(--color-text-soft)' }}>Cargando artículo...</p>
      </div>
    )
  }

  if (error && !article) {
    return (
      <div className="admin-review-page">
        <div className="admin-error-container">
          <h2>Error al cargar</h2>
          <p>{error}</p>
          <button className="admin-btn admin-btn--secondary" onClick={() => onNavigate('/admin/articles')}>
            Volver a Artículos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-review-page">
      <header className="admin-review-header">
        <div>
          <h1 className="admin-review-title">Revisión de Artículo</h1>
          <p className="admin-review-subtitle">
            Estado actual: <strong>{getHumanStatus(article.status)}</strong>
          </p>
        </div>
        <button 
          className="admin-back-btn"
          onClick={() => onNavigate('/admin/articles')}
        >
          &larr; Volver a lista
        </button>
      </header>

      {error && <div className="app-feedback app-feedback--error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {successMsg && <div className="app-feedback app-feedback--success" style={{ marginBottom: '1rem', backgroundColor: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '8px' }}>{successMsg}</div>}

      <div className="admin-review-content">
        <form onSubmit={handleSave} className="admin-form-section">
          <h2>Contenido Principal</h2>
          
          <div className="admin-form-group">
            <label className="admin-form-label">Título</label>
            <input 
              type="text"
              className="admin-form-input"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Resumen (Summary)</label>
            <textarea 
              className="admin-form-textarea"
              style={{ minHeight: '60px' }}
              name="summary"
              value={formData.summary}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Cuerpo (Body - Markdown/HTML)</label>
            <textarea 
              className="admin-form-textarea"
              style={{ minHeight: '300px' }}
              name="body"
              value={formData.body}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="admin-form-group">
            <label className="admin-form-label">Tiempo de Lectura (minutos)</label>
            <input 
              type="number"
              min="1"
              className="admin-form-input"
              name="readTimeMinutes"
              value={formData.readTimeMinutes}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="admin-form-group">
            <label className="admin-form-label">Etiquetas (separadas por comas)</label>
            <input 
              type="text"
              className="admin-form-input"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="ej: pediatría, vacunas, infectología"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Tema Asociado</label>
            <input 
              type="text"
              className="admin-form-input"
              value={article.topic?.title || 'Sin tema asignado'}
              disabled
              title="Para cambiar el tema, usa la gestión de temas (próximamente)"
            />
          </div>

          <div className="admin-review-actions">
            <button 
              type="submit" 
              className="admin-btn admin-btn--primary"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            
            <div className="admin-review-actions-group">
              {formData.status !== 'DRAFT' && (
                <button 
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  disabled={isSaving}
                  onClick={(e) => handleSave(e, 'DRAFT')}
                >
                  Volver a Borrador
                </button>
              )}
              {formData.status !== 'ARCHIVED' && (
                <button 
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  disabled={isSaving}
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={(e) => handleSave(e, 'ARCHIVED')}
                >
                  Archivar
                </button>
              )}
              {formData.status !== 'PUBLISHED' && (
                <button 
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={isSaving}
                  style={{ backgroundColor: '#16a34a' }}
                  onClick={(e) => handleSave(e, 'PUBLISHED')}
                >
                  Publicar Artículo
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
