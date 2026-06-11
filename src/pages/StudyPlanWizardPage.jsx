import resummoCreamLogo from '../assets/brand/originals/logocrema fondo transparente.png'
import { studyPlanWizard } from '../mocks/learningMockData'

function WizardLogo() {
  return (
    <div className="spw-logo-wrap" aria-hidden="true">
      <img src={resummoCreamLogo} alt="" />
    </div>
  )
}

function WizardFeatureRow({ row }) {
  return (
    <button type="button" className="spw-filter-row">
      <span className="spw-plus" aria-hidden="true">+</span>
      <strong>{row.label}</strong>
      <span>{row.chip}</span>
    </button>
  )
}

function MockCheckbox({ label, checked }) {
  return (
    <label className="spw-checkbox">
      <span className={`spw-checkbox__box ${checked ? 'spw-checkbox__box--checked' : ''}`} aria-hidden="true">
        {checked ? '✓' : ''}
      </span>
      <input type="checkbox" defaultChecked={checked} />
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

function StudyPlanStepOne({ onNavigate }) {
  const step = studyPlanWizard.step1

  return (
    <>
      <StepIntro title={step.introTitle} text={step.intro} />

      <div className="spw-form">
        <label className="spw-field">
          <span>{step.question}</span>
          <select defaultValue={step.selectedExam}>
            <option>{step.selectedExam}</option>
          </select>
        </label>

        <div className="spw-filter-list">
          {step.rows.map((row) => (
            <WizardFeatureRow key={row.id} row={row} />
          ))}
        </div>

        <fieldset className="spw-checklist">
          <legend>{step.statusTitle}</legend>
          {step.statuses.map((status) => (
            <MockCheckbox key={status.id} label={status.label} checked={status.checked} />
          ))}
        </fieldset>

        <button
          type="button"
          className="spw-primary-action"
          onClick={() => onNavigate('/learning/study-plans/new/step-2')}
        >
          {step.action}
        </button>
      </div>
    </>
  )
}

function StudyPlanStepTwo({ onNavigate }) {
  const step = studyPlanWizard.step2

  return (
    <>
      <StepIntro title={step.introTitle} text={step.intro} />

      <div className="spw-form spw-form--routine">
        <div className="spw-hours">
          <div className="spw-hours__head">
            <span>{step.hoursLabel}</span>
            <strong>{step.hoursValue}</strong>
          </div>
          <div className="spw-slider" aria-hidden="true">
            <span />
          </div>
          <p>{step.helper}</p>
        </div>

        <fieldset className="spw-checklist spw-checklist--days">
          <legend>{step.daysTitle}</legend>
          <div className="spw-days-grid">
            {step.days.map((day) => (
              <MockCheckbox key={day.id} label={day.label} checked={day.checked} />
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          className="spw-primary-action"
          onClick={() => onNavigate('/learning/study-plans')}
        >
          {step.action}
        </button>
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
