// Build-time reader. Everything the lab shows comes from repo files through this module,
// so a number on the page cannot drift from its source without the build noticing.
// Used by vite.config.js (injected as __RECEIPTS__) and by stats.check.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const must = (m, what) => { if (!m) throw new Error(`receipts: could not parse ${what}`); return m; };
// The three literal shapes the tests use: 4.0621, 17.0 / 35.0, math.exp(-5.0). Anything else fails the build.
function num(s) {
  let m;
  if ((m = s.match(/^(-?[\d.]+(?:e-?\d+)?)$/))) return +m[1];
  if ((m = s.match(/^(-?[\d.]+) \/ ([\d.]+)$/))) return +m[1] / +m[2];
  if ((m = s.match(/^math\.exp\((-?[\d.]+)\)$/))) return Math.exp(+m[1]);
  throw new Error(`receipts: unknown literal ${s}`);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); } else out.push(p);
  }
  return out;
}

function testStatistics() {
  const src = read('tests/python/test_statistics.py');
  const arr = (name) => must(src.match(new RegExp(`${name} = \\[([^\\]]+)\\]`)), name)[1].split(',').map(Number);
  const consts = Object.fromEntries([...src.matchAll(/^(EXACT|PUBLISHED_4SF) = ([\d.e-]+)/gm)].map((m) => [m[1], +m[2]]));
  const body = (fn) => must(src.match(new RegExp(`def ${fn}\\(engine\\):([\\s\\S]*?)(?=\\ndef |$)`)), fn)[1];
  const approx = (b) => [...b.matchAll(/\["(statistic|pValue)"\] == pytest\.approx\(([^,]+), (abs|rel)=([\w.-]+)\)/g)]
    .map((m) => ({ key: m[1], value: num(m[2]), expr: m[2], kind: m[3], tol: consts[m[4]] ?? +m[4] }));
  const paired = body('test_paired_t_matches_published_sleep_data_result');
  const fisher = body('test_fisher_exact_matches_the_tea_tasting_table');
  const gof = body('test_chi_square_goodness_of_fit_matches_closed_form');
  return {
    sleep1: arr('SLEEP_DRUG_1'),
    sleep2: arr('SLEEP_DRUG_2'),
    paired: { checks: approx(paired), df: +must(paired.match(/degreesOfFreedom"\] == (\d+)/), 'paired df')[1] },
    // Cell counts in the order the test builds them: milk/milk, milk/tea, tea/milk, tea/tea.
    fisher: { table: [...fisher.matchAll(/\("(?:milk|tea)", "guessed_\w+"\)\] \* (\d+)/g)].map((m) => +m[1]), checks: approx(fisher) },
    gof: { counts: ['a', 'b', 'c'].map((k) => +must(gof.match(new RegExp(`\\["${k}"\\] \\* (\\d+)`)), `gof ${k}`)[1]), checks: approx(gof) },
  };
}

function claims() {
  const src = read('README.md');
  return [...src.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)].map((m) => ({ n: +m[1], claim: m[2], status: m[3], verify: m[4] }));
}

function w1() {
  const src = read('docs/vision/07_W1_RESULT.md').replace(/\s+/g, ' ');
  const bickel = must(src.match(/department C women admitted (\d+) against (\d+) published, department F (\d+) against (\d+)\./), 'Bickel cells');
  const paperOr = must(src.match(/the published table gives ([\d.]+)/), 'published OR');
  const fdr = must(src.match(/On random data that produced (\w+) "interaction" findings from (\d+) tests\./), 'W1 finding 3');
  const calib = must(src.match(/calibrated \(([\d.]+)% and ([\d.]+)% rejection under the null/), 'calibration');
  return {
    bickel: { cWomenFile: +bickel[1], cWomenPaper: +bickel[2], fWomenFile: +bickel[3], fWomenPaper: +bickel[4], paperOr: +paperOr[1], quote: bickel[0] },
    fdr: { falseFindingsWord: fdr[1], tests: +fdr[2], quote: fdr[0] },
    calibration: { breslowDay: +calib[1], cmh: +calib[2] },
  };
}

function titanic() {
  const t = json('tests/python/expected/titanic.json');
  const sr = t.run.checks.find((c) => c.detector === 'segment_reversal');
  return {
    rows: t.dataset.rows, testsRun: sr.tests_run, findingsCount: sr.findings, skipped: sr.skipped,
    findings: t.run.findings.map((f) => {
      const a = f.evidence.aggregates, s = f.slots;
      return {
        id: f.id, severity: f.severity, grade: a.grade, x: s.x_column, a: s.a, b: s.b, y: s.y_column, z: s.z_column,
        q: a.q_value, pAdj: a.p_adjusted_effect, agg: a.aggregate_effect, adj: a.adjusted_effect, meanA: a.mean_a, meanB: a.mean_b,
        binary: a.events_a != null, zOutcome: a.z_reads_as_outcome, reason: a.reason, alsoHolds: a.also_holds_for,
        strata: a.strata.map((r) => ({ level: r.level, nA: r.n_a, nB: r.n_b, meanA: r.mean_a, meanB: r.mean_b, effect: r.effect, reversed: r.reversed })),
      };
    }),
  };
}

function berkeley() {
  const b = json('tests/python/expected/berkeley.json');
  const f = b.run.findings.find((x) => x.detector === 'segment_reversal');
  const a = f.evidence.aggregates, w = a.without_catchall;
  const strata = (list) => list.map((s) => ({ level: s.level, nA: s.n_a, nB: s.n_b, eA: s.events_a, eB: s.events_b, reversed: s.reversed }));
  const pick = (x) => ({ grade: x.grade, nA: x.n_a, nB: x.n_b, eA: x.events_a, eB: x.events_b, crudeOr: x.crude_odds_ratio, mhOr: x.adjusted_odds_ratio,
    pCmh: x.p_adjusted_effect, reversedCount: x.reversed_count, reversedShare: x.reversed_share, stability: x.stability, aggEffect: x.aggregate_effect, adjEffect: x.adjusted_effect });
  return {
    rows: b.dataset.rows, sha256: b.dataset.sha256, x: f.slots.x_column, y: f.slots.y_column, z: f.slots.z_column,
    all: { ...pick(a), gradeAllRows: a.grade_all_rows, catchallShare: a.catchall_share, catchall: a.catchall_levels, strata: strata(a.strata) },
    named: { ...pick(w), strata: strata(w.strata) },
    thresholds: a.thresholds,
    duplicates: b.run.checks.find((c) => c.detector === 'duplicates'),
  };
}

function repo() {
  const files = walk('tests').concat(walk('src'));
  const py = files.filter((f) => /tests\/python\/test_.*\.py$/.test(f));
  const pyTests = py.reduce((n, f) => n + (read(f).match(/^def test_/gm) || []).length, 0);
  const ts = files.filter((f) => /\.test\.tsx?$/.test(f));
  const a11y = ts.filter((f) => /\.a11y\.test\./.test(f));
  const workflows = fs.readdirSync(path.join(ROOT, '.github/workflows')).filter((f) => /\.ya?ml$/.test(f)).sort();
  return { pyModules: py.length, pyTests, vitestFiles: ts.length - a11y.length, a11yFiles: a11y.length, workflows };
}

export function receipts() {
  return { berkeley: berkeley(), titanic: titanic(), stats: testStatistics(), claims: claims(), w1: w1(), repo: repo() };
}
