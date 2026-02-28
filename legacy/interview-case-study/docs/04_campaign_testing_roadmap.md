# Campaign Testing Roadmap

## Testing Philosophy
Run structured, hypothesis-driven tests that produce operational decisions, not just metric movement.

## Prioritization Model

Score each test on:
- Impact potential (revenue or conversion influence)
- Confidence (data strength, prior evidence)
- Effort (creative, engineering, and ops complexity)

Use an ICE-style score to rank backlog each month.

## Core Experiment Types

1. Message framing tests
- Value prop emphasis, urgency, trust signals, objection handling

2. Timing and cadence tests
- Send-time optimization, delay windows, contact frequency tuning

3. Channel sequencing tests
- Email-first vs SMS-first vs push-assisted flows

4. Personalization depth tests
- Generic vs segment-specific vs behavior-dynamic content

5. Incentive strategy tests
- Incentive level, eligibility gating, and expiration windows

## Measurement Standards

- Define primary KPI and guardrail KPI before launch.
- Use holdout or control group whenever feasible.
- Require minimum sample size and confidence threshold.
- Log pre-launch assumptions and post-test interpretation.

## Example 90-Day Backlog

| Test | Hypothesis | Primary KPI | Guardrail | Owner |
|---|---|---|---|---|
| App start abandonment SMS reminder | Reminder within 2 hours increases completion | Completion rate | Opt-out rate | CRM Specialist |
| Push + SMS sequence for high intent segment | Sequenced prompts improve funded conversion | Funded conversion | Complaint rate | CRM Manager |
| Personalization in email hero module | Segment-specific content raises CTR | CTR | Unsubscribe rate | CRM Designer |
| Re-engagement win-back cadence | Lower frequency improves quality reactivation | Reactivation rate | Spam complaint rate | CRM Ops |

## Readout Cadence

- Weekly: in-flight test monitoring and anomaly checks.
- Bi-weekly: result reviews and scaling decisions.
- Monthly: backlog reprioritization with Product and Analytics.

