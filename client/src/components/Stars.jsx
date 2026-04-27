import { useMemo } from 'react'

const rand = (min, max) => Math.random() * (max - min) + min

export default function Stars({ count = 80 }) {
  const stars = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    top:    `${rand(0, 100)}%`,
    left:   `${rand(0, 100)}%`,
    size:   rand(1, 2.8),
    op:     rand(0.15, 0.7),
    delay:  `${rand(0, 5)}s`,
    dur:    `${rand(2, 5)}s`,
  })), [count])

  return (
    <div className="stars-layer" aria-hidden="true">
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            '--op': s.op, '--delay': s.delay, '--d': s.dur,
          }}
        />
      ))}
    </div>
  )
}
