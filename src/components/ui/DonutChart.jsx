function DonutChart({ segments, value, description }) {
  let currentStop = 0
  const gradientStops = segments
    .map((segment) => {
      const start = currentStop
      currentStop += segment.value
      return `${segment.color} ${start}% ${currentStop}%`
    })
    .join(', ')

  return (
    <div className="donut-chart" style={{ '--chart-gradient': `conic-gradient(${gradientStops})` }}>
      <div className="donut-chart__inner">
        <strong>{value}%</strong>
        <span>{description}</span>
      </div>
    </div>
  )
}

export default DonutChart
