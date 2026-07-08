import { useState, useEffect } from 'react'
import './Flashcard.css'
import logo from '../../assets/brand/originals/logoguinda.png' // Logo de Resummo

export default function Flashcard({ 
  frontContent, 
  backContent, 
  hint, 
  isFlipped, 
  onFlip 
}) {
  // Allow internal flip state if not controlled externally
  const [internalFlipped, setInternalFlipped] = useState(false)

  const handleFlip = () => {
    if (onFlip) {
      onFlip()
    } else {
      setInternalFlipped(!internalFlipped)
    }
  }

  const flipped = isFlipped !== undefined ? isFlipped : internalFlipped

  // Reset internal state when content changes
  useEffect(() => {
    if (isFlipped === undefined) {
      setInternalFlipped(false)
    }
  }, [frontContent, isFlipped])

  return (
    <div className="flashcard-container">
      <div 
        className={`flashcard-inner ${flipped ? 'is-flipped' : ''}`}
        onClick={handleFlip}
      >
        {/* Frente de la tarjeta (Pregunta) */}
        <div className="flashcard-front">
          <div className="flashcard-logo-container">
            <img src={logo} alt="Resummo Logo" className="flashcard-logo" />
          </div>
          
          <div className="flashcard-content">
            <p className="flashcard-text">{frontContent}</p>
            {hint && <div className="flashcard-hint">💡 {hint}</div>}
          </div>
          
          <div className="flashcard-footer">
            Toca para girar
          </div>
        </div>

        {/* Reverso de la tarjeta (Respuesta) */}
        <div className="flashcard-back">
          <div className="flashcard-logo-container">
            <img src={logo} alt="Resummo Logo" className="flashcard-logo" />
          </div>
          
          <div className="flashcard-content">
            <p className="flashcard-text">{backContent}</p>
          </div>
          
          <div className="flashcard-footer">
            Toca para girar
          </div>
        </div>
      </div>
    </div>
  )
}
