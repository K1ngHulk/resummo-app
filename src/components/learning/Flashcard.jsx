import './Flashcard.css'

export default function Flashcard({ 
  frontContent, 
  backContent, 
  hint, 
  isFlipped = false,
  onFlip 
}) {
  const flipped = Boolean(isFlipped)

  const handleFlip = () => {
    if (flipped) return
    onFlip?.()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleFlip()
    }
  }

  return (
    <div className="flashcard-container">
      <div
        className={`flashcard-inner ${flipped ? 'is-flipped' : ''}`}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={flipped ? -1 : 0}
        aria-label={flipped ? 'Respuesta visible' : 'Mostrar respuesta de la tarjeta'}
        aria-pressed={flipped}
      >
        <div className="flashcard-front">
          <span className="flashcard-side-label">Pregunta</span>
          <div className="flashcard-content">
            <p className="flashcard-text">{frontContent}</p>
            {hint ? <div className="flashcard-hint"><strong>Pista:</strong> {hint}</div> : null}
          </div>
          <div className="flashcard-footer">Haz clic o presiona Enter para ver la respuesta</div>
        </div>

        <div className="flashcard-back">
          <span className="flashcard-side-label">Respuesta</span>
          <div className="flashcard-content">
            <p className="flashcard-text">{backContent}</p>
          </div>
          <div className="flashcard-footer">Elige cómo te resultó recordarla</div>
        </div>
      </div>
    </div>
  )
}
