function LearningMetricCard({ label, value }) {
  return (
    <article className="learning-metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

export default LearningMetricCard
