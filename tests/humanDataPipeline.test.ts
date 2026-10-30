import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateHumanDataPipeline
} from "../src/humanDataPipeline.js";

import type { HumanReviewItem } from "../src/humanReviewGate.js";
import type { ReviewedProposition, SourceSnapshot } from "../src/provenance.js";
import type { FactRecord, DerivedArtifact } from "../src/dependencyInvalidation.js";

function reviewItem(
  overrides: Partial<HumanReviewItem> = {}
): HumanReviewItem {
  return {
    id: "fact-001",
    proposition: "The participant completed a vocational program.",
    consequential: true,
    sourceId: "document-001",
    sourceHash: "sha256:original",
    supportingPassage:
      "The participant completed the vocational program in June.",
    decision: "confirm_as_stated",
    reviewerId: "reviewer-001",
    reviewerRole: "professional_reviewer",
    reviewedAt: "2026-10-29T12:00:00Z",
    ...overrides
  };
}

function reviewedProposition(
  overrides: Partial<ReviewedProposition> = {}
): ReviewedProposition {
  return {
    id: "fact-001",
    proposition: "The participant completed a vocational program.",
    approvedSourceId: "document-001",
    approvedSourceHash: "sha256:original",
    reviewerId: "reviewer-001",
    reviewedAt: "2026-10-29T12:00:00Z",
    ...overrides
  };
}

function source(
  overrides: Partial<SourceSnapshot> = {}
): SourceSnapshot {
  return {
    sourceId: "document-001",
    sourceHash: "sha256:original",
    ...overrides
  };
}

function fact(
  overrides: Partial<FactRecord> = {}
): FactRecord {
  return {
    id: "fact-001",
    state: "approved",
    version: 1,
    ...overrides
  };
}

function artifact(
  overrides: Partial<DerivedArtifact> = {}
): DerivedArtifact {
  return {
    id: "artifact-001",
    factDependencies: [
      {
        factId: "fact-001",
        factVersion: 1
      }
    ],
    approved: true,
    ...overrides
  };
}

test("fully reviewed, source-consistent data may pass the pipeline", () => {
  const result = evaluateHumanDataPipeline({
    reviewItems: [reviewItem()],
    reviewedProposition: reviewedProposition(),
    currentSource: source(),
    facts: [fact()],
    artifact: artifact()
  });

  assert.equal(result.allowed, true);
  assert.equal(result.reviewGatePassed, true);
  assert.equal(result.provenancePassed, true);
  assert.equal(result.artifactPassed, true);
  assert.deepEqual(result.blockers, []);
});

test("pending human review blocks the entire pipeline", () => {
  const result = evaluateHumanDataPipeline({
    reviewItems: [
      reviewItem({
        decision: "pending",
        reviewerId: undefined,
        reviewerRole: undefined,
        reviewedAt: undefined
      })
    ],
    reviewedProposition: reviewedProposition(),
    currentSource: source(),
    facts: [fact()],
    artifact: artifact()
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reviewGatePassed, false);
});

test("changed source invalidates the pipeline even after prior approval", () => {
  const result = evaluateHumanDataPipeline({
    reviewItems: [reviewItem()],
    reviewedProposition: reviewedProposition(),
    currentSource: source({
      sourceHash: "sha256:changed"
    }),
    facts: [fact()],
    artifact: artifact()
  });

  assert.equal(result.allowed, false);
  assert.equal(result.provenancePassed, false);
  assert.match(
    result.blockers.join("\n"),
    /source_hash_changed/
  );
});

test("corrected downstream fact invalidates an earlier approved artifact", () => {
  const result = evaluateHumanDataPipeline({
    reviewItems: [reviewItem()],
    reviewedProposition: reviewedProposition(),
    currentSource: source(),
    facts: [
      fact({
        state: "corrected",
        version: 2
      })
    ],
    artifact: artifact()
  });

  assert.equal(result.allowed, false);
  assert.equal(result.artifactPassed, false);
});

test("all three gates must pass simultaneously", () => {
  const result = evaluateHumanDataPipeline({
    reviewItems: [
      reviewItem({
        decision: "reject"
      })
    ],
    reviewedProposition: reviewedProposition(),
    currentSource: source({
      sourceHash: "sha256:changed"
    }),
    facts: [
      fact({
        state: "rejected"
      })
    ],
    artifact: artifact()
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reviewGatePassed, false);
  assert.equal(result.provenancePassed, false);
  assert.equal(result.artifactPassed, false);
  assert.ok(result.blockers.length >= 3);
});
