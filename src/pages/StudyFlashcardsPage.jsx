import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Flashcard from '../components/learning/Flashcard'
import './StudyFlashcardsPage.css'

export default function StudyFlashcardsPage({ onNavigate, searchParams }) {
  const topicId = searchParams?.get('topicId')
  const { request } = useAuth()
  
  const [flashcards, setFlashcards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchFlashcards = async () => {
      if (!topicId) {
        setError('Selecciona un tema desde la Biblioteca para iniciar el repaso.')
        setIsLoading(false)
        return
      }

      try {
        const payload = await request(`/api/study/flashcards/${topicId}`)
        if (isMounted) {
          if (payload.completed || !payload.flashcards?.length) {
            setIsCompleted(true)
          } else {
            setFlashcards(payload.flashcards)
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Error al cargar las flashcards')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    
    fetchFlashcards()
    
    return () => { isMounted = false }
  }, [topicId, request])

  const currentFlashcard = flashcards[currentIndex]

  const handleFlip = () => {
    setIsFlipped(true)
  }

  const handleReview = async (difficulty) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await request(`/api/study/flashcards/${currentFlashcard.id}/review`, {
        method: 'POST',
        body: { difficulty } // 1: Difícil, 2: Bien, 3: Fácil
      })
      
      if (currentIndex + 1 < flashcards.length) {
        setIsFlipped(false)
        setCurrentIndex(prev => prev + 1)
      } else {
        setIsCompleted(true)
      }
    } catch (err) {
      setError(err.message || 'Error al guardar la respuesta')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="study-flashcards-page">
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2>Cargando tus tarjetas...</h2>
          <p style={{ color: 'var(--color-text-soft)' }}>Preparando tu sesión de estudio.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="study-flashcards-page">
        <div className="app-feedback app-feedback--error">{error}</div>
        <button 
          className="admin-btn admin-btn--secondary"
          onClick={() => onNavigate('/learning/library')}
          style={{ marginTop: '2rem' }}
        >
          Volver a la Biblioteca
        </button>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="study-flashcards-page" style={{ justifyContent: 'center' }}>
        <div className="study-flashcards-completed">
          <span>Repaso finalizado</span>
          <h2>Sesión completada</h2>
          <p>No quedan tarjetas pendientes en este tema para la sesión actual.</p>
          <button
            className="primary-button"
            onClick={() => onNavigate('/learning/library')}
          >
            Volver a Biblioteca
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="study-flashcards-page">
      <header className="study-flashcards-header">
        <button type="button" className="text-link" onClick={() => onNavigate('/learning/library')}>
          Volver a Biblioteca
        </button>
        <div>
          <h1>Flashcards del tema</h1>
          <p>Tarjeta {currentIndex + 1} de {flashcards.length}</p>
        </div>
        <div className="study-flashcards-progress" aria-label={`${currentIndex + 1} de ${flashcards.length} tarjetas`}>
          <span style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }} />
        </div>
      </header>

      <div className="study-flashcards-area">
        <Flashcard
          frontContent={currentFlashcard.prompt}
          backContent={currentFlashcard.explanation}
          hint={currentFlashcard.hint}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />

        {isFlipped ? (
          <div className="study-flashcards-controls" aria-label="Califica tu recuerdo">
            <button 
              className="flashcard-btn flashcard-btn--hard"
              onClick={() => handleReview(1)}
              disabled={isSubmitting}
            >
              <strong>Difícil</strong>
              <span>Repetir pronto</span>
            </button>
            <button 
              className="flashcard-btn flashcard-btn--good"
              onClick={() => handleReview(2)}
              disabled={isSubmitting}
            >
              <strong>Bien</strong>
              <span>Recordé con esfuerzo</span>
            </button>
            <button 
              className="flashcard-btn flashcard-btn--easy"
              onClick={() => handleReview(3)}
              disabled={isSubmitting}
            >
              <strong>Fácil</strong>
              <span>Lo recordé rápido</span>
            </button>
          </div>
        ) : (
          <p className="study-flashcards-helper">Piensa tu respuesta antes de girar la tarjeta.</p>
        )}
      </div>
    </div>
  )
}
