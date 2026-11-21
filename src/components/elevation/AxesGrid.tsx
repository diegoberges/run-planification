import { PROFILE_MARGIN, PROFILE_VIEW_HEIGHT, PROFILE_VIEW_WIDTH, type ProfileScales } from './scales'

export function AxesGrid({ scales }: { scales: ProfileScales }) {
  const xTicks = scales.x.ticks(6)
  const yTicks = scales.y.ticks(4)
  const baseline = PROFILE_VIEW_HEIGHT - PROFILE_MARGIN.bottom

  return (
    <g className="text-[9px] fill-gray-400">
      {yTicks.map((tick) => (
        <g key={`y-${tick}`}>
          <line
            x1={PROFILE_MARGIN.left}
            x2={PROFILE_VIEW_WIDTH - PROFILE_MARGIN.right}
            y1={scales.y(tick)}
            y2={scales.y(tick)}
            stroke="currentColor"
            strokeOpacity={0.25}
            strokeWidth={1}
          />
          <text x={4} y={scales.y(tick) + 3}>
            {Math.round(tick)}m
          </text>
        </g>
      ))}
      {xTicks.map((tick) => (
        <g key={`x-${tick}`}>
          <line
            x1={scales.x(tick)}
            x2={scales.x(tick)}
            y1={PROFILE_MARGIN.top}
            y2={baseline}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={1}
          />
          <text x={scales.x(tick)} y={PROFILE_VIEW_HEIGHT - 10} textAnchor="middle">
            {(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}km
          </text>
        </g>
      ))}
    </g>
  )
}
