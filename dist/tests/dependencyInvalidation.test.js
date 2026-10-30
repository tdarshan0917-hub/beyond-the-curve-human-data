import test from "node:test";
import assert from "node:assert/strict";
import { validateDerivedArtifact } from "../src/dependencyInvalidation.js";
function fact(overrides = {}) {
    return {
        id: "fact-001",
        state: "approved",
        version: 1,
        ...overrides
    };
}
function artifact(overrides = {}) {
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
test("artifact remains valid when all fact dependencies are unchanged and approved", () => {
    const result = validateDerivedArtifact(artifact(), [fact()]);
    assert.equal(result.valid, true);
    assert.deepEqual(result.blockers, []);
});
test("rejected fact invalidates downstream artifact", () => {
    const result = validateDerivedArtifact(artifact(), [fact({ state: "rejected" })]);
    assert.equal(result.valid, false);
    assert.match(result.blockers.join("\n"), /not approved/);
});
test("corrected fact invalidates downstream artifact", () => {
    const result = validateDerivedArtifact(artifact(), [fact({ state: "corrected", version: 2 })]);
    assert.equal(result.valid, false);
});
test("version change invalidates prior artifact approval", () => {
    const result = validateDerivedArtifact(artifact(), [fact({ version: 2 })]);
    assert.equal(result.valid, false);
    assert.match(result.blockers.join("\n"), /version changed/);
});
test("missing dependent fact invalidates artifact", () => {
    const result = validateDerivedArtifact(artifact(), []);
    assert.equal(result.valid, false);
    assert.match(result.blockers.join("\n"), /dependent fact is missing/);
});
test("artifact not approved cannot be treated as valid", () => {
    const result = validateDerivedArtifact(artifact({ approved: false }), [fact()]);
    assert.equal(result.valid, false);
});
