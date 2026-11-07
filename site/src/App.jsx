import { useMemo, useState, useEffect, useId } from 'react';
import { segmentReversal, fdrSim, bh, fisherExact, pairedT, chiSquareGof, within } from './stats.js';

// Built at compile time from repo files by receipts.mjs (see vite.config.js). Nothing below is typed by hand.
const R = __RECEIPTS__; // eslint-disable-line no-undef
const B = R.berkeley;
const REPO = 'https://github.com/JesunAhmadUshno/PRISM';
const blob = (p) => `${REPO}/blob/main/${p}`;
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const fp = (p) => (p < 1e-4 ? p.toExponential(1) : p.toFixed(4));
const code = (s) => s.split('`').map((t, i) => (i % 2 ? <code key={i}>{t}</code> : t));

const SECTIONS = [['top', 'Overview', '◎'], ['simpson', 'Simpson lab', '⇅'], ['catchall', 'Catch-all', '▤'], ['fdr', 'False discoveries', '∑'],
  ['titanic', 'Titanic replay', '▶'], ['known', 'Known answers', '✓'], ['claims', 'Claims', '§'], ['limits', 'Limits', '!'], ['receipts', 'Receipts', '❯_']];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <div className="menubar" role="banner">
      <span className="apple" aria-hidden="true">◆</span>
      <a className="app" href="#top">PRISM Lab</a>
      <a className="m" href="../app/">Open the app</a>
      <a className="m" href={blob('docs/vision/07_W1_RESULT.md')}>W1 result</a>
      <a className="m" href={blob('docs/vision/02_DETECTORS.md')}>Detectors</a>
      <span className="spacer" />
      <span className="status"><i /> Known answers checked at build</span>
      <a href={REPO}>GitHub ↗</a>
      <span className="clock">{now.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
    </div>
  );
}

function Dock() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="dock" aria-label="Sections">
      {SECTIONS.map(([id, label, icon]) => (
        <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>
          <span className="ico" aria-hidden="true">{icon}</span><span className="lbl">{label}</span>
        </a>
      ))}
    </nav>
  );
}

function Range({ label, value, min, max, step, onChange, show }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label} <span>{show}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

export default function App() {
  useReveal();
  return (
    <div className="wrap">
      <MenuBar />
      <div className="glow" aria-hidden="true" />
      <Hero />
      <Simpson />
      <Catchall />
      <Fdr />
      <Titanic />
      <Known />
      <Claims />
      <Limits />
      <Receipts />
      <Dock />
      <footer>
        Berkeley data: the per-applicant file pinned by SHA-256 in <code>tests/python/golden.py</code>. Every number on this page is read at build time from
        <code>tests/python/expected/</code>, <code>tests/python/test_statistics.py</code>, <code>README.md</code> and <code>docs/vision/07_W1_RESULT.md</code>; the lab and the simulator run in your browser.
      </footer>
    </div>
  );
}

function Hero() {
  const n = B.named;
  return (
    <header className="card hero window" id="top" data-title="PRISM — segment_reversal on berkeley.csv">
      <div className="head">
        <p className="eyebrow">Detector result · real file, digest-pinned</p>
        <span className="pill good">● Graded {n.grade}</span>
      </div>
      <h1>Men were admitted at {pct(n.eA / n.nA)}, women at {pct(n.eB / n.nB)}. Within departments the odds ratio is <em>{n.mhOr.toFixed(3)}</em>.</h1>
      <p className="sub">
        On the Berkeley admissions file, the crude odds ratio favours men ({n.crudeOr.toFixed(3)}), but {n.reversedCount} of {n.strata.length} departments admit women at a higher rate,
        and the Mantel-Haenszel adjusted odds ratio drops below 1. The {(n.aggEffect * 100).toFixed(1)}-point overall gap is mostly mix: women applied more often to departments that admit fewer people.
        PRISM's detector is built to find this pattern automatically in a spreadsheet you never upload. Every figure here is the detector's recorded output, recomputed in your browser.
      </p>
      <div className="actions">
        <a className="btn primary" href="#simpson">Open the Simpson's paradox lab</a>
        <a className="btn ghost" href="../app/">Try the PRISM app</a>
        <span className="hint">The detector package is tested in Python; it is not yet wired into the app (see <a href="#limits">limits</a>).</span>
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{n.mhOr.toFixed(3)}</div><div className="cap">Adjusted odds ratio, men vs women, six departments</div></div>
        <div className="tile"><div className="num">{n.crudeOr.toFixed(3)}</div><div className="cap">Crude odds ratio before holding department constant</div></div>
        <div className="tile"><div className="num">{n.reversedCount} of {n.strata.length}</div><div className="cap">Departments where the gap runs the other way</div></div>
        <div className="tile"><div className="num">{pct(n.stability, 0)}</div><div className="cap">Bootstrap sign stability ({B.thresholds.bootstrap_resamples} resamples)</div></div>
      </div>
    </header>
  );
}

const LEVELS = B.all.strata.map((s) => s.level);
const isCatch = (l) => B.all.catchall.includes(l);
const ZERO = () => Object.fromEntries(LEVELS.map((l) => [l, [0, 0]]));

function Simpson() {
  const [withOther, setWithOther] = useState(false);
  const [scale, setScale] = useState(ZERO);
  const [sel, setSel] = useState(LEVELS.filter((l) => !isCatch(l)).sort()[0]);
  const base = B.all.strata.filter((s) => withOther || !isCatch(s.level));
  const strata = base.map((s) => { const fa = 2 ** scale[s.level][0], fb = 2 ** scale[s.level][1]; return { ...s, nA: s.nA * fa, eA: s.eA * fa, nB: s.nB * fb, eB: s.eB * fb }; });
  const r = segmentReversal(strata);
  const isDefault = LEVELS.every((l) => scale[l][0] === 0 && scale[l][1] === 0);
  const rec = withOther ? B.all : B.named;
  const matches = isDefault && Math.abs(r.mhOr - rec.mhOr) < 1e-9 && Math.abs(r.crudeOr - rec.crudeOr) < 1e-9;
  const removeMix = () => {
    const tA = strata.reduce((s, x) => s + x.nA, 0) / strata.reduce((s, x) => s + x.nA + x.nB, 0);
    const next = ZERO();
    for (const s of base) { const N = s.nA + s.nB; next[s.level] = [Math.log2((N * tA) / s.nA), Math.log2((N * (1 - tA)) / s.nB)]; }
    setScale(next);
  };
  const setOne = (i) => (v) => setScale((p) => ({ ...p, [sel]: i ? [p[sel][0], v] : [v, p[sel][1]] }));
  const rows = [...r.rows].sort((a, b) => (isCatch(a.level) - isCatch(b.level)) || a.level.localeCompare(b.level));
  const groups = [{ level: 'Overall', rateA: r.rateA, rateB: r.rateB, n: r.nA + r.nB, crude: true }, ...rows.map((x) => ({ ...x, n: x.nA + x.nB }))];
  const W = 760, H = 290, pad = { l: 38, r: 6, t: 14, b: 44 };
  const gw = (W - pad.l - pad.r) / groups.length, bw = Math.min(26, gw * 0.32);
  const y = (v) => pad.t + (1 - v) * (H - pad.t - pad.b);
  const levels = base.map((s) => s.level).sort((a, b) => (isCatch(a) - isCatch(b)) || a.localeCompare(b));
  const selIn = levels.includes(sel) ? sel : levels[0];
  return (
    <section id="simpson" className="card window reveal" data-title="simpson.lab — live, in your browser">
      <div className="head">
        <div>
          <p className="eyebrow">Live lab</p>
          <h2>Change who applies where, and watch the crude gap move while the departments stay put.</h2>
          <p className="sub">
            Start from the file's real counts per department. The sliders rescale how many men or women applied to one department, keeping that department's admit rates fixed.
            The crude odds ratio responds to the mix; the Mantel-Haenszel odds ratio, which compares like with like, barely moves. Same formulas as <a href={blob('src/python/prism/detectors/segment_reversal.py')}>segment_reversal.py</a>.
          </p>
        </div>
        <span className={`pill ${matches ? 'good' : 'info'}`}>{matches ? '✓ matches recorded output' : isDefault ? 'recorded counts' : 'what-if counts'}</span>
      </div>
      <div className="actions" style={{ marginTop: 0, marginBottom: 14 }}>
        <div className="seg" role="group" aria-label="Rows included">
          <button aria-pressed={!withOther} onClick={() => setWithOther(false)}>Six named departments</button>
          <button aria-pressed={withOther} onClick={() => setWithOther(true)}>Full file, with “{B.all.catchall.join(', ')}”</button>
        </div>
        <button className="btn ghost" onClick={removeMix}>Remove the mix</button>
        <button className="btn ghost" onClick={() => setScale(ZERO())} disabled={isDefault}>Reset to the file</button>
      </div>
      <div className="controls">
        <div className="field"><label htmlFor="dept">Department to rescale</label>
          <select id="dept" value={selIn} onChange={(e) => setSel(e.target.value)}>
            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <Range label={`Men applying to ${selIn}`} value={scale[selIn][0]} min={-3} max={4} step={0.05} onChange={setOne(0)} show={`${(2 ** scale[selIn][0]).toFixed(2)}× (${fmt(r.rows.find((x) => x.level === selIn).nA)})`} />
        <Range label={`Women applying to ${selIn}`} value={scale[selIn][1]} min={-3} max={4} step={0.05} onChange={setOne(1)} show={`${(2 ** scale[selIn][1]).toFixed(2)}× (${fmt(r.rows.find((x) => x.level === selIn).nB)})`} />
      </div>
      <div className="tiles" style={{ marginTop: 0 }}>
        <div className="tile"><div className="num">{r.crudeOr.toFixed(3)}</div><div className="cap">Crude odds ratio ({pct(r.rateA)} men vs {pct(r.rateB)} women)</div></div>
        <div className="tile"><div className="num">{r.mhOr.toFixed(3)}</div><div className="cap">Mantel-Haenszel adjusted odds ratio</div></div>
        <div className="tile"><div className="num">{fp(r.pCmh)}</div><div className="cap">CMH p-value (χ² {r.chi2.toFixed(2)}, 1 df): is the within-department gap distinguishable from zero?</div></div>
        <div className="tile"><div className="num">{r.reversedCount} of {r.rows.length}</div><div className="cap">Departments whose gap runs against the overall gap</div></div>
      </div>
      <h3 style={{ marginTop: 20 }}>Admit rate, men vs women: overall, then within each department</h3>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Admit rates by sex overall and in ${rows.length} departments; crude odds ratio ${r.crudeOr.toFixed(3)}, adjusted ${r.mhOr.toFixed(3)}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => <g key={t}><line className="axis" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} /><text x={pad.l - 6} y={y(t) + 4} textAnchor="end">{t * 100}%</text></g>)}
        <line className="axis" x1={pad.l + gw} x2={pad.l + gw} y1={pad.t} y2={H - pad.b + 30} strokeDasharray="3 4" />
        {groups.map((g, i) => {
          const cx = pad.l + gw * (i + 0.5);
          return (
            <g key={g.level}>
              <rect x={cx - bw - 1} y={y(g.rateA)} width={bw} height={y(0) - y(g.rateA)} rx="3" fill="var(--primary)" opacity={g.crude ? 1 : 0.85} />
              <rect x={cx + 1} y={y(g.rateB)} width={bw} height={y(0) - y(g.rateB)} rx="3" fill="var(--warn)" opacity={g.crude ? 1 : 0.85} />
              <text x={cx} y={H - pad.b + 16} textAnchor="middle" style={{ fill: g.reversed ? 'var(--bad)' : 'var(--text)', fontWeight: 700 }}>{g.reversed ? `↺ ${g.level}` : g.level}</text>
              <text x={cx} y={H - pad.b + 30} textAnchor="middle">{g.n >= 10000 ? `${(g.n / 1000).toFixed(1)}k` : fmt(g.n)}</text>
            </g>
          );
        })}
      </svg>
      <div className="legend"><span><i style={{ background: 'var(--primary)' }} />Men</span><span><i style={{ background: 'var(--warn)' }} />Women</span><span style={{ color: 'var(--bad)' }}>↺ reversed: women ahead inside the department</span><span>Numbers under bars: applicants</span></div>
    </section>
  );
}

function Catchall() {
  const a = B.all, n = B.named, w = R.w1.bickel;
  const total = a.nA + a.nB;
  const parts = [...a.strata].sort((x, y) => (isCatch(y.level) - isCatch(x.level)) || x.level.localeCompare(y.level));
  let acc = 0;
  const W = 640, H = 34;
  return (
    <section id="catchall" className="card window reveal" data-title="catchall.inspect — the full file">
      <p className="eyebrow">The honest version</p>
      <h2>Analyse every row and the grade drops from reversal to attenuation, because {pct(a.catchallShare)} of applicants sit in “{a.catchall.join(', ')}”.</h2>
      <p className="sub">
        The file has a catch-all major that cannot be split into departments. Keep it in and the adjusted odds ratio stays above 1; set it aside and the reversal appears inside the six named departments.
        PRISM reports both and names the catch-all on the card, rather than silently dropping {fmt(a.strata.find((s) => isCatch(s.level)).nA + a.strata.find((s) => isCatch(s.level)).nB)} rows to get the famous answer.
      </p>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Applicants by department: ${a.catchall.join(', ')} holds ${pct(a.catchallShare)} of ${fmt(total)} rows`} style={{ marginTop: 16 }}>
        {parts.map((s) => {
          const share = (s.nA + s.nB) / total, x = acc * W; acc += share;
          return (
            <g key={s.level}>
              <rect x={x} y={4} width={Math.max(0, share * W - 2)} height={26} rx="4" fill={isCatch(s.level) ? 'var(--muted)' : 'var(--primary)'} opacity={isCatch(s.level) ? 0.45 : 0.75} />
              {share > 0.3 && <text x={x + (share * W) / 2} y={21} textAnchor="middle" style={{ fill: 'var(--text)' }}>{s.level} {pct(share, 0)}</text>}
            </g>
          );
        })}
      </svg>
      <div className="legend">{parts.filter((s) => !isCatch(s.level)).map((s) => <span key={s.level}><i style={{ background: 'var(--primary)', opacity: 0.75 }} />Dept {s.level}: {pct((s.nA + s.nB) / total)}</span>)}</div>
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table>
          <thead><tr><th>Rows analysed</th><th>Men admitted</th><th>Women admitted</th><th>Crude OR</th><th>Adjusted OR</th><th>CMH p</th><th>Grade</th></tr></thead>
          <tbody>
            <tr><td>All {fmt(B.rows)} rows</td><td>{fmt(a.eA)} of {fmt(a.nA)}</td><td>{fmt(a.eB)} of {fmt(a.nB)}</td><td>{a.crudeOr.toFixed(3)}</td><td>{a.mhOr.toFixed(3)}</td><td>{fp(a.pCmh)}</td><td><span className="pill warn">{a.gradeAllRows}</span></td></tr>
            <tr><td>Six named departments</td><td>{fmt(n.eA)} of {fmt(n.nA)}</td><td>{fmt(n.eB)} of {fmt(n.nB)}</td><td>{n.crudeOr.toFixed(3)}</td><td>{n.mhOr.toFixed(3)}</td><td>{fp(n.pCmh)}</td><td><span className="pill good">{n.grade}</span></td></tr>
          </tbody>
        </table>
      </div>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="tile">
          <h3>The file is not the textbook table</h3>
          <p className="hint" style={{ margin: '6px 0 0', fontSize: 13 }}>
            The build found that the hosted per-applicant file differs from Bickel et al. table 1 in two cells: department C women admitted {w.cWomenFile} (published {w.cWomenPaper}),
            department F {w.fWomenFile} (published {w.fWomenPaper}). So {n.mhOr.toFixed(4)} is the file's adjusted odds ratio; the published table gives {w.paperOr}. Source: <a href={blob('docs/vision/07_W1_RESULT.md')}>07_W1_RESULT.md</a>.
          </p>
        </div>
        <div className="tile">
          <h3>Not “women are favoured”</h3>
          <p className="hint" style={{ margin: '6px 0 0', fontSize: 13 }}>
            The within-department gap has CMH p = {n.pCmh.toFixed(2)} on the six departments: not distinguishable from zero. The finding is that the overall gap for men is mix,
            which is the conclusion Bickel et al. reached. The detector pools max(p_mix, p_segment) for that confounding claim and shows the adjusted effect's own p beside it.
          </p>
        </div>
      </div>
    </section>
  );
}

function Fdr() {
  const [m, setM] = useState(R.w1.fdr.tests);
  const [seed, setSeed] = useState(B.thresholds.seed);
  const q = B.thresholds.fdr_q;
  const res = useMemo(() => fdrSim({ m, seed, q, reps: 400 }), [m, seed, q]);
  const sorted = useMemo(() => [...res.p].sort((a, b) => a - b), [res]);
  const qv = useMemo(() => bh(sorted), [sorted]);
  const k = Math.max(10, Math.ceil(m * 0.1)), top = 0.1;
  const W = 760, H = 250, pad = { l: 44, r: 8, t: 10, b: 26 };
  const sx = (i) => pad.l + (i / k) * (W - pad.l - pad.r);
  const sy = (p) => pad.t + (1 - Math.min(p, top) / top) * (H - pad.t - pad.b);
  const s = res.sample, a = res.avg;
  return (
    <section id="fdr" className="card window reveal" data-title="fdr.sim — simulation, not a repo result">
      <div className="head">
        <div>
          <p className="eyebrow">Live simulation</p>
          <h2>Grade first and correct later, and pure noise becomes findings.</h2>
          <p className="sub">
            From the W1 build log: “{R.w1.fdr.quote}” The fix was to put every tested triple into the Benjamini-Hochberg pool before grading.
            This simulator draws {fmt(m)} p-values with no real effect anywhere and shows what each rule lets through, using the detector's own q = {q}.
          </p>
        </div>
        <span className="pill warn">Simulation · seeded, all nulls true</span>
      </div>
      <div className="controls">
        <Range label="Tests run (m)" value={m} min={20} max={2000} step={1} onChange={setM} show={fmt(m)} />
        <div className="field"><label htmlFor="fdrseed">Seed</label><input id="fdrseed" type="number" value={seed} onChange={(e) => setSeed(+e.target.value || 1)} /></div>
      </div>
      <div className="tiles" style={{ marginTop: 0, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="tile"><div className="num" style={{ color: 'var(--bad)' }}>{s.raw}</div><div className="cap">pass raw p &lt; 0.05 (average {a.raw.toFixed(1)} over {res.reps} draws)</div></div>
        <div className="tile"><div className="num" style={{ color: 'var(--bad)' }}>{s.bhSelected}</div><div className="cap">survive BH run only on the ones that already looked significant (average {a.bhSelected.toFixed(1)})</div></div>
        <div className="tile"><div className="num" style={{ color: 'var(--good)' }}>{s.bhAll}</div><div className="cap">survive BH over all {fmt(m)} tests (average {a.bhAll.toFixed(2)}; any at all in {pct(a.anyBhAll, 1)} of draws)</div></div>
      </div>
      <h3 style={{ marginTop: 20 }}>Smallest {k} sorted p-values against the BH line</h3>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Sorted p-values for ${m} null tests with the Benjamini-Hochberg line; ${s.bhAll} survive`}>
        {[0, 0.025, 0.05, 0.075, 0.1].map((t) => <g key={t}><line className="axis" x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} strokeDasharray={t === 0.05 ? '5 4' : ''} /><text x={pad.l - 6} y={sy(t) + 4} textAnchor="end">{t}</text></g>)}
        <line x1={sx(0)} y1={sy(0)} x2={sx(k)} y2={sy((k * q) / m)} stroke="var(--good)" strokeWidth="2" />
        {sorted.slice(0, k).map((p, i) => <circle key={i} cx={sx(i + 1)} cy={sy(p)} r={k > 120 ? 2 : 3} fill={qv[i] <= q ? 'var(--good)' : p < 0.05 ? 'var(--bad)' : 'var(--primary)'} opacity={p < 0.05 ? 0.95 : 0.45} />)}
        <text x={pad.l} y={H - 6}>rank 1</text><text x={W - pad.r} y={H - 6} textAnchor="end">rank {k} of {fmt(m)} (y clipped at 0.1)</text>
      </svg>
      <div className="legend"><span><i style={{ background: 'var(--good)' }} />BH line, slope q/m</span><span><i style={{ background: 'var(--bad)' }} />raw p &lt; 0.05: a naive “finding”</span><span>dashed: 0.05</span></div>
      <p className="hint" style={{ marginTop: 10 }}>The W1 doc also records that Breslow-Day and CMH were calibrated under the null ({R.w1.calibration.breslowDay}% and {R.w1.calibration.cmh}% rejection): the tests were fine, the selection was not.</p>
    </section>
  );
}

const GRADES = ['all', ...new Set(R.titanic.findings.map((f) => f.grade))];
const SEVS = ['all', ...new Set(R.titanic.findings.map((f) => f.severity))];

function Titanic() {
  const T = R.titanic;
  const [grade, setGrade] = useState('all');
  const [sev, setSev] = useState('all');
  const [selId, setSelId] = useState(T.findings.find((f) => f.grade === 'FULL')?.id ?? T.findings[0].id);
  const rows = T.findings.filter((f) => (grade === 'all' || f.grade === grade) && (sev === 'all' || f.severity === sev)).sort((a, b) => a.q - b.q);
  const f = T.findings.find((x) => x.id === selId);
  const counts = Object.fromEntries(GRADES.slice(1).map((g) => [g, T.findings.filter((x) => x.grade === g).length]));
  const show = (v) => (f.binary ? pct(v) : v.toFixed(1));
  const all = [{ level: 'All rows', meanA: f.meanA, meanB: f.meanB, reversed: false, agg: true }, ...f.strata];
  const vals = all.flatMap((r) => [r.meanA, r.meanB]);
  const lo = f.binary ? 0 : Math.min(0, ...vals), hi = f.binary ? 1 : Math.max(...vals) * 1.08;
  const W = 640, rowH = 38, H = all.length * rowH + 34, l = 150, rr = 16;
  const x = (v) => l + ((v - lo) / (hi - lo)) * (W - l - rr);
  const sevPill = { high: 'bad', medium: 'warn', low: 'info' };
  return (
    <section id="titanic" className="card window reveal" data-title="titanic.findings — recorded replay">
      <div className="head">
        <div>
          <p className="eyebrow">Recorded replay</p>
          <h2>{T.testsRun} triples tested on Titanic, {T.findingsCount} findings: every one arithmetically true, not every one worth a board's time.</h2>
          <p className="sub">
            Recorded from <a href={blob('tests/python/expected/titanic.json')}>tests/python/expected/titanic.json</a> ({fmt(T.rows)} rows), the regression snapshot of a real detector run.
            {' '}{Object.entries(counts).map(([g, c]) => `${c} ${g.toLowerCase()}`).join(', ')}. The false-alarm rate on real business spreadsheets is not measured yet.
          </p>
        </div>
        <span className="pill info">Recorded, not re-run here</span>
      </div>
      <div className="actions" style={{ marginTop: 0, marginBottom: 12 }}>
        <div className="seg" role="group" aria-label="Filter by grade">
          {GRADES.map((g) => <button key={g} aria-pressed={grade === g} onClick={() => setGrade(g)}>{g === 'all' ? 'All grades' : g.toLowerCase()}</button>)}
        </div>
        <div className="seg" role="group" aria-label="Filter by severity">
          {SEVS.map((s) => <button key={s} aria-pressed={sev === s} onClick={() => setSev(s)}>{s === 'all' ? 'Any severity' : s}</button>)}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>Comparison</th><th>Outcome</th><th>Split by</th><th>Grade</th><th>q-value</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.id === selId ? 'sel' : ''}>
                <td><button className="rowbtn" aria-pressed={r.id === selId} onClick={() => setSelId(r.id)}>{r.x}: {r.a} vs {r.b}</button></td>
                <td>{r.y}</td><td>{r.z}</td>
                <td><span className={`pill ${sevPill[r.severity] || 'info'}`}>{r.grade.toLowerCase()} · {r.severity}</span></td>
                <td className="mono">{r.q.toExponential(1)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="5" className="hint">No recorded finding matches both filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <h3 style={{ marginTop: 20 }}>{f.x} {f.a} vs {f.b} on {f.y}, split by {f.z} <span className="hint" style={{ fontWeight: 500 }}>· {f.reason}</span></h3>
      {f.zOutcome && (
        <p className="hint" style={{ marginTop: 8, marginBottom: 0, color: 'var(--warn)' }}>
          ⚠ “{f.z}” reads as an outcome. Splitting by a consequence can manufacture a pattern (a collider or mediator). The detector cannot know causal order; it flags the name and leads with that question.
        </p>
      )}
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Mean ${f.y} for ${f.a} and ${f.b} overall and within each ${f.z} level`} style={{ marginTop: 12 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => { const v = lo + t * (hi - lo); return <g key={t}><line className="axis" x1={x(v)} x2={x(v)} y1={4} y2={H - 22} /><text x={x(v)} y={H - 6} textAnchor="middle">{f.binary ? `${Math.round(v * 100)}%` : v.toFixed(0)}</text></g>; })}
        {all.map((r, i) => {
          const cy = 18 + i * rowH;
          return (
            <g key={r.level}>
              <text x={0} y={cy + 4} style={{ fill: r.reversed ? 'var(--bad)' : 'var(--text)', fontWeight: r.agg ? 700 : 500 }}>{r.agg ? 'All rows' : `${f.z.length > 12 ? f.z.slice(0, 11) + '…' : f.z} ${r.level}`}{r.reversed ? ' ↺' : ''}</text>
              <line x1={x(r.meanA)} x2={x(r.meanB)} y1={cy} y2={cy} stroke="var(--muted)" strokeWidth="2" opacity="0.5" />
              <circle cx={x(r.meanA)} cy={cy} r="6" fill="var(--primary)" />
              <circle cx={x(r.meanB)} cy={cy} r="6" fill="var(--warn)" />
            </g>
          );
        })}
      </svg>
      <div className="legend"><span><i style={{ background: 'var(--primary)' }} />{f.x} = {f.a}</span><span><i style={{ background: 'var(--warn)' }} />{f.x} = {f.b}</span><span>Overall gap {show(f.agg)}, adjusted {show(f.adj)}, adjusted p {fp(f.pAdj)}</span></div>
    </section>
  );
}

function Known() {
  const S = R.stats;
  const [cells, setCells] = useState(S.fisher.table);
  const pt = pairedT(S.sleep1, S.sleep2);
  const fe = fisherExact(cells);
  const gof = chiSquareGof(S.gof.counts);
  const isTea = cells.every((v, i) => v === S.fisher.table[i]);
  const row = (name, c, got, src, live = true) => (
    <tr key={name + c.key}>
      <td>{name}</td><td>{c.key === 'pValue' ? 'p-value' : 'statistic'}</td>
      <td className="mono">{live ? got.toPrecision(7) : '–'}</td>
      <td className="mono">{c.expr}</td><td className="mono">{c.kind} {c.tol}</td>
      <td>{live ? (within(got, c) ? <span className="pill good">✓ within</span> : <span className="pill bad">✗ outside</span>) : <span className="pill info">table edited</span>}</td>
      <td className="hint">{src}</td>
    </tr>
  );
  const labels = ['milk poured, guessed milk', 'milk poured, guessed tea', 'tea poured, guessed milk', 'tea poured, guessed tea'];
  return (
    <section id="known" className="card window reveal" data-title="known-answers.py — recomputed in your browser">
      <p className="eyebrow">Known answers</p>
      <h2>The statistics engine is held to published results. This page recomputes three of them in JavaScript.</h2>
      <p className="sub">
        Data and expected values are parsed at build time from <a href={blob('tests/python/test_statistics.py')}>test_statistics.py</a>, never retyped; the build fails if the parser finds a different shape.
        Each value is checked here against the same tolerance the Python test uses.
      </p>
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table>
          <thead><tr><th>Test</th><th>Quantity</th><th>This browser</th><th>Expected</th><th>Tolerance</th><th>Result</th><th>Reference</th></tr></thead>
          <tbody>
            {S.paired.checks.map((c) => row(`Paired t, df ${pt.df}`, c, c.key === 'statistic' ? pt.t : pt.p, 'Student (1908) sleep data, R datasets::sleep'))}
            {S.fisher.checks.map((c) => row('Fisher exact', c, c.key === 'statistic' ? fe.oddsRatio : fe.p, 'Fisher tea-tasting table', isTea))}
            {S.gof.checks.map((c) => row(`χ² goodness of fit, df ${gof.df}`, c, c.key === 'statistic' ? gof.stat : gof.p, `counts ${S.gof.counts.join('/')} vs uniform`))}
          </tbody>
        </table>
      </div>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div>
          <h3>Fisher exact calculator</h3>
          <p className="hint" style={{ margin: '4px 0 10px' }}>Starts at the tea-tasting table. Edit a cell and the two-sided p updates; the tick above only applies to the original table.</p>
          <div className="controls" style={{ gridTemplateColumns: '1fr 1fr', margin: 0 }}>
            {cells.map((v, i) => (
              <div className="field" key={i}><label htmlFor={`fc${i}`}>{labels[i]}</label>
                <input id={`fc${i}`} type="number" min="0" max="500" value={v} onChange={(e) => { const n = Math.max(0, Math.min(500, Math.round(+e.target.value || 0))); setCells((p) => p.map((x, j) => (j === i ? n : x))); }} />
              </div>
            ))}
          </div>
          <p style={{ marginTop: 10 }}><b>p = {fe.p.toPrecision(6)}</b> <span className="hint">· odds ratio {Number.isFinite(fe.oddsRatio) ? fe.oddsRatio.toFixed(3) : '∞'}</span></p>
        </div>
        <div>
          <h3>Sleep data, paired differences (drug 1 − drug 2)</h3>
          <p className="hint" style={{ margin: '4px 0 10px' }}>Mean difference {pt.mean.toFixed(2)} hours across {pt.diffs.length} patients, t = {pt.t.toFixed(4)}, p = {pt.p.toFixed(6)}.</p>
          <svg className="chart" viewBox="0 0 600 200" role="img" aria-label="Paired differences in extra sleep for ten patients">
            {(() => {
              const mx = Math.max(...pt.diffs.map(Math.abs)) || 1, top = Math.max(0, ...pt.diffs), k = 150 / (mx + top), y0 = 10 + top * k;
              return (<>
                <line className="axis" x1="20" x2="590" y1={y0} y2={y0} />
                {pt.diffs.map((d, i) => <g key={i}><rect x={28 + i * 56} width="40" y={d < 0 ? y0 : y0 - d * k} height={Math.max(1.5, Math.abs(d) * k)} rx="4" fill={d < 0 ? 'var(--primary)' : 'var(--warn)'} />
                  <text x={48 + i * 56} y={d < 0 ? y0 + d * -k + 14 : y0 + 14} textAnchor="middle">{d.toFixed(1)}</text></g>)}
                <text x="20" y="196">Patients 1 to 10, hours. Below the line: drug 2 gave more sleep.</text>
              </>);
            })()}
          </svg>
        </div>
      </div>
    </section>
  );
}

function Claims() {
  const tone = (s) => (/^Verified/.test(s) ? 'good' : /not certified/.test(s) ? 'warn' : 'info');
  return (
    <section id="claims" className="card window reveal" data-title="claims.ledger — from README.md">
      <p className="eyebrow">Privacy and security claims</p>
      <h2>{R.claims.length} claims, each with a check a stranger can run alone.</h2>
      <p className="sub">Imported from the claim table in <a href={blob('README.md')}>README.md</a> at build time. Statuses are the project's own; “designed against” is not a certification.</p>
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table>
          <thead><tr><th>#</th><th>Claim</th><th>Status</th><th>How to verify</th></tr></thead>
          <tbody>
            {R.claims.map((c) => <tr key={c.n}><td>{c.n}</td><td>{code(c.claim)}</td><td><span className={`pill ${tone(c.status)}`}>{c.status}</span></td><td className="hint">{code(c.verify)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Limits() {
  const T = R.titanic;
  const items = [
    ['Not in the shipped app yet', 'The segment-reversal package under src/python/prism/ is tested in Python but the browser worker still runs the older embedded engine. The headline capability is proven, not shipped.', 'bad'],
    ['False-alarm rate unmeasured', `${T.findingsCount} findings from ${T.testsRun} tests on Titanic. There is no corpus of real management spreadsheets yet, so precision on business data is unknown.`, 'warn'],
    ['Blind to causal order', 'The detector cannot tell a confounder from a collider or mediator. It relies on a column-name heuristic to raise the question.', 'warn'],
    ['One detector so far', 'Segment reversal is built in full, with a gated duplicates pass. The window-shift and fragile-number detectors are specified but not started.', 'info'],
    ['The simulator is a simulation', 'fdr.sim draws synthetic null p-values. It illustrates the W1 selection bug; it is not a measurement of the repo.', 'info'],
    ['The file is not the paper', `The Berkeley figures are the hosted file's (adjusted OR ${B.named.mhOr.toFixed(4)}), which differs from the published table in two cells.`, 'info'],
  ];
  return (
    <section id="limits" className="card window reveal" data-title="limits.md — threats to validity">
      <p className="eyebrow">Limits and threats</p>
      <h2>What this does not show yet.</h2>
      <div className="grid2" style={{ marginTop: 16 }}>
        {items.map(([t, d, k]) => (
          <div className="tile" key={t}>
            <div className="head" style={{ marginBottom: 6 }}><h3>{t}</h3><span className={`pill ${k}`}>{k === 'bad' ? 'Gap' : k === 'warn' ? 'Caveat' : 'Note'}</span></div>
            <p className="hint" style={{ margin: 0, fontSize: 13 }}>{d}</p>
          </div>
        ))}
      </div>
      <p className="hint" style={{ marginTop: 14 }}>Graded in full, with what each gap would cost to close, in <a href={blob('docs/research-review.md')}>docs/research-review.md</a>.</p>
    </section>
  );
}

function Receipts() {
  const P = R.repo;
  const docs = [
    ['docs/vision/07_W1_RESULT.md', 'W1 result', 'Five assertions, measured'],
    ['docs/vision/02_DETECTORS.md', 'Detector spec', 'What each detector must do'],
    ['src/python/prism/detectors/segment_reversal.py', 'Detector code', 'MH, CMH, Breslow-Day, bootstrap'],
    ['src/python/prism/multiplicity.py', 'Multiplicity', 'Benjamini-Hochberg'],
    ['tests/python/expected/berkeley.json', 'Berkeley snapshot', `SHA-256 ${B.sha256.slice(0, 12)}…`],
    ['docs/research-review.md', 'Research review', 'Rubric grade and open gaps'],
  ];
  return (
    <section id="receipts" className="card window reveal" data-title="repo.receipts — counted at build time">
      <p className="eyebrow">Receipts</p>
      <h2>Counted from the repo when this page was built, so they cannot go stale.</h2>
      <div className="tiles">
        <div className="tile"><div className="num">{P.pyTests}</div><div className="cap">Python test functions in {P.pyModules} modules (statistics, detectors, golden data)</div></div>
        <div className="tile"><div className="num">{P.vitestFiles}</div><div className="cap">Vitest files (security, store)</div></div>
        <div className="tile"><div className="num">{P.a11yFiles}</div><div className="cap">Accessibility test files</div></div>
        <div className="tile"><div className="num">{P.workflows.length}</div><div className="cap">CI workflows: {P.workflows.map((w) => w.replace(/\.ya?ml$/, '')).join(', ')}</div></div>
      </div>
      <div className="actions">
        <a className="btn primary" href="../app/">Open the PRISM app</a>
        <a className="btn ghost" href="../">Product site</a>
        <span className="hint">Rebuild this page: <code>cd site && npm ci && npm run build</code></span>
      </div>
      <div className="docs" style={{ marginTop: 20 }}>
        {docs.map(([p, t, d]) => <a key={p} href={blob(p)}><b>{t}</b><small>{d}</small></a>)}
      </div>
    </section>
  );
}
