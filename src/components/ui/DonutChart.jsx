function DonutChart({ segments, value, description }) {
  const gradientStops = segments
    .reduce(
      (acc, segment) => {
        const end = acc.currentStop + segment.value

        return {
          currentStop: end,
          stops: [...acc.stops, `${segment.color} ${acc.currentStop}% ${end}%`],
        }
      },
      { currentStop: 0, stops: [] },
    )
    .stops
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
