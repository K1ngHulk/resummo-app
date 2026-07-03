import { useState } from 'react'
import resummoCreamLogo from '../assets/brand/originals/logocrema fondo transparente.png'
import { studyPlanWizard } from '../mocks/learningMockData'

const STUDY_PLAN_DRAFT_KEY = 'resummo_study_plan_draft_v1'
const STUDY_PLAN_STORAGE_KEY = 'resummo_study_plan_v1'

function readDraft() {
  try {
    const value = window.localStorage.getItem(STUDY_PLAN_DRAFT_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function WizardLogo() {
  return (
    <div className="spw-logo-wrap" aria-hidden="true">
      <img src={resummoCreamLogo} alt="" />
    </div>
  )
}

function WizardFeatureRow({ row, value, onChange }) {
  return (
    <label className="spw-filter-row">
      <span className="spw-plus" aria-hidden="true">+</span>
      <strong>{row.label}</strong>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {row.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function WizardCheckbox({ label, checked, onChange }) {
  return (
    <label className="spw-checkbox">
      <span className={`spw-checkbox__box ${checked ? 'spw-checkbox__box--checked' : ''}`} aria-hidden="true">
        {checked ? '✓' : ''}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function StepIntro({ title, text }) {
  return (
    <div className="spw-intro">
      <h2>{title}</h2>
      <p>{text}</p>
      <WizardLogo />
    </div>
  )
}

function WizardProgress({ current }) {
  return (
    <div className="spw-progress" aria-label={`Paso ${current} de 2`}>
      <span>Paso {current} de 2</span>
      <div aria-hidden="true">
        <i className="spw-progress__complete" />
        <i className={current === 2 ? 'spw-progress__complete' : ''} />
      </div>
    </div>
  )
}

function StudyPlanStepOne({ onNavigate }) {
  const step = studyPlanWizard.step1
  const [savedDraft] = useState(() => readDraft())
  const [objective, setObjective] = useState(savedDraft?.objective || step.objectives[0].value)
  const [preferences, setPreferences] = useState(() => (
    Object.fromEntries(step.rows.map((row) => [row.id, savedDraft?.preferences?.[row.id] || row.options[0].value]))
  ))
  const [statuses, setStatuses] = useState(() => (
    Object.fromEntries(step.statuses.map((status) => [status.id, savedDraft?.statuses?.[status.id] ?? status.checked]))
  ))
  const [error, setError] = useState('')

  const handleContinue = () => {
    if (!Object.values(statuses).some(Boolean)) {
      setError('Selecciona al menos un tipo de pregunta para continuar.')
      return
    }

    try {
      window.localStorage.setItem(STUDY_PLAN_DRAFT_KEY, JSON.stringify({
        ...savedDraft,
        objective,
        preferences,
        statuses,
      }))
      setError('')
      onNavigate('/learning/study-plans/new/step-2')
    } catch {
      setError('No pudimos guardar tus preferencias en este dispositivo. Intenta nuevamente.')
    }
  }

  return (
    <>
      <StepIntro title={step.introTitle} text={step.intro} />

      <div className="spw-form">
        <WizardProgress current={1} />

        <label className="spw-field">
          <span>{step.question}</span>
          <select value={objective} onChange={(event) => setObjective(event.target.value)}>
            {step.objectives.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <div className="spw-filter-list">
          {step.rows.map((row) => (
            <WizardFeatureRow
              key={row.id}
              row={row}
              value={preferences[row.id]}
              onChange={(value) => setPreferences((current) => ({ ...current, [row.id]: value }))}
            />
          ))}
        </div>

        <fieldset className="spw-checklist">
          <legend>{step.statusTitle}</legend>
          {step.statuses.map((status) => (
            <WizardCheckbox
              key={status.id}
              label={status.label}
              checked={statuses[status.id]}
              onChange={(checked) => setStatuses((current) => ({ ...current, [status.id]: checked }))}
            />
          ))}
        </fieldset>

        {error ? <p className="spw-error" role="alert">{error}</p> : null}

        <button type="button" className="spw-primary-action" onClick={handleContinue}>
          {step.action}
        </button>
      </div>
    </>
  )
}

function StudyPlanStepTwo({ onNavigate }) {
  const step = studyPlanWizard.step2
  const [savedDraft] = useState(() => readDraft())
  const [minutesPerDay, setMinutesPerDay] = useState(savedDraft?.minutesPerDay || step.defaultMinutes)
  const [days, setDays] = useState(() => (
    Object.fromEntries(step.days.map((day) => [day.id, savedDraft?.days?.[day.id] ?? day.checked]))
  ))
  const [error, setError] = useState('')
  const hours = Math.floor(minutesPerDay / 60)
  const minutes = minutesPerDay % 60
  const hoursLabel = `${hours} h${minutes ? ` ${minutes} min` : ''}`

  const saveRoutineDraft = () => {
    window.localStorage.setItem(STUDY_PLAN_DRAFT_KEY, JSON.stringify({
      ...savedDraft,
      minutesPerDay,
      days,
    }))
  }

  const handleCreatePlan = () => {
    const selectedDays = step.days.filter((day) => days[day.id])
    if (selectedDays.length === 0) {
      setError('Selecciona al menos un día de estudio para crear el plan.')
      return
    }

    const objective = studyPlanWizard.step1.objectives.find(
      (option) => option.value === savedDraft?.objective,
    ) || studyPlanWizard.step1.objectives[0]
    const routineLabel = `${selectedDays.length} días por semana · ${hoursLabel} por jornada`

    try {
      saveRoutineDraft()
      window.localStorage.setItem(STUDY_PLAN_STORAGE_KEY, JSON.stringify({
        version: 1,
        title: `Plan de preparación para ${objective.label}`,
        subtitle: studyPlanWizard.planDuration,
        objectiveLabel: objective.label,
        routineLabel,
        selectedDayLabels: selectedDays.map((day) => day.label),
        minutesPerDay,
        readArticleIds: [],
        createdAt: new Date().toISOString(),
      }))
      window.localStorage.removeItem(STUDY_PLAN_DRAFT_KEY)
      setError('')
      onNavigate('/learning/study-plans/current')
    } catch {
      setError('No pudimos guardar el plan en este dispositivo. Intenta nuevamente.')
    }
  }

  const handleBack = () => {
    try {
      saveRoutineDraft()
      setError('')
      onNavigate('/learning/study-plans/new/step-1')
    } catch {
      setError('No pudimos conservar los cambios de rutina en este dispositivo.')
    }
  }

  return (
    <>
      <StepIntro title={step.introTitle} text={step.intro} />

      <div className="spw-form spw-form--routine">
        <WizardProgress current={2} />

        <div className="spw-hours">
          <div className="spw-hours__head">
            <label htmlFor="study-hours">{step.hoursLabel}</label>
            <strong>{hoursLabel}</strong>
          </div>
          <input
            id="study-hours"
            className="spw-range"
            type="range"
            min={step.minimumMinutes}
            max={step.maximumMinutes}
            step={step.minuteStep}
            value={minutesPerDay}
            onChange={(event) => setMinutesPerDay(Number(event.target.value))}
          />
          <p>{step.helper}</p>
        </div>

        <fieldset className="spw-checklist spw-checklist--days">
          <legend>{step.daysTitle}</legend>
          <div className="spw-days-grid">
            {step.days.map((day) => (
              <WizardCheckbox
                key={day.id}
                label={day.label}
                checked={days[day.id]}
                onChange={(checked) => setDays((current) => ({ ...current, [day.id]: checked }))}
              />
            ))}
          </div>
        </fieldset>

        {error ? <p className="spw-error" role="alert">{error}</p> : null}

        <div className="spw-actions">
          <button
            type="button"
            className="spw-secondary-action"
            onClick={handleBack}
          >
            Volver
          </button>
          <button type="button" className="spw-primary-action" onClick={handleCreatePlan}>
            {step.action}
          </button>
        </div>
      </div>
    </>
  )
}

function StudyPlanWizardPage({ step = 1, onNavigate }) {
  return (
    <section className="spw-page">
      <h1>{studyPlanWizard.title}</h1>

      <div className="spw-card">
        {step === 2 ? (
          <StudyPlanStepTwo onNavigate={onNavigate} />
        ) : (
          <StudyPlanStepOne onNavigate={onNavigate} />
        )}
      </div>
    </section>
  )
}

export default StudyPlanWizardPage
