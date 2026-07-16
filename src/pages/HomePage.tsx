import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUp, ChevronRight, ShieldCheck } from 'lucide-react'
import { getDiscoverHighlights, type CompanySearchResult, type DiscoverHighlights } from '../lib/api'
import { track } from '../lib/analytics'
import { usePageMeta } from '../lib/meta'
import { SearchAutocomplete } from '../components/SearchAutocomplete'
import { CompanyCard } from '../components/CompanyCard'
import { TrustPrincipleList } from '../components/TrustPrincipleList'
import { Badge, Skeleton } from '../components/ui'

const howItWorks: [string, string][] = [
  ['Find a company', 'Search the directory or browse by sector.'],
  ['Support or start a campaign', 'Support an existing campaign as a self-reported shareholder, or start one.'],
  ['Submit and rank questions', 'Submit the questions you want answered. Shareholder votes determine which rise to the top.'],
  ['Open Floor prepares outreach', 'When a campaign reaches its supporter target, Open Floor assembles the top-ranked questions and contacts management.'],
  ['Management may choose to participate', 'Management decides whether and how to respond. Participation remains voluntary.'],
  ['The response is published', 'Any interview, written response, or transcript is published publicly for everyone.'],
]

const trustPrinciples: [string, string][] = [
  ['No investment advice', 'Nothing here is a recommendation to buy, sell, or hold anything.'],
  ['No guaranteed responses', 'Reaching a supporter target starts outreach. It does not obligate a company to respond.'],
  ['No issuer control over ranking', 'Companies cannot pay to reorder, remove, or prioritize questions.'],
  ['Self-reported shareholder status', 'Open Floor does not verify brokerage holdings. Support reflects what users report.'],
  ['Public, broadly distributed answers', 'When management participates, the response is published for everyone rather than sold or restricted.'],
  ['Clear disclosure of conflicts', 'Any founder or employee holdings, and any paid relationship, will be disclosed on the Transparency page.'],
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
    'Where shareholders decide what management should answer next',
    "Open Floor brings individual shareholders together around public companies to submit, rank, and support the questions they want management to answer.",
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
          <h1>Where retail shareholders get answers.</h1>
          <p>
            Open Floor brings individual shareholders together around public companies so they can submit, rank, and
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
            <ShieldCheck size={14} />
            <span>
              Management participation is voluntary and responses are never guaranteed. When a campaign reaches its
              supporter target, Open Floor contacts management with its highest-ranked shareholder questions.
            </span>
          </p>
        </div>
      </section>

      {/* 2. The problem — an editorial contrast, not three feature cards. */}
      <section className="problem-section">
        <ol className="problem-contrast">
          <li className="problem-side">
            <span className="problem-label">Institutional investors</span>
            <p>Often have direct access to company management through scheduled calls and meetings.</p>
          </li>
          <li className="problem-side">
            <span className="problem-label">Retail shareholders</span>
            <p>Typically rely on earnings calls, filings, and fragmented online discussion.</p>
          </li>
          <li className="problem-side problem-resolution">
            <span className="problem-label">Open Floor</span>
            <p>Gives individual shareholders a place to coordinate and rank the questions they want answered.</p>
          </li>
        </ol>
      </section>

      {/* 3. How it works — a connected process, not six cards in a grid. */}
      <section className="how-section">
        <div className="section-row">
          <div>
            <span className="eyebrow">How it works</span>
            <h2 className="display">From shareholder support to public answers.</h2>
          </div>
          <Link to="/how-it-works" className="text-link" onClick={() => track('homepage_how_it_works_clicked', {})}>
            Full details <ChevronRight size={15} />
          </Link>
        </div>
        <ol className="steps">
          {howItWorks.map(([title, copy], index) => (
            <li className="step" key={title}>
              <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
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
          <div className="live-launch">
            <div>
              <h3>Open Floor is newly launched.</h3>
              <p>Be among the first shareholders to support or start a campaign.</p>
            </div>
            <button className="btn primary" onClick={() => goToDiscover('live_empty_state')}>
              Find a company <ArrowRight size={15} />
            </button>
          </div>
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
            <span className="eyebrow">Illustrative example — not a real company or submitted question</span>
            <h2 className="display">What a strong shareholder question looks like.</h2>
          </div>
        </div>
        <div className="example-card" aria-hidden="true">
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
            Specific, answerable, and focused on a decision management controls. Votes from other shareholders rank it
            against the other questions submitted for the same company.
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
          <p>An individual question can be overlooked.</p>
          <p>
            A concentrated group of shareholders supporting the same clear questions creates a stronger, more credible
            signal for management to respond to.
          </p>
          <p>Open Floor organizes that signal into a ranked list management can answer publicly.</p>
        </div>
      </section>

      {/* 7. How we operate — durable operating rules, not six feature cards. */}
      <section className="trust-section">
        <div className="section-row">
          <div>
            <span className="eyebrow">How we operate</span>
            <h2 className="display">Trust principles.</h2>
          </div>
        </div>
        <TrustPrincipleList principles={trustPrinciples} />
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
