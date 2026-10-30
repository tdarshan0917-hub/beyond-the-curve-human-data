import { evaluateHumanReviewGate } from "./humanReviewGate.js";
import { validateReviewedProvenance } from "./provenance.js";
import { validateDerivedArtifact } from "./dependencyInvalidation.js";
/**
 * End-to-end gate for consequential human data.
 *
 * Downstream use is allowed only when:
 * 1. consequential facts have completed human review,
 * 2. reviewer approval still matches the current source snapshot,
 * 3. every downstream dependency remains approved and version-consistent.
 */
export function evaluateHumanDataPipeline(input) {
    const review = evaluateHumanReviewGate(input.reviewItems);
    const provenance = validateReviewedProvenance(input.reviewedProposition, input.currentSource);
    const artifact = validateDerivedArtifact(input.artifact, input.facts);
    const blockers = [
        ...review.blockers,
        ...(provenance.valid
            ? []
            : [`provenance: ${provenance.reason}`]),
        ...artifact.blockers
    ];
    const allowed = review.downstreamUseAllowed &&
        provenance.valid &&
        artifact.valid;
    return {
        allowed,
        reviewGatePassed: review.downstreamUseAllowed,
        provenancePassed: provenance.valid,
        artifactPassed: artifact.valid,
        blockers
    };
}
