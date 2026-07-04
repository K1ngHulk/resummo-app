import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminQuestionCreatePage.css'

const pendingEditorialPattern = /\[FALTA CITA\]|\b(?:TODO|PENDIENTE|placeholder|mock)\b/i

export default function AdminQuestionCreatePage({ onNavigate }) {
  const { request } = useAuth()

  // Data loading states
  const [topics, setTopics] = useState([])
  const [articles, setArticles] = useState([])
  const [isLoadingTopics, setIsLoadingTopics] = useState(true)
  const [isLoadingArticles, setIsLoadingArticles] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Errors
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Form State
  const [formData, setFormData] = useState({
    topicId: '',
    articleId: '',
    prompt: '',
    explanation: '',
    difficulty: 3,
    hint: ''
  })

  // Option generator helper
  const generateInitialOptions = () => [
    { id: 'opt-0', text: '' },
    { id: 'opt-1', text: '' },
    { id: 'opt-2', text: '' },
    { id: 'opt-3', text: '' }
  ]

  const [options, setOptions] = useState(generateInitialOptions())
  const [correctOptionId, setCorrectOptionId] = useState(null)
  const [nextOptionKey, setNextOptionKey] = useState(4) // for stable ids
  const editorialChecklist = useMemo(() => {
    const textToReview = [
      formData.prompt,
      formData.explanation,
      formData.hint,
      ...options.map((option) => option.text),
    ].join(' ')

    return [
      { id: 'prompt', label: 'Enunciado presente', passed: Boolean(formData.prompt.trim()) },
      { id: 'explanation', label: 'Explicación presente', passed: Boolean(formData.explanation.trim()) },
      {
        id: 'options',
        label: 'Entre 2 y 5 opciones completas',
        passed: options.length >= 2 && options.length <= 5 && options.every((option) => option.text.trim()),
      },
      { id: 'correct', label: 'Una opción correcta seleccionada', passed: Boolean(correctOptionId) },
      { id: 'pending', label: 'Sin pendientes editoriales', passed: !pendingEditorialPattern.test(textToReview) },
    ]
  }, [correctOptionId, formData.explanation, formData.hint, formData.prompt, options])

  // Load Topics
  useEffect(() => {
    let isMounted = true
    const fetchTopics = async () => {
      setIsLoadingTopics(true)
      try {
        const payload = await request('/api/admin/content/topics')
        if (isMounted) setTopics(payload.topics || [])
      } catch (err) {
        if (isMounted) setError(err.message || 'Error al cargar los temas')
      } finally {
        if (isMounted) setIsLoadingTopics(false)
      }
    }
    fetchTopics()
    return () => { isMounted = false }
  }, [request])

  // Load Articles when Topic changes
  useEffect(() => {
    let isMounted = true
    const fetchArticles = async () => {
      if (!formData.topicId) {
        setArticles([])
        return
      }
      setIsLoadingArticles(true)
      try {
        const payload = await request(`/api/admin/content/articles?topicId=${formData.topicId}`)
        if (isMounted) setArticles(payload.articles || [])
      } catch (err) {
        if (isMounted) setError(err.message || 'Error al cargar los artículos')
      } finally {
        if (isMounted) setIsLoadingArticles(false)
      }
    }
    fetchArticles()
    return () => { isMounted = false }
  }, [request, formData.topicId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // If topic changes, clear article selection
    if (name === 'topicId') {
      setFormData(prev => ({ ...prev, articleId: '' }))
    }
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleOptionChange = (id, newText) => {
    setOptions(prev => prev.map(opt => (opt.id === id ? { ...opt, text: newText } : opt)))
    if (fieldErrors.options) {
      setFieldErrors(prev => ({ ...prev, options: null }))
    }
  }

  const handleAddOption = () => {
    if (options.length >= 5) return
    setOptions(prev => [...prev, { id: `opt-${nextOptionKey}`, text: '' }])
    setNextOptionKey(prev => prev + 1)
  }

  const handleRemoveOption = (id) => {
    if (options.length <= 2) return
    setOptions(prev => prev.filter(opt => opt.id !== id))
    if (correctOptionId === id) {
      setCorrectOptionId(null)
    }
  }

  const getLabelForIndex = (index) => String.fromCharCode(65 + index)

  const validateForm = () => {
    const errors = {}
    if (!formData.topicId) errors.topicId = 'El tema es requerido'
    if (!formData.prompt.trim()) errors.prompt = 'La pregunta es requerida'
    if (!formData.explanation.trim()) errors.explanation = 'La explicación es requerida'

    const diff = parseInt(formData.difficulty, 10)
    if (isNaN(diff) || diff < 1 || diff > 5) {
      errors.difficulty = 'La dificultad debe ser entre 1 y 5'
    }

    if (options.length < 2 || options.length > 5) {
      errors.options = 'Debe haber entre 2 y 5 opciones'
    }

    if (options.some(opt => !opt.text.trim())) {
      errors.optionsText = 'Todas las opciones deben tener texto'
    }

    if (!correctOptionId) {
      errors.correctOption = 'Debe seleccionar exactamente 1 opción correcta'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        topicId: formData.topicId,
        articleId: formData.articleId || null,
        prompt: formData.prompt.trim(),
        explanation: formData.explanation.trim(),
        difficulty: parseInt(formData.difficulty, 10),
        hint: formData.hint.trim() || null,
        options: options.map((opt, index) => ({
          label: getLabelForIndex(index),
          text: opt.text.trim(),
          isCorrect: opt.id === correctOptionId
        }))
      }

      const response = await request('/api/admin/content/questions', {
        method: 'POST',
        body: payload
      })

      if (response && response.question) {
        onNavigate(`/admin/questions/review?id=${response.question.id}`)
      }
    } catch (err) {
      setError(err.message || 'Error al crear la pregunta')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-question-create-page">
      <header className="admin-question-create-header">
        <div>
          <h1>Nueva Pregunta</h1>
          <p>Crea una nueva pregunta para el banco de forma manual (se guardará como Borrador).</p>
        </div>
      </header>

      <section className="admin-question-guidance" aria-label="Ayuda editorial">
        <strong>Flujo editorial</strong>
        <p>La pregunta se crea como borrador. Solo una pregunta publicada puede aparecer en QBank.</p>
        <p>No publiques contenido con <code>[FALTA CITA]</code>, TODO, PENDIENTE, placeholder o mock.</p>
      </section>

      {error && <div className="app-feedback app-feedback--error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label htmlFor="topicId">Tema *</label>
            <select
              id="topicId"
              name="topicId"
              value={formData.topicId}
              onChange={handleInputChange}
              disabled={isLoadingTopics}
            >
              <option value="">-- Seleccionar Tema --</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.title}</option>
              ))}
            </select>
            {isLoadingTopics && <small style={{ color: 'var(--color-text-soft)' }}>Cargando temas...</small>}
            {fieldErrors.topicId && <small style={{ color: '#dc2626' }}>{fieldErrors.topicId}</small>}
          </div>

          <div className="admin-form-group">
            <label htmlFor="articleId">Artículo relacionado (Opcional)</label>
            <select
              id="articleId"
              name="articleId"
              value={formData.articleId}
              onChange={handleInputChange}
              disabled={!formData.topicId || isLoadingArticles}
            >
              <option value="">-- Ninguno --</option>
              {articles.map(article => (
                <option key={article.id} value={article.id}>{article.title}</option>
              ))}
            </select>
            {isLoadingArticles && <small style={{ color: 'var(--color-text-soft)' }}>Cargando artículos...</small>}
            {!formData.topicId && !isLoadingArticles && <small style={{ color: 'var(--color-text-soft)' }}>Selecciona un tema primero</small>}
          </div>
        </div>

        <div className="admin-form-group">
          <label htmlFor="prompt">Enunciado *</label>
          <textarea
            id="prompt"
            name="prompt"
            value={formData.prompt}
            onChange={handleInputChange}
            placeholder="Escribe el enunciado de la pregunta..."
          />
          {fieldErrors.prompt && <small style={{ color: '#dc2626' }}>{fieldErrors.prompt}</small>}
        </div>

        <div className="admin-form-group">
          <label htmlFor="explanation">Explicación *</label>
          <textarea
            id="explanation"
            name="explanation"
            value={formData.explanation}
            onChange={handleInputChange}
            placeholder="Escribe la explicación de la respuesta..."
          />
          {fieldErrors.explanation && <small style={{ color: '#dc2626' }}>{fieldErrors.explanation}</small>}
        </div>

        <div className="admin-form-row">
          <div className="admin-form-group">
            <label htmlFor="difficulty">Dificultad *</label>
            <input
              type="number"
              id="difficulty"
              name="difficulty"
              min="1"
              max="5"
              value={formData.difficulty}
              onChange={handleInputChange}
            />
            {fieldErrors.difficulty && <small style={{ color: '#dc2626' }}>{fieldErrors.difficulty}</small>}
          </div>

          <div className="admin-form-group">
            <label htmlFor="hint">Pista opcional</label>
            <input
              type="text"
              id="hint"
              name="hint"
              value={formData.hint}
              onChange={handleInputChange}
              placeholder="Pista opcional para el estudiante..."
            />
          </div>
        </div>

        <div className="admin-options-section">
          <div className="admin-options-header">
            <h2>Opciones</h2>
            {options.length < 5 && (
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                onClick={handleAddOption}
              >
                + Añadir opción
              </button>
            )}
          </div>

          {fieldErrors.options && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{fieldErrors.options}</div>}
          {fieldErrors.optionsText && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{fieldErrors.optionsText}</div>}
          {fieldErrors.correctOption && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{fieldErrors.correctOption}</div>}

          <div className="admin-options-list">
            {options.map((opt, index) => (
              <div key={opt.id} className="admin-option-item">
                <div className="admin-option-label">{getLabelForIndex(index)}</div>

                <div className="admin-option-content">
                  <textarea
                    value={opt.text}
                    onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                    placeholder={`Texto de la opción ${getLabelForIndex(index)}`}
                    style={{ minHeight: '60px' }}
                  />
                </div>

                <div className="admin-option-actions">
                  <label className="admin-option-correct-radio">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionId === opt.id}
                      onChange={() => {
                        setCorrectOptionId(opt.id)
                        setFieldErrors(prev => ({ ...prev, correctOption: null }))
                      }}
                    />
                    Correcta
                  </label>

                  {options.length > 2 && (
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger-outline"
                      onClick={() => handleRemoveOption(opt.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="admin-question-draft-checklist" aria-label="Resumen del borrador">
          <span>Resumen editorial</span>
          <h2>Preparación del borrador</h2>
          <p>Los pendientes no impiden guardar; deberán resolverse antes de publicar.</p>
          <ul>
            {editorialChecklist.map((item) => (
              <li key={item.id} className={item.passed ? 'admin-check-pass' : 'admin-check-fail'}>
                <span aria-hidden="true">{item.passed ? '✓' : '!'}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => onNavigate('/admin/questions')}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={isSubmitting || isLoadingTopics}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar borrador'}
          </button>
        </div>
      </form>
    </div>
  )
}
