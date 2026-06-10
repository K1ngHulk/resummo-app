import { useEffect, useRef, useState } from 'react'
import resummoLogo from '../assets/brand/originals/logoguinda.png'
import {
  qbankDifficultyLevels,
  qbankExamOptions,
  qbankNewSession,
  qbankSessionRows,
  qbankSessionSwitches,
  qbankStatusModes,
  qbankStatusOptions,
  qbankTopicRows,
} from '../mocks/learningMockData'

/* ─────────────────────────────────────────────
   Ícono ⊕ reutilizable
───────────────────────────────────────────── */
function AddCircleIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7v10M7 12h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   Modal base reutilizable
───────────────────────────────────────────── */
function FilterModal({ title, onReset, onClose, children }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      className="ns-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={handleOverlayClick}
    >
      <div className="ns-modal">
        <div className="ns-modal__header">
          <h2 className="ns-modal__title">{title}</h2>
        </div>
        <div className="ns-modal__body">{children}</div>
        <div className="ns-modal__footer">
          <button type="button" className="ns-modal__reset-btn" onClick={onReset}>
            Restablecer
          </button>
          <button type="button" className="ns-modal__done-btn" onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Checkbox compartido
───────────────────────────────────────────── */
function CheckboxItem({ id, checked, onChange, label, children, className }) {
  return (
    <li>
      <label className={`ns-checkbox-row ${className || ''}`} htmlFor={id}>
        <span
          className={`ns-checkbox ${checked ? 'ns-checkbox--checked' : ''}`}
          aria-hidden="true"
        >
          {checked && (
            <svg viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <input
          type="checkbox"
          id={id}
          className="ns-checkbox__input"
          checked={checked}
          onChange={onChange}
        />
        {children || <span className="ns-checkbox-row__label">{label}</span>}
      </label>
    </li>
  )
}

/* ─────────────────────────────────────────────
   Modal de Exámenes
───────────────────────────────────────────── */
function ExamFilterModal({ onClose }) {
  const [checked, setChecked] = useState(
    () => Object.fromEntries(qbankExamOptions.map((o) => [o.id, o.defaultChecked]))
  )
  const [query, setQuery] = useState('')

  const filtered = qbankExamOptions.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  )

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  const handleReset = () => {
    setChecked(Object.fromEntries(qbankExamOptions.map((o) => [o.id, false])))
    setQuery('')
  }

  return (
    <FilterModal title="Exámenes" onReset={handleReset} onClose={onClose}>
      {/* Buscador rojo */}
      <div className="ns-modal__search">
        <svg
          className="ns-modal__search-icon"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M13.5 13.5L17 17"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          placeholder="Buscar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar examen"
          className="ns-modal__search-input"
        />
      </div>

      <p className="ns-modal__section-label">Incluir preguntas de:</p>
      <ul className="ns-modal__checklist">
        {filtered.map((option) => (
          <CheckboxItem
            key={option.id}
            id={`exam-${option.id}`}
            checked={!!checked[option.id]}
            onChange={() => toggle(option.id)}
            label={option.label}
          />
        ))}
      </ul>
    </FilterModal>
  )
}

/* ─────────────────────────────────────────────
   Modal de Dificultad
───────────────────────────────────────────── */
function DifficultyFilterModal({ onClose }) {
  const [checked, setChecked] = useState(
    () => Object.fromEntries(qbankDifficultyLevels.map((l) => [l.id, l.defaultChecked]))
  )

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  const handleReset = () =>
    setChecked(Object.fromEntries(qbankDifficultyLevels.map((l) => [l.id, false])))

  return (
    <FilterModal title="Dificultad" onReset={handleReset} onClose={onClose}>
      <p className="ns-modal__desc">
        Cada pregunta se asigna un nivel de dificultad de 1 R (más fácil) a 5 R&apos;s (más difícil)
      </p>
      <p className="ns-modal__section-label">Incluir pregunta con nivel de dificultad:</p>
      <ul className="ns-modal__checklist">
        {qbankDifficultyLevels.map((level) => (
          <CheckboxItem
            key={level.id}
            id={`diff-${level.id}`}
            checked={!!checked[level.id]}
            onChange={() => toggle(level.id)}
            className="ns-difficulty-row"
          >
            {/* logos R en lugar del label */}
            <span
              className="ns-difficulty-logos"
              aria-label={`Nivel ${level.level}`}
            >
              {Array.from({ length: level.level }).map((_, i) => (
                <img
                  key={i}
                  src={resummoLogo}
                  alt=""
                  className="ns-difficulty-logo"
                  aria-hidden="true"
                />
              ))}
            </span>
          </CheckboxItem>
        ))}
      </ul>
    </FilterModal>
  )
}

/* ─────────────────────────────────────────────
   Modal de Estado
───────────────────────────────────────────── */
function StatusFilterModal({ onClose }) {
  const [checked, setChecked] = useState(
    () => Object.fromEntries(qbankStatusOptions.map((o) => [o.id, o.defaultChecked]))
  )
  const [mode, setMode] = useState(
    () => qbankStatusModes.find((m) => m.defaultSelected)?.id ?? qbankStatusModes[0].id
  )

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  const handleReset = () => {
    setChecked(Object.fromEntries(qbankStatusOptions.map((o) => [o.id, false])))
    setMode(qbankStatusModes[0].id)
  }

  return (
    <FilterModal title="Estado" onReset={handleReset} onClose={onClose}>
      <p className="ns-modal__section-label">Incluir preguntas con el siguiente estado:</p>
      <ul className="ns-modal__checklist">
        {qbankStatusOptions.map((option) => (
          <CheckboxItem
            key={option.id}
            id={`status-${option.id}`}
            checked={!!checked[option.id]}
            onChange={() => toggle(option.id)}
            label={option.label}
          />
        ))}
      </ul>

      <hr className="ns-modal__divider" />

      <p className="ns-modal__section-label">¿Cómo deberían aplicarse los filtros de estado?</p>
      <ul className="ns-modal__checklist">
        {qbankStatusModes.map((modeOption) => (
          <li key={modeOption.id}>
            <label className="ns-checkbox-row" htmlFor={`mode-${modeOption.id}`}>
              <span
                className={`ns-radio ${mode === modeOption.id ? 'ns-radio--selected' : ''}`}
                aria-hidden="true"
              >
                {mode === modeOption.id && <span className="ns-radio__dot" />}
              </span>
              <input
                type="radio"
                id={`mode-${modeOption.id}`}
                name="status-mode"
                className="ns-checkbox__input"
                checked={mode === modeOption.id}
                onChange={() => setMode(modeOption.id)}
              />
              <span className="ns-checkbox-row__label">{modeOption.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </FilterModal>
  )
}

/* ─────────────────────────────────────────────
   Fila de filtro clicable
───────────────────────────────────────────── */
function FilterRow({ row, onOpen }) {
  return (
    <button
      type="button"
      className="ns-filter-row"
      onClick={() => row.opensModal && onOpen(row.opensModal)}
      aria-haspopup={row.opensModal ? 'dialog' : undefined}
    >
      <AddCircleIcon className="ns-filter-row__add-icon" />
      <span className="ns-filter-row__label">{row.label}</span>
      <span className="ns-filter-row__chips">
        {row.chips.map((chip, i) => (
          <span key={i} className={`ns-chip ${chip.isCount ? 'ns-chip--count' : ''}`}>
            {chip.label}
          </span>
        ))}
      </span>
    </button>
  )
}

/* ─────────────────────────────────────────────
   Switch mock
───────────────────────────────────────────── */
function MockSwitch({ id, label, defaultOn }) {
  const [on, setOn] = useState(defaultOn)

  return (
    <div className="ns-switch-row">
      <span className="ns-switch-row__label">{label}</span>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={on}
        className={`ns-switch ${on ? 'ns-switch--on' : ''}`}
        onClick={() => setOn((v) => !v)}
        aria-label={label}
      >
        <span className="ns-switch__thumb" />
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Página principal
───────────────────────────────────────────── */
function QbankNewSessionPage({ onNavigate }) {
  const [openModal, setOpenModal] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('modal') ?? null
  })

  const handleOpen = (modalId) => setOpenModal(modalId)
  const handleClose = () => setOpenModal(null)

  return (
    <section className="ns-page">
      {/* Encabezado de página */}
      <div className="ns-header">
        <div className="ns-header__left">
          <button
            type="button"
            className="ns-back-btn"
            onClick={() => onNavigate('/learning/qbank')}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="ns-back-btn__icon"
            >
              <path
                d="M12.5 15l-5-5 5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {qbankNewSession.secondaryAction}
          </button>
          <h1 className="ns-header__title">{qbankNewSession.title}</h1>
        </div>
        <div className="ns-header__actions">
          <button type="button" className="ns-action-btn ns-action-btn--ghost">
            {qbankNewSession.resetAction}
          </button>
          <button type="button" className="ns-action-btn ns-action-btn--primary">
            {qbankNewSession.saveAction}
          </button>
        </div>
      </div>

      {/* Columnas */}
      <div className="ns-columns">
        {/* Panel izquierdo */}
        <div className="ns-panel">
          <div className="ns-panel__head">
            <h2 className="ns-panel__title">Establece los temas de tu sesión</h2>
          </div>

          {/* Buscador blanco pill */}
          <div className="ns-panel__search-wrap">
            <div className="ns-panel__search">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className="ns-panel__search-icon"
              >
                <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M13.5 13.5L17 17"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="search"
                placeholder="Ej., artículos, sistemas, disciplinas"
                aria-label="Buscar tema"
              />
            </div>
          </div>

          <ul className="ns-panel__list">
            {qbankTopicRows.map((row) => (
              <li key={row.id} className="ns-panel__item">
                <FilterRow row={row} onOpen={handleOpen} />
              </li>
            ))}
          </ul>
        </div>

        {/* Panel derecho */}
        <div className="ns-panel">
          <div className="ns-panel__head">
            <h2 className="ns-panel__title">Criterios de sesión</h2>
          </div>

          {/* Título de sesión */}
          <div className="ns-session-title-field">
            <label className="ns-session-title-field__label" htmlFor="session-title">
              Título de la sesión
            </label>
            <input
              id="session-title"
              type="text"
              className="ns-session-title-field__input"
              placeholder="Ej. Sesión de estudio mayo"
            />
          </div>

          <ul className="ns-panel__list">
            {qbankSessionRows.map((row) => (
              <li key={row.id} className="ns-panel__item">
                <FilterRow row={row} onOpen={handleOpen} />
              </li>
            ))}
          </ul>

          <div className="ns-switches">
            {qbankSessionSwitches.map((sw) => (
              <MockSwitch key={sw.id} id={sw.id} label={sw.label} defaultOn={sw.defaultOn} />
            ))}
          </div>

          <div className="ns-question-count">
            <span className="ns-question-count__label">Recuento de Preguntas</span>
            <span className="ns-question-count__value">2,498</span>
          </div>

          <button type="button" className="ns-create-btn">
            {qbankNewSession.primaryAction}
          </button>
        </div>
      </div>

      {/* Modales */}
      {openModal === 'exams' && <ExamFilterModal onClose={handleClose} />}
      {openModal === 'difficulty' && <DifficultyFilterModal onClose={handleClose} />}
      {openModal === 'status' && <StatusFilterModal onClose={handleClose} />}
    </section>
  )
}

export default QbankNewSessionPage
