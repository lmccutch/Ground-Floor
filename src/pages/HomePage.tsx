import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUp, ChevronRight, ShieldCheck, Users } from 'lucide-react'
import { getDiscoverHighlights, type CompanySearchResult, type DiscoverHighlights } from '../lib/api'
import { track } from '../lib/analytics'
import { usePageMeta } from '../lib/meta'
import { SearchAutocomplete } from '../components/SearchAutocomplete'
import { CompanyCard } from '../components/CompanyCard'
import { Badge, EmptyState, Skeleton } from '../components/ui'

const howItWorks: [string, string][] = [
  ['Find a company', 'Search the directory or browse by sector.'],
  ['Support or start a campaign', 'Add your self-reported shareholder status to an existing campaign, or start one.'],
  ['Submit and rank questions', 'Write the questions you want answered. Votes decide which rise to the top.'],
  ['GroundFloor prepares outreach', 'Once a campaign shows meaningful support, we assemble the top-ranked questions.'],
  ['Management may choose to participate', 'Participation is voluntary. It is never guaranteed.'],
  ['Interview and transcript published', 'If management participates, the full record is public.'],
]

const trustPrinciples: [string, string][] = [
  ['No investment advice', 'Nothing here is a recommendation to buy, sell, or hold anything.'],
  ['No guaranteed interviews', 'Reaching a supporter target starts outreach — it does not obligate a company to respond.'],
  ['No issuer control over ranking', 'Companies cannot pay to reorder, remove, or prioritize questions.'],
  ['Self-reported shareholder status', 'We do not verify brokerage holdings. Support reflects what users tell us.'],
  ['Public, broadly distributed answers', 'When management participates, the record is published for everyone — not sold or restricted.'],
  ['Clear disclosure of conflicts', 'Founder or employee holdings, and any paid relationship, would be disclosed — see Transparency.'],
]

function mergeHighlights(highlights: DiscoverHighlights, limit: number): CompanySearchResult[] {
  const seen = new Set<string>()
  const merged: CompanySearchResult[] = []
  for (const list of [highlights.nearThreshold, highlights.mostSupported, highlights.newest]) {
    for (const company of list) {
      if (seen.has(company.id)) continue
      seen.add(company.id)
      merged.push(company)
      if (merged.length >= limit) return merged
    }
  }
  return merged
}

export function HomePage() {
  const navigate = useNavigate()
  usePageMeta(
    'Where shareholders decide what management answers next',
    "GroundFloor brings individual shareholders together around public companies to submit, rank, and support the questions they want management to answer.",
    '/',
  )

  const [live, setLive] = useState<CompanySearchResult[] | 'error' | null>(null)
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    track('homepage_viewed', {})
  }, [])

  useEffect(() => {
    let cancelled = false
    getDiscoverHighlights()
      .then(highlights => {
        if (!cancelled) setLive(mergeHighlights(highlights, 3))
      })
      .catch(() => {
        if (!cancelled) setLive('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function goToDiscover(source: string) {
    track('homepage_primary_cta_clicked', { source })
    navigate('/discover')
  }

  function goToHowItWorks(event: 'homepage_secondary_cta_clicked' | 'homepage_how_it_works_clicked') {
    track(event, {})
    navigate('/how-it-works')
  }

  function trustLinkClicked(target: string) {
    track('homepage_trust_link_clicked', { target })
  }

  return (
    <div className="home-page">
      {/* 1. Hero — answers what/why/how immediately, no metrics or cards. */}
      <section className="hero">
        <div className="hero-copy">
          <h1>Where shareholders decide what management answers next.</h1>
          <p>
            GroundFloor brings individual shareholders together around public companies so they can submit, rank, and
            support the questions they want management to answer.
          </p>
          <div className="hero-search">
            <SearchAutocomplete
              placeholder="Search companies or tickers, e.g. SOFI"
              onSearchStarted={() => track('homepage_search_started', {})}
              onResultSelected={result => track('homepage_search_result_clicked', { ticker: result.ticker })}
            />
          </div>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => goToDiscover('hero_primary')}>
              Find a company <ChevronRight size={16} />
            </button>
            <button className="btn ghost" onClick={() => goToHowItWorks('homepage_secondary_cta_clicked')}>
              See how it works
            </button>
          </div>
          <p className="hero-trust-note">
            <ShieldCheck size={14} /> Management participation is voluntary and never guaranteed.
          </p>
        </div>
      </section>

      {/* 2. The problem — the access gap, kept short. */}
      <section className="problem-section">
        <div className="problem-grid">
          <p>Institutional investors regularly get scheduled calls with company management.</p>
          <p>Individual shareholders are left with earnings calls, filings, and fragmented online discussion.</p>
          <p className="problem-resolution">GroundFloor helps shareholders coordinate the questions they want answered.</p>
        </div>
      </section>

      {/* 3. How it works — the real lifecycle, linking to the full explanation. */}
      <section className="how-section">
        <div className="section-row">
          <div>
            <span className="eyebrow">How it works</span>
            <h2 className="display">The real process, no shortcuts.</h2>
          </div>
          <Link to="/how-it-works" className="text-link" onClick={() => track('homepage_how_it_works_clicked', {})}>
            Full details <ChevronRight size={15} />
          </Link>
        </div>
        <ol className="steps">
          {howItWorks.map(([title, copy], index) => (
            <li className="step" key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Live participation — real data only; honest empty state, no fabrication. */}
      <section className="live-section">
        <div className="section-row">
          <div>
            <span className="eyebrow">Live participation</span>
            <h2 className="display">Real campaigns, real shareholders.</h2>
          </div>
          <Link to="/discover" className="text-link">
            View all <ChevronRight size={15} />
          </Link>
        </div>
        {live === null ? (
          <div className="company-grid">
            <Skeleton height={210} />
            <Skeleton height={210} />
            <Skeleton height={210} />
          </div>
        ) : live === 'error' ? (
          <p className="section-note">Live campaigns could not be loaded right now — try the Discover page.</p>
        ) : live.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="No campaigns have real shareholder support yet."
            copy="Be the first: find a company and start its campaign."
            action={
              <button className="btn primary" onClick={() => goToDiscover('live_empty_state')}>
                Find a company <ArrowRight size={15} />
              </button>
            }
          />
        ) : (
          <div className="company-grid">
            {live.map(company => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Example interaction — clearly illustrative, no real company or fabricated activity. */}
      <section className="example-section">
        <div className="section-row">
          <div>
            <span className="eyebrow">Illustrative example</span>
            <h2 className="display">What a strong shareholder question looks like.</h2>
          </div>
        </div>
        <div className="example-card" aria-hidden="true">
          <span className="example-tag">Illustrative example — not a real question or company</span>
          <div className="example-question">
            <div className="example-vote">
              <ArrowUp size={16} />
              <span>Vote to rank</span>
            </div>
            <div>
              <Badge tone="neutral">Capital allocation</Badge>
              <p>
                “What specific criteria determine whether excess cash goes toward buybacks, debt reduction, or reinvestment
                over the next two years?”
              </p>
            </div>
          </div>
          <p className="example-note">
            Specific, answerable, and about a decision management actually controls. Votes from other shareholders rank it
            against every other question submitted for the same company.
          </p>
        </div>
      </section>

      {/* 6. Why collective participation matters — no activist language. */}
      <section className="why-section">
        <div className="section-row">
          <div>
            <span className="eyebrow">Why this matters</span>
            <h2 className="display">One question is easy to miss. A ranked list is not.</h2>
          </div>
        </div>
        <div className="why-grid">
          <p>One investor asking a question alone has limited leverage — it's easy for a company to overlook.</p>
          <p>A concentrated group of shareholders behind the same clear questions creates a harder signal to ignore.</p>
          <p>GroundFloor organizes that signal into a ranked list management can respond to publicly.</p>
        </div>
      </section>

      {/* 7. Trust principles — links to the full policies. */}
      <section className="trust-section">
        <div className="section-row">
          <div>
            <span className="eyebrow">How we operate</span>
            <h2 className="display">Trust principles.</h2>
          </div>
        </div>
        <div className="trust-principles-grid">
          {trustPrinciples.map(([title, copy]) => (
            <div className="trust-principle" key={title}>
              <ShieldCheck size={15} />
              <div>
                <b>{title}</b>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="trust-section-links">
          <Link to="/transparency" onClick={() => trustLinkClicked('transparency')}>
            Transparency
          </Link>
          <Link to="/guidelines" onClick={() => trustLinkClicked('guidelines')}>
            Community Guidelines
          </Link>
          <Link to="/disclaimer" onClick={() => trustLinkClicked('disclaimer')}>
            Investment Disclaimer
          </Link>
        </div>
      </section>

      {/* 8. Final CTA — direct closing action. */}
      <section className="request-band">
        <div>
          <h2>Find a company you own or follow.</h2>
          <p>Search the directory, or request a company we don't cover yet.</p>
        </div>
        <button
          className="btn gold"
          onClick={() => {
            track('homepage_final_cta_clicked', {})
            navigate('/discover')
          }}
        >
          Find a company <ChevronRight size={15} />
        </button>
      </section>
    </div>
  )
}
