# Beyond the Curve Human Data

A synthetic human-in-the-loop evaluation and provenance architecture for high-stakes AI workflows.

This project grew from work on Beyond the Curve, a broader effort to build technology for people navigating consequential legal, reentry, and youth-development systems.

The public repository focuses on one technical question:

How should consequential information move through an AI-assisted system when human judgment, source provenance, correction rights, and downstream reliability matter?

## Core Principles

1. Human reviewers retain authority over consequential facts.
2. Approved information remains tied to the exact source snapshot reviewed.
3. Source changes invalidate stale approvals.
4. Rejected, disputed, corrected, or unresolved facts cannot silently move downstream.
5. Derived artifacts become invalid when their underlying reviewed data changes.
6. Every downstream gate can independently stop the pipeline.

## Current Architecture

    SOURCE SNAPSHOT
          |
          v
    HUMAN REVIEW
          |
          v
    PROVENANCE VALIDATION
          |
          v
    DEPENDENCY VALIDATION
          |
          v
    DOWNSTREAM USE

The current implementation contains four connected control layers.

### 1. Human Review Gate

Consequential data requires explicit human adjudication.

Supported review states:

- pending
- confirm_as_stated
- confirm_as_disputed
- reject
- correct

A consequential item cannot proceed unless it is explicitly approved and contains reviewer provenance and source information.

### 2. Lineage Validation

Review records, approved propositions, fact records, and downstream dependencies must refer to the same fact and source lineage.

A mismatch in fact identity, proposition text, source identity, or reviewed source hash blocks downstream use.

### 3. Provenance Validation

A prior human approval applies only to the exact source snapshot that was reviewed.

If either the source identifier or source hash changes, the previous approval is invalidated and the information must return to review.

### 4. Dependency Invalidation

Downstream artifacts retain explicit dependencies on reviewed facts and their versions.

If a dependent fact is rejected, corrected, disputed, removed, or version-changed, the previously approved downstream artifact is no longer considered valid.

## End-to-End Gate

Downstream use is permitted only when:

    human review passed
    AND
    identity and lineage remain consistent
    AND
    source provenance still matches
    AND
    all downstream dependencies remain approved and version-consistent

No single stage can override another.

## Tests

The repository currently contains 25 passing automated tests covering:

- approved consequential data
- pending review
- disputed facts
- rejected facts
- correction workflows
- missing reviewer provenance
- missing source provenance
- mismatched fact identity
- source-lineage mismatches
- unchanged source snapshots
- changed source hashes
- changed source identities
- missing sources
- downstream dependency changes
- version invalidation
- missing dependencies
- integrated end-to-end gate behavior

Run the complete quality check with:

    npm run check

## Privacy and Public-Safety Boundary

This public repository uses synthetic examples only.

It intentionally excludes:

- real parole or legal records
- personally identifying information
- private case files
- confidential user data
- production credentials
- production databases

The purpose of this repository is to demonstrate the architecture of human review, provenance, evaluation, and downstream quality control, not to publish sensitive source material.

## Relationship to Beyond the Curve

The architecture originated from development of Beyond the Curve's AI-assisted legal and reentry workflows.

The private research system is substantially broader and includes document processing, source verification, evaluation, legal-information workflows, and real-world research.

This public repository isolates the reusable Human Data architecture: how consequential facts are reviewed, attributed, corrected, invalidated, and permitted—or prevented—from moving downstream.

## Direction

Planned work includes:

- synthetic adversarial evaluation cases
- held-out evaluation fixtures
- explicit correction lineage
- reviewer disagreement handling
- richer provenance graphs
- quality metrics
- formal specification of selected safety invariants in Lean 4
- CI enforcement of TypeScript tests and formal checks

## Technical Stack

- TypeScript
- Node.js
- Node test runner
- Lean 4 planned for formal safety invariants

## Status

Early public research / engineering showcase.

Current automated test status:

25 passing / 0 failing
