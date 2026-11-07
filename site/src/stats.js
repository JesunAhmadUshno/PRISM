// Browser statistics for the lab. Each function mirrors a repo formula:
//   crude / Mantel-Haenszel OR, CMH  -> src/python/prism/detectors/segment_reversal.py
//   Benjamini-Hochberg               -> src/python/prism/multiplicity.py
//   Fisher exact, paired t, chi-square GOF -> the known answers in tests/python/test_statistics.py
// stats.check.mjs asserts these reproduce the recorded numbers before every build.

// erfc, Numerical Recipes Chebyshev fit, fractional error below 1.2e-7.
export function erfc(x) {
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
    t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
export const chi2Sf1 = (x) => erfc(Math.sqrt(x / 2)); // chi-square survival, 1 df
export const chi2Sf2 = (x) => Math.exp(-x / 2); // chi-square survival, 2 df (closed form)

// strata: [{ nA, nB, eA, eB }] with group a = the first comparison level (men in Berkeley).
export function segmentReversal(strata) {
  let nA = 0, nB = 0, eA = 0, eB = 0, num = 0, den = 0, obs = 0, exp = 0, v = 0;
  for (const s of strata) {
    const a = s.eA, b = s.nA - s.eA, c = s.eB, d = s.nB - s.eB, n = a + b + c + d;
    nA += s.nA; nB += s.nB; eA += s.eA; eB += s.eB;
    if (n <= 0) continue;
    num += (a * d) / n; den += (b * c) / n;
    if (n > 1) {
      const r1 = a + b, r2 = c + d, m1 = a + c, m0 = b + d;
      obs += a; exp += (r1 * m1) / n; v += (r1 * r2 * m1 * m0) / (n * n * (n - 1));
    }
  }
  const rateA = eA / nA, rateB = eB / nB, agg = rateA - rateB;
  const crudeOr = (eA * (nB - eB)) / ((nA - eA) * eB);
  const mhOr = num / den;
  const chi2 = v > 0 ? (obs - exp) ** 2 / v : 0;
  const rows = strata.map((s) => {
    const effect = s.eA / s.nA - s.eB / s.nB;
    return { ...s, rateA: s.eA / s.nA, rateB: s.eB / s.nB, effect, reversed: Math.sign(effect) !== Math.sign(agg) && effect !== 0 };
  });
  return { nA, nB, eA, eB, rateA, rateB, agg, crudeOr, mhOr, chi2, pCmh: chi2Sf1(chi2), rows, reversedCount: rows.filter((r) => r.reversed).length };
}

// Benjamini-Hochberg q-values, same order as input (step-up, monotone from the top).
export function bh(p) {
  const m = p.length, order = p.map((v, i) => i).sort((i, j) => p[i] - p[j]);
  const q = new Array(m);
  let run = 1;
  for (let k = m - 1; k >= 0; k--) { run = Math.min(run, (p[order[k]] * m) / (k + 1)); q[order[k]] = Math.min(run, 1); }
  return q;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// m true-null p-values (uniform). Compares raw p<alpha, BH over all m, and the first-draft
// mistake: keep only the ones that already look significant, then run BH over those alone.
export function fdrSim({ m, alpha = 0.05, q = 0.05, seed = 1, reps = 400 }) {
  const rnd = mulberry32(seed);
  const draw = () => Array.from({ length: m }, rnd);
  const one = (p) => {
    const raw = p.filter((x) => x < alpha);
    return { raw: raw.length, bhAll: bh(p).filter((x) => x <= q).length, bhSelected: raw.length ? bh(raw).filter((x) => x <= q).length : 0 };
  };
  const first = draw();
  const sample = one(first);
  const avg = { raw: 0, bhAll: 0, bhSelected: 0, anyBhAll: 0 };
  for (let r = 0; r < reps; r++) { const o = one(draw()); avg.raw += o.raw / reps; avg.bhAll += o.bhAll / reps; avg.bhSelected += o.bhSelected / reps; avg.anyBhAll += (o.bhAll > 0) / reps; }
  return { p: first, sample, avg, reps };
}

// Fisher exact test, two-sided, for [[a, b], [c, d]] (SciPy convention: sum of tables no more likely than the observed).
export function fisherExact([a, b, c, d]) {
  const r1 = a + b, c1 = a + c, n = a + b + c + d;
  const lf = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
  const lp = (x) => lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(x) - lf(r1 - x) - lf(c1 - x) - lf(n - r1 - c1 + x);
  const pObs = Math.exp(lp(a));
  let p = 0;
  for (let x = Math.max(0, r1 + c1 - n); x <= Math.min(r1, c1); x++) { const px = Math.exp(lp(x)); if (px <= pObs * (1 + 1e-7)) p += px; }
  return { oddsRatio: (a * d) / (b * c), p: Math.min(1, p) };
}

// Regularized incomplete beta via Lentz continued fraction (Numerical Recipes betacf).
function lgamma(x) {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5, ser = 1.000000000190015;
  tmp -= (x + 0.5) * Math.log(tmp);
  for (const c of g) ser += c / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
function betacf(a, b, x) {
  let c = 1, d = 1 - ((a + b) * x) / (a + 1); d = 1 / (Math.abs(d) < 1e-300 ? 1e-300 : d);
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a - 1 + m2) * (a + m2));
    d = 1 + aa * d; d = 1 / (Math.abs(d) < 1e-300 ? 1e-300 : d); c = 1 + aa / c; c = Math.abs(c) < 1e-300 ? 1e-300 : c; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2));
    d = 1 + aa * d; d = 1 / (Math.abs(d) < 1e-300 ? 1e-300 : d); c = 1 + aa / c; c = Math.abs(c) < 1e-300 ? 1e-300 : c;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return h;
}
function ibeta(a, b, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
export const tSf2 = (t, df) => ibeta(df / 2, 0.5, df / (df + t * t)); // two-sided p for Student t

export function pairedT(x, y) {
  const d = x.map((v, i) => v - y[i]), n = d.length;
  const mean = d.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(d.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
  const t = mean / (sd / Math.sqrt(n));
  return { t, df: n - 1, p: tSf2(t, n - 1), mean, diffs: d };
}

export function chiSquareGof(counts) {
  const e = counts.reduce((s, v) => s + v, 0) / counts.length;
  const stat = counts.reduce((s, v) => s + (v - e) ** 2 / e, 0);
  return { stat, df: counts.length - 1, p: counts.length === 3 ? chi2Sf2(stat) : NaN };
}

// Does a live value meet the test's own tolerance?
export const within = (got, c) => (c.kind === 'rel' ? Math.abs(got - c.value) <= c.tol * Math.abs(c.value) : Math.abs(got - c.value) <= c.tol);
