// Operating principles rendered as an indexed rule set — deliberately NOT six
// icon cards. Each rule is a numbered row (index + rule + explanation) separated
// by thin dividers, reading as a durable list of commitments rather than a grid
// of interchangeable feature boxes.

export function TrustPrincipleList({ principles }: { principles: [string, string][] }) {
  return (
    <ol className="trust-rules">
      {principles.map(([title, copy], index) => (
        <li className="trust-rule" key={title}>
          <span className="trust-rule-index" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="trust-rule-body">
            <b>{title}</b>
            <p>{copy}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
