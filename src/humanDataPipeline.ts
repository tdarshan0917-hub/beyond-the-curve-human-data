import {
  evaluateHumanReviewGate,
  type HumanReviewItem
} from "./humanReviewGate.js";

import {
  validateReviewedProvenance,
  type ReviewedProposition,
  type SourceSnapshot
} from "./provenance.js";

import {
  validateDerivedArtifact,
  type FactRecord,
  type DerivedArtifact
} from "./dependencyInvalidation.js";

export interface HumanDataPipelineInput {
  reviewItems: HumanReviewItem[];
  reviewedProposition: ReviewedProposition;
  currentSource?: SourceSnapshot;
  facts: FactRecord[];
  artifact: DerivedArtifact;
}

export interface HumanDataPipelineResult {
  allowed: boolean;
  reviewGatePassed: boolean;
  provenancePassed: boolean;
  artifactPassed: boolean;
  blockers: string[];
}

/**
 * End-to-end gate for consequential human data.
 *
 * Downstream use is allowed only when:
 * 1. consequential facts have completed human review,
 * 2. reviewer approval still matches the current source snapshot,
 * 3. every downstream dependency remains approved and version-consistent.
 */
export function evaluateHumanDataPipeline(
  input: HumanDataPipelineInput
): HumanDataPipelineResult {
  const review = evaluateHumanReviewGate(input.reviewItems);

  const provenance = validateReviewedProvenance(
    input.reviewedProposition,
    input.currentSource
  );

  const artifact = validateDerivedArtifact(
    input.artifact,
    input.facts
  );

  const blockers: string[] = [
    ...review.blockers,
    ...(provenance.valid
      ? []
      : [`provenance: ${provenance.reason}`]),
    ...artifact.blockers
  ];

  const allowed =
    review.downstreamUseAllowed &&
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
