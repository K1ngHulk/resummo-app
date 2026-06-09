function CircularProgress({ value, label, showScale = false }) {
  const safeValue = Math.max(0, Math.min(value, 100))

  return (
    <div className="progress-circle-block">
      <div className="circular-progress" style={{ '--progress-value': safeValue }}>
        <div className="circular-progress__inner">
          <span className="circular-progress__value">{safeValue}%</span>
        </div>
      </div>
      {label ? <span className="progress-circle-block__label">{label}</span> : null}
      {showScale ? (
        <div className="progress-circle-block__scale" aria-hidden="true">
          <span>0</span>
          <span>100</span>
        </div>
      ) : null}
    </div>
  )
}

export default CircularProgress
