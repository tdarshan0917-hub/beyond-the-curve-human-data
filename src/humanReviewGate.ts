export type ReviewDecision =
  | "pending"
  | "confirm_as_stated"
  | "confirm_as_disputed"
  | "reject"
  | "correct";

export type ReviewerRole =
  | "subject"
  | "professional_reviewer"
  | "trusted_assistant";

export interface HumanReviewItem {
  id: string;
  proposition: string;
  consequential: boolean;
  sourceId: string;
  sourceHash: string;
  supportingPassage: string;
  decision: ReviewDecision;
  reviewerId?: string;
  reviewerRole?: ReviewerRole;
  reviewedAt?: string;
  correctedProposition?: string;
}

export interface HumanReviewGate {
  status: "approved" | "blocked";
  downstreamUseAllowed: boolean;
  requiredReviews: number;
  approvedReviews: number;
  pendingReviews: number;
  disputedReviews: number;
  rejectedReviews: number;
  correctionReviews: number;
  blockers: string[];
}

function hasCompletedReviewMetadata(item: HumanReviewItem): boolean {
  return Boolean(
    item.reviewerId?.trim() &&
      item.reviewerRole &&
      item.reviewedAt?.trim()
  );
}

/**
 * Evaluate whether consequential human-data items may move downstream.
 *
 * Design principle:
 * model or system output must not silently promote consequential facts.
 * A consequential item may pass only after an explicit human confirmation
 * tied to a source snapshot and reviewer provenance.
 */
export function evaluateHumanReviewGate(
  items: HumanReviewItem[]
): HumanReviewGate {
  const consequential = items.filter((item) => item.consequential);

  let approvedReviews = 0;
  let pendingReviews = 0;
  let disputedReviews = 0;
  let rejectedReviews = 0;
  let correctionReviews = 0;

  const blockers: string[] = [];

  for (const item of consequential) {
    if (!item.sourceId.trim()) {
      blockers.push(`${item.id}: missing source identifier`);
    }

    if (!item.sourceHash.trim()) {
      blockers.push(`${item.id}: missing source hash`);
    }

    if (!item.supportingPassage.trim()) {
      blockers.push(`${item.id}: missing supporting passage`);
    }

    switch (item.decision) {
      case "confirm_as_stated":
        if (!hasCompletedReviewMetadata(item)) {
          blockers.push(`${item.id}: confirmation lacks reviewer provenance`);
        } else {
          approvedReviews += 1;
        }
        break;

      case "confirm_as_disputed":
        disputedReviews += 1;
        blockers.push(`${item.id}: fact remains disputed`);
        break;

      case "pending":
        pendingReviews += 1;
        blockers.push(`${item.id}: human review is pending`);
        break;

      case "reject":
        rejectedReviews += 1;
        blockers.push(`${item.id}: fact was rejected by human review`);
        break;

      case "correct":
        correctionReviews += 1;
        blockers.push(
          `${item.id}: correction requires a new reviewed source-bound proposition`
        );
        break;
    }
  }

  const downstreamUseAllowed =
    consequential.length > 0 &&
    blockers.length === 0 &&
    approvedReviews === consequential.length;

  return {
    status: downstreamUseAllowed ? "approved" : "blocked",
    downstreamUseAllowed,
    requiredReviews: consequential.length,
    approvedReviews,
    pendingReviews,
    disputedReviews,
    rejectedReviews,
    correctionReviews,
    blockers
  };
}
