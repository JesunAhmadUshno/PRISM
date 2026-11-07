// Known-answer self-check, run by `npm run build` (and by deploy.yml before the lab ships).
// Every expected value is read from the repo: tests/python/expected/*.json and tests/python/test_statistics.py.
import assert from 'node:assert/strict';
import { receipts } from './receipts.mjs';
import { segmentReversal, bh, fisherExact, pairedT, chiSquareGof, within, fdrSim } from './stats.js';

const R = receipts();
const close = (got, want, tol, what) => assert.ok(Math.abs(got - want) <= tol * Math.max(1, Math.abs(want)), `${what}: ${got} vs recorded ${want}`);

// 1. Berkeley segment reversal, six named departments and the full file with "Other".
for (const [name, rec] of [['six departments', R.berkeley.named], ['full file', R.berkeley.all]]) {
  const s = segmentReversal(rec.strata);
  assert.equal(s.eA, rec.eA, `${name} events a`); assert.equal(s.nB, rec.nB, `${name} n b`);
  close(s.crudeOr, rec.crudeOr, 1e-12, `${name} crude OR`);
  close(s.mhOr, rec.mhOr, 1e-12, `${name} Mantel-Haenszel OR`);
  close(s.agg, rec.aggEffect, 1e-12, `${name} aggregate gap`);
  close(s.pCmh, rec.pCmh, 1e-6 * rec.pCmh + 1e-12, `${name} CMH p`); // erfc fit: relative error < 1.2e-7
  assert.equal(s.reversedCount, rec.reversedCount, `${name} reversed strata`);
  s.rows.forEach((r, i) => assert.equal(r.reversed, rec.strata[i].reversed, `${name} ${r.level} reversed flag`));
}

// 2. Benjamini-Hochberg against a hand case: sorted 0.005, 0.01, 0.03, 0.04 -> 0.02, 0.02, 0.04, 0.04.
assert.deepEqual(bh([0.01, 0.04, 0.03, 0.005]).map((q) => +q.toFixed(12)), [0.02, 0.04, 0.04, 0.02]);
// Under the null, BH over all tests should rarely pass anything; selecting first should pass almost everything selected.
const sim = fdrSim({ m: R.w1.fdr.tests, seed: R.berkeley.thresholds.seed, reps: 400 });
assert.ok(sim.avg.anyBhAll < 0.1, `BH family-wise null pass rate ${sim.avg.anyBhAll}`);
assert.ok(sim.avg.bhSelected > 0.9 * sim.avg.raw, 'selection-then-BH should keep most selected nulls');

// 3. Known answers from tests/python/test_statistics.py, held to the test's own tolerance.
const pt = pairedT(R.stats.sleep1, R.stats.sleep2);
assert.equal(pt.df, R.stats.paired.df);
for (const c of R.stats.paired.checks) assert.ok(within(c.key === 'statistic' ? pt.t : pt.p, c), `paired t ${c.key}`);
const fe = fisherExact(R.stats.fisher.table);
for (const c of R.stats.fisher.checks) assert.ok(within(c.key === 'statistic' ? fe.oddsRatio : fe.p, c), `fisher ${c.key}: ${fe.p}`);
const gof = chiSquareGof(R.stats.gof.counts);
for (const c of R.stats.gof.checks) assert.ok(within(c.key === 'statistic' ? gof.stat : gof.p, c), `gof ${c.key}`);

// 4. Titanic replay totals agree with the detector's own check record.
assert.equal(R.titanic.findings.length, R.titanic.findingsCount);
assert.equal(R.claims.length, 10, 'README claim table rows');

console.log('stats ok', { mhOr: R.berkeley.named.mhOr, crudeOr: R.berkeley.named.crudeOr, fullMh: R.berkeley.all.mhOr, fullCrude: R.berkeley.all.crudeOr, pairedT: pt.t, pairedP: pt.p, fisherP: fe.p });
