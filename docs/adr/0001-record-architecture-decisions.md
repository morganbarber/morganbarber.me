# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-09-25

## Context

Several choices in this codebase are deliberate trade-offs that look like
mistakes out of context: every page renders dynamically, deploy state lives on a
laptop, there is no test framework. Their rationale lived only in code comments,
where it is found only by someone already reading that exact file.

## Decision

Significant decisions are recorded as ADRs in `docs/adr/`, numbered, immutable
once accepted (superseded rather than edited), and added in the PR that
implements them.

## Consequences

A reviewer proposing to "fix" one of these trade-offs can find the reasoning
first. The cost is a short document per decision.
