import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateHumanReviewGate,
  type HumanReviewItem
} from "../src/humanReviewGate.js";

function reviewedItem(
  overrides: Partial<HumanReviewItem> = {}
): HumanReviewItem {
  return {
    id: "fact-001",
    proposition: "The participant completed a vocational program.",
    consequential: true,
    sourceId: "synthetic-document-001",
    sourceHash: "sha256:synthetic-example",
    supportingPassage:
      "The participant completed the vocational program in June.",
    decision: "confirm_as_stated",
    reviewerId: "reviewer-001",
    reviewerRole: "professional_reviewer",
    reviewedAt: "2026-10-29T12:00:00Z",
    ...overrides
  };
}

test("confirmed consequential data may pass downstream", () => {
  const gate = evaluateHumanReviewGate([reviewedItem()]);

  assert.equal(gate.status, "approved");
  assert.equal(gate.downstreamUseAllowed, true);
  assert.equal(gate.approvedReviews, 1);
  assert.deepEqual(gate.blockers, []);
});

test("pending consequential data blocks downstream use", () => {
  const gate = evaluateHumanReviewGate([
    reviewedItem({
      decision: "pending",
      reviewerId: undefined,
      reviewerRole: undefined,
      reviewedAt: undefined
    })
  ]);

  assert.equal(gate.status, "blocked");
  assert.equal(gate.downstreamUseAllowed, false);
  assert.equal(gate.pendingReviews, 1);
});

test("rejected consequential data blocks downstream use", () => {
  const gate = evaluateHumanReviewGate([
    reviewedItem({ decision: "reject" })
  ]);

  assert.equal(gate.downstreamUseAllowed, false);
  assert.equal(gate.rejectedReviews, 1);
});

test("a requested correction blocks until the corrected proposition is reviewed again", () => {
  const gate = evaluateHumanReviewGate([
    reviewedItem({
      decision: "correct",
      correctedProposition:
        "The participant completed part of a vocational program."
    })
  ]);

  assert.equal(gate.downstreamUseAllowed, false);
  assert.equal(gate.correctionReviews, 1);
});

test("a disputed fact remains blocked", () => {
  const gate = evaluateHumanReviewGate([
    reviewedItem({ decision: "confirm_as_disputed" })
  ]);

  assert.equal(gate.downstreamUseAllowed, false);
  assert.equal(gate.disputedReviews, 1);
});

test("confirmation without reviewer provenance is blocked", () => {
  const gate = evaluateHumanReviewGate([
    reviewedItem({
      reviewerId: undefined,
      reviewedAt: undefined
    })
  ]);

  assert.equal(gate.downstreamUseAllowed, false);
  assert.match(
    gate.blockers.join("\n"),
    /confirmation lacks reviewer provenance/
  );
});

test("missing source provenance blocks downstream use", () => {
  const gate = evaluateHumanReviewGate([
    reviewedItem({
      sourceHash: "",
      supportingPassage: ""
    })
  ]);

  assert.equal(gate.downstreamUseAllowed, false);
  assert.match(gate.blockers.join("\n"), /missing source hash/);
  assert.match(gate.blockers.join("\n"), /missing supporting passage/);
});

test("non-consequential data does not require human approval", () => {
  const gate = evaluateHumanReviewGate([
    reviewedItem(),
    reviewedItem({
      id: "fact-002",
      consequential: false,
      decision: "pending",
      reviewerId: undefined,
      reviewerRole: undefined,
      reviewedAt: undefined
    })
  ]);

  assert.equal(gate.downstreamUseAllowed, true);
  assert.equal(gate.requiredReviews, 1);
  assert.equal(gate.approvedReviews, 1);
});
