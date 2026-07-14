// Maps a persisted campaign status onto the six-stage campaign lifecycle shown
// on every company page. The mapping is deliberately conservative: a stage is
// marked done only when the persisted status proves the campaign moved past it,
// and the wording never implies management participation is guaranteed.

export const LIFECYCLE_STAGES = [
  'Shareholders build support',
  'Shareholders submit and rank questions',
  'GroundFloor prepares outreach',
  'GroundFloor contacts Investor Relations',
  'Management decides whether to participate',
  'Interview and transcript published',
] as const

export type StageState = 'done' | 'current' | 'upcoming'

export type LifecycleView = {
  stages: { title: string; state: StageState }[]
  /** Plain-English explanation of where the campaign is right now. */
  explanation: string
  /** What happens next, in restrained language. */
  nextStep: string
  /** Set for statuses that end or suspend the normal progression. */
  outcome?: 'completed' | 'declined' | 'paused'
}

function build(states: StageState[], explanation: string, nextStep: string, outcome?: LifecycleView['outcome']): LifecycleView {
  return {
    stages: LIFECYCLE_STAGES.map((title, index) => ({ title, state: states[index] ?? 'upcoming' })),
    explanation,
    nextStep,
    outcome,
  }
}

const VOLUNTARY = 'Management participation is voluntary — reaching the support target does not guarantee an interview.'

export function lifecycleForStatus(status: string): LifecycleView {
  switch (status) {
    case 'Gathering shareholder interest':
      return build(
        ['current', 'current', 'upcoming', 'upcoming', 'upcoming', 'upcoming'],
        'Shareholders are adding self-reported support and submitting and voting on the questions they most want answered.',
        `When the campaign reaches its supporter target, GroundFloor will prepare a formal outreach request. ${VOLUNTARY}`,
      )
    case 'Preparing management outreach':
      return build(
        ['done', 'done', 'current', 'upcoming', 'upcoming', 'upcoming'],
        'GroundFloor is preparing the formal interview request, including the top shareholder-ranked questions.',
        'Next, GroundFloor contacts the company’s Investor Relations team. ' + VOLUNTARY,
      )
    case 'Management contacted':
      return build(
        ['done', 'done', 'done', 'current', 'upcoming', 'upcoming'],
        'GroundFloor has sent the interview request to the company’s Investor Relations team.',
        'Management decides whether to participate. ' + VOLUNTARY,
      )
    case 'Management reviewing request':
      return build(
        ['done', 'done', 'done', 'done', 'current', 'upcoming'],
        'The company has received the request and is reviewing it.',
        'Management may accept, decline, or ask for more detail. ' + VOLUNTARY,
      )
    case 'Interview discussions underway':
      return build(
        ['done', 'done', 'done', 'done', 'current', 'upcoming'],
        'Discussions with the company about a possible interview are underway.',
        'If management agrees, an interview is scheduled. ' + VOLUNTARY,
      )
    case 'Interview scheduled':
      return build(
        ['done', 'done', 'done', 'done', 'done', 'current'],
        'Management agreed to participate and an interview has been scheduled.',
        'The interview and its transcript will be published here after it takes place.',
      )
    case 'Interview completed':
      return build(
        ['done', 'done', 'done', 'done', 'done', 'done'],
        'The interview took place.',
        'The interview record is published for all shareholders.',
        'completed',
      )
    case 'Management declined':
      return build(
        ['done', 'done', 'done', 'done', 'done', 'upcoming'],
        'Management reviewed the request and declined to participate at this time.',
        'The campaign record stays public: shareholder support and questions remain visible, and outreach may be revisited later.',
        'declined',
      )
    case 'Campaign paused':
      return build(
        ['upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming'],
        'This campaign is currently paused.',
        'Existing support and questions are preserved. The campaign can resume when there is renewed shareholder interest.',
        'paused',
      )
    default:
      // Unknown/future status: show the raw status without claiming progress.
      return build(
        ['upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming'],
        `Campaign status: ${status}.`,
        VOLUNTARY,
      )
  }
}
