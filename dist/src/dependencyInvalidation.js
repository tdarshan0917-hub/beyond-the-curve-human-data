/**
 * A downstream artifact is valid only if every consequential fact it depends on:
 * - still exists,
 * - remains approved,
 * - and is still at the same reviewed version.
 *
 * Corrections, rejections, disputes, or version changes invalidate prior approval.
 */
export function validateDerivedArtifact(artifact, facts) {
    const byId = new Map(facts.map((fact) => [fact.id, fact]));
    const blockers = [];
    for (const dependency of artifact.factDependencies) {
        const fact = byId.get(dependency.factId);
        if (!fact) {
            blockers.push(`${dependency.factId}: dependent fact is missing`);
            continue;
        }
        if (fact.state !== "approved") {
            blockers.push(`${dependency.factId}: dependent fact is ${fact.state}, not approved`);
        }
        if (fact.version !== dependency.factVersion) {
            blockers.push(`${dependency.factId}: reviewed fact version changed from ${dependency.factVersion} to ${fact.version}`);
        }
    }
    return {
        valid: artifact.approved && blockers.length === 0,
        blockers
    };
}
