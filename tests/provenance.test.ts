import test from "node:test";
import assert from "node:assert/strict";

import {
  validateReviewedProvenance,
  type ReviewedProposition,
  type SourceSnapshot
} from "../src/provenance.js";

function reviewed(): ReviewedProposition {
  return {
    id: "fact-001",
    proposition: "The participant completed a vocational program.",
    approvedSourceId: "document-001",
    approvedSourceHash: "sha256:original",
    reviewerId: "reviewer-001",
    reviewedAt: "2026-10-29T12:00:00Z"
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

test("approval remains valid when the exact source snapshot is unchanged", () => {
  const result = validateReviewedProvenance(reviewed(), source());

  assert.equal(result.valid, true);
  assert.equal(result.reason, "valid");
});

test("changed source hash invalidates prior human approval", () => {
  const result = validateReviewedProvenance(
    reviewed(),
    source({ sourceHash: "sha256:changed" })
  );

  assert.equal(result.valid, false);
  assert.equal(result.reason, "source_hash_changed");
});

test("changed source identifier invalidates prior human approval", () => {
  const result = validateReviewedProvenance(
    reviewed(),
    source({ sourceId: "document-002" })
  );

  assert.equal(result.valid, false);
  assert.equal(result.reason, "source_id_changed");
});

test("missing current source invalidates prior human approval", () => {
  const result = validateReviewedProvenance(reviewed(), undefined);

  assert.equal(result.valid, false);
  assert.equal(result.reason, "missing_current_source");
});
