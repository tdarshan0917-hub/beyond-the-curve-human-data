/**
 * A human approval is valid only for the exact source snapshot
 * that was reviewed.
 *
 * If the underlying source changes, the prior approval must be
 * invalidated and sent back through human review.
 */
export function validateReviewedProvenance(reviewed, currentSource) {
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
