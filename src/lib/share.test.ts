import { describe, expect, it } from 'vitest'
import { companyShareContent, questionShareContent, shareHref, withUtm } from './share'

const company = { name: 'Datadog, Inc.', ticker: 'DDOG' }
const url = 'https://openfloor.example/company/DDOG'

describe('withUtm', () => {
  it('tags the url with source and medium', () => {
    const tagged = new URL(withUtm(url, 'reddit'))
    expect(tagged.searchParams.get('utm_source')).toBe('reddit')
    expect(tagged.searchParams.get('utm_medium')).toBe('share')
  })

  it('returns the input unchanged when it is not a valid url', () => {
    expect(withUtm('not a url', 'x')).toBe('not a url')
  })
})

describe('share content', () => {
  it('company copy invites support without implying management agreed', () => {
    const content = companyShareContent(company, url)
    expect(content.text).toContain('DDOG')
    expect(content.text.toLowerCase()).toContain('voluntary')
    expect(content.text.toLowerCase()).not.toContain('guaranteed')
    expect(content.text.toLowerCase()).not.toContain('management has agreed')
  })

  it('question copy quotes the question and truncates long text', () => {
    const longText = 'Why '.repeat(60)
    const content = questionShareContent({ text: longText }, company, `${url}#q1`)
    expect(content.text).toContain('…')
    expect(content.text.length).toBeLessThan(longText.length + 120)
  })
})

describe('shareHref', () => {
  const content = companyShareContent(company, url)

  it('builds channel urls that carry the utm-tagged link', () => {
    for (const channel of ['reddit', 'x', 'linkedin'] as const) {
      const href = shareHref(channel, content)
      expect(href).toContain(encodeURIComponent(`utm_source=${channel}`))
    }
  })

  it('builds a mailto link with subject and body', () => {
    const href = shareHref('email', content)
    expect(href.startsWith('mailto:?subject=')).toBe(true)
    expect(href).toContain(encodeURIComponent('Shareholder campaign for Datadog, Inc.'))
  })
})
