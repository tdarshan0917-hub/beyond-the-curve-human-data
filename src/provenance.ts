export interface SourceSnapshot {
  sourceId: string;
  sourceHash: string;
}

export interface ReviewedProposition {
  id: string;
  proposition: string;
  approvedSourceId: string;
  approvedSourceHash: string;
  reviewerId: string;
  reviewedAt: string;
}

export interface ProvenanceCheck {
  valid: boolean;
  reason:
    | "valid"
    | "source_id_changed"
    | "source_hash_changed"
    | "missing_current_source";
}

/**
 * A human approval is valid only for the exact source snapshot
 * that was reviewed.
 *
 * If the underlying source changes, the prior approval must be
 * invalidated and sent back through human review.
 */
export function validateReviewedProvenance(
  reviewed: ReviewedProposition,
  currentSource?: SourceSnapshot
): ProvenanceCheck {
  if (!currentSource) {
    return {
      valid: false,
      reason: "missing_current_source"
    };
  }

  if (reviewed.approvedSourceId !== currentSource.sourceId) {
    return {
      valid: false,
      reason: "source_id_changed"
    };
  }

  if (reviewed.approvedSourceHash !== currentSource.sourceHash) {
    return {
      valid: false,
      reason: "source_hash_changed"
    };
  }

  return {
    valid: true,
    reason: "valid"
  };
}
