function LearningItemCard({ title, meta, detail, progress, actionLabel }) {
  return (
    <article className="learning-item-card">
      <div>
        {meta ? <p className="learning-item-card__meta">{meta}</p> : null}
        <h3>{title}</h3>
        {detail ? <p>{detail}</p> : null}
      </div>
      {typeof progress === 'number' ? (
        <div className="learning-item-card__progress" aria-label={`${progress}% completado`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {actionLabel ? (
        <button type="button" className="text-link learning-item-card__action">
          {actionLabel}
        </button>
      ) : null}
    </article>
  )
}

export default LearningItemCard
