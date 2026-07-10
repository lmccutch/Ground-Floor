import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUp, Check, ChevronRight, Sparkles, Users, X } from 'lucide-react'
import { getCompanies, type PublicCompany } from '../lib/api'
import { CompanyCard } from '../components/CompanyCard'
import { Badge, Monogram, Skeleton } from '../components/ui'

const steps = [
  ['01', 'Find or request a company', 'Browse active campaigns, or request a company we don’t cover yet.'],
  ['02', 'Support the campaign', 'Add your self-reported shareholder status. Your position size stays private.'],
  ['03', 'Ask and vote', 'Surface the questions the shareholder community most wants answered.'],
  ['04', 'We request the interview', 'At the supporter target, Grround Floor formally invites management. Participation is voluntary.'],
] as const

const traditional = ['Generic earnings-call questions', 'Limited analyst access', 'Fragmented online discussions', 'No structured follow-up']
const grroundFloor = ['Shareholder-ranked questions', 'A collective, credible interview request', 'One public record per company', 'Campaign updates as they actually happen']

export function HomePage() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<PublicCompany[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(() => setFailed(true))
  }, [])

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> The shareholder network
          </div>
          <h1>
            Direct access to management, <em>powered by shareholders.</em>
          </h1>
          <p>
            Grround Floor gathers shareholder demand one company at a time. Support a campaign, submit and vote on questions — when a campaign
            reaches its supporter target, we formally request a management interview.
          </p>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => navigate('/discover')}>
              Explore companies <ChevronRight size={16} />
            </button>
            <button className="btn ghost" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
              See how it works
            </button>
          </div>
        </div>
        <HeroPreview />
      </section>

      <section id="how" className="how-section">
        <div className="section-row">
          <div>
            <span className="eyebrow">How Grround Floor works</span>
            <h2 className="display">A better seat at the table.</h2>
            <p>The strongest questions should not be limited to the largest funds.</p>
          </div>
        </div>
        <div className="steps">
          {steps.map(([num, title, copy]) => (
            <div className="step" key={num}>
              <span>{num}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="comparison">
        <div className="section-row">
          <div>
            <span className="eyebrow">Why this matters</span>
            <h2 className="display">From fragmented to focused.</h2>
          </div>
        </div>
        <div className="compare-grid">
          <div>
            <span className="compare-label muted">Traditional retail experience</span>
            {traditional.map(item => (
              <div className="compare-item muted" key={item}>
                <X size={15} /> {item}
              </div>
            ))}
          </div>
          <div className="compare-divider" />
          <div>
            <span className="compare-label">Grround Floor experience</span>
            {grroundFloor.map(item => (
              <div className="compare-item" key={item}>
                <Check size={15} /> {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="campaigns-section">
        <div className="section-row">
          <div>
            <span className="eyebrow">Open now</span>
            <h2 className="display">Active campaigns</h2>
          </div>
          <Link to="/discover" className="text-link">
            View all <ChevronRight size={15} />
          </Link>
        </div>
        {failed ? (
          <p className="section-note">Campaigns could not be loaded right now — try the Discover page.</p>
        ) : companies === null ? (
          <div className="company-grid">
            <Skeleton height={210} />
            <Skeleton height={210} />
            <Skeleton height={210} />
          </div>
        ) : (
          <div className="company-grid">
            {companies.slice(0, 3).map(company => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </section>

      <section className="request-band">
        <div>
          <h2>Can’t find your company?</h2>
          <p>Request it and we’ll open a public campaign other shareholders can join.</p>
        </div>
        <Link to="/request-company" className="btn gold">
          Request a company <ChevronRight size={15} />
        </Link>
      </section>
    </div>
  )
}

// A static, clearly-labelled illustration of a campaign page. Not live data.
function HeroPreview() {
  return (
    <div className="hero-preview" aria-hidden="true">
      <div className="preview-top">
        <span>Illustrative preview</span>
        <Badge tone="gold">Early campaign</Badge>
      </div>
      <div className="preview-company">
        <Monogram ticker="NGS" accent="#f2b134" />
        <div>
          <b>Northstar Grid Systems</b>
          <span>NGS · Energy infrastructure</span>
        </div>
      </div>
      <div className="preview-progress">
        <div className="preview-progress-head">
          <span>
            <Users size={13} /> 62 of 100 supporters
          </span>
          <span>62%</span>
        </div>
        <div className="progress-bar">
          <i style={{ width: '62%' }} />
        </div>
        <small>Interview request sent at 100 supporters</small>
      </div>
      <div className="preview-question">
        <div className="preview-vote">
          <ArrowUp size={14} />
          <b>38</b>
        </div>
        <div>
          <span className="tiny-label">Top question · Financial performance</span>
          <p>What assumptions support management’s target of reaching 30% gross margins by 2028?</p>
        </div>
      </div>
    </div>
  )
}
