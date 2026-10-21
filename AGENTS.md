# Agent instructions

## Project principles

Product and engineering decisions follow `docs/principles.md` in its stated
priority order.

Use browser Fast Refresh for normal development. Run native and release gates
with local Expo commands (`expo run:ios` and `expo run:android`). Do not use
EAS Build or add EAS configuration.

## Communication

- Talk in ASD-STE100 Simplified Technical English, and use the ubiquitous language from `GLOSSARY.md`.

## Agent skills

### Issue tracker

Issues are tracked as local Markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five default canonical role names. See `docs/agents/triage-labels.md`.

### Domain docs

Domain documentation uses the single-context layout. See `docs/agents/domain.md`.

Write glossary entries as short, positive definitions. Use an `Avoid` / `Не называть`
line only for a specific ambiguity that the definition cannot resolve; treat this
line as optional in skill templates.
