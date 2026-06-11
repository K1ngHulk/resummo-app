function LearningPageHeader({ eyebrow = 'Learning', title, description, actionLabel, onAction }) {
  return (
    <section className="learning-page-header">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{description}</span>
      </div>
      {actionLabel ? (
        <button type="button" className="primary-button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  )
}

export default LearningPageHeader
