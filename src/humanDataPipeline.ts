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
  lineagePassed: boolean;
  provenancePassed: boolean;
  artifactPassed: boolean;
  blockers: string[];
}

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

  const lineageBlockers: string[] = [];

  const matchingReview = input.reviewItems.find(
    (item) => item.id === input.reviewedProposition.id
  );

  const matchingFact = input.facts.find(
    (fact) => fact.id === input.reviewedProposition.id
  );

  const matchingDependency = input.artifact.factDependencies.find(
    (dependency) =>
      dependency.factId === input.reviewedProposition.id
  );

  if (!matchingReview) {
    lineageBlockers.push(
      `${input.reviewedProposition.id}: no matching human review item`
    );
  }

  if (!matchingFact) {
    lineageBlockers.push(
      `${input.reviewedProposition.id}: no matching fact record`
    );
  }

  if (!matchingDependency) {
    lineageBlockers.push(
      `${input.reviewedProposition.id}: artifact does not depend on reviewed fact`
    );
  }

  if (
    matchingReview &&
    matchingReview.proposition !== input.reviewedProposition.proposition
  ) {
    lineageBlockers.push(
      `${input.reviewedProposition.id}: proposition changed across review stages`
    );
  }

  if (
    matchingReview &&
    matchingReview.sourceId !== input.reviewedProposition.approvedSourceId
  ) {
    lineageBlockers.push(
      `${input.reviewedProposition.id}: source identity mismatch`
    );
  }

  if (
    matchingReview &&
    matchingReview.sourceHash !== input.reviewedProposition.approvedSourceHash
  ) {
    lineageBlockers.push(
      `${input.reviewedProposition.id}: reviewed source hash mismatch`
    );
  }

  const lineagePassed = lineageBlockers.length === 0;

  const blockers: string[] = [
    ...review.blockers,
    ...lineageBlockers,
    ...(provenance.valid
      ? []
      : [`provenance: ${provenance.reason}`]),
    ...artifact.blockers
  ];

  const allowed =
    review.downstreamUseAllowed &&
    lineagePassed &&
    provenance.valid &&
    artifact.valid;

  return {
    allowed,
    reviewGatePassed: review.downstreamUseAllowed,
    lineagePassed,
    provenancePassed: provenance.valid,
    artifactPassed: artifact.valid,
    blockers
  };
}
