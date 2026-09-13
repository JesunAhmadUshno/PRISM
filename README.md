# PRISM - Secure Data Analytics Platform

[![Security](https://img.shields.io/badge/Security-Zero%20Trust-green.svg)](docs/TECHNICAL_DESIGN_DOCUMENT.md)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

**Browser-Based, Serverless Data Analytics & Visualization Platform**

> 🔒 **Your data never leaves your browser.** All processing happens locally using WebAssembly.

## 🎯 Overview

PRISM is a zero-trust data analytics platform that processes sensitive data (CSV, XLSX and XLS) entirely within your browser. It generates visual insights while guaranteeing complete data sovereignty: **no bytes ever leave your machine**.

## ✨ Features

### Security (designed against ISO/IEC 27001:2022 Annex A control objectives)
- **Zero Data Exfiltration**: Strict CSP blocks all network transmission
- **WebAssembly Sandbox**: Pyodide runs Python in isolated WASM environment
- **Web Worker Isolation**: Data processing in separate thread
- **Input Sanitization**: DOMPurify for XSS prevention

### Accessibility (built against WCAG 2.2, targeting Level AA)
- **Screen Reader Support**: ARIA labelling throughout, not yet tested with NVDA or VoiceOver
- **Sonification**: Audio representation of chart data
- **Data Table Fallbacks**: Hidden tables for screen readers
- **High Contrast Mode**: Alternate high contrast palette
- **Keyboard Navigation**: Keyboard operation of the upload, analysis and chart controls

We do not claim Level AAA, and we do not claim conformance we have not measured. Known
accessibility gaps, including measured contrast failures, are recorded in
[docs/legal/COMPLIANCE_POSTURE.md](docs/legal/COMPLIANCE_POSTURE.md).

### Analytics
- **Auto Column Detection**: Smart data type inference
- **Statistical Analysis**: Mean, median, std dev, quartiles
- **AI Insights**: Automated trend, outlier, and correlation detection
- **Smart Visualizations**: Recommended charts based on data types

The analytics engine is the Python source embedded in `src/workers/prism.worker.js`,
which is what Pyodide executes. `src/python/prism_core.py` is an earlier standalone draft
kept for reference; it is not imported, not loaded and not run by the application.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── core/
│   │   └── FileUploader/       # Accessible drag-drop upload
│   └── visualization/
│       ├── SmartChart/         # Accessible chart component
│       └── InsightCard/        # AI insight display
├── workers/
│   └── prism.worker.js         # Pyodide Web Worker; the live analytics engine
│                               # (Python source embedded here)
├── python/
│   └── prism_core.py           # Reference draft only. NOT loaded at runtime
│                               # and not the engine the product executes
├── security/
│   ├── sanitizer.ts            # DOMPurify wrapper
│   └── validator.ts            # File validation
├── stores/
│   └── prismStore.ts           # Zustand state management
├── types/
│   └── index.ts                # TypeScript definitions
└── styles/
    └── index.css               # TailwindCSS styles
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Content Security Policy (Network Boundary)             │
├─────────────────────────────────────────────────────────┤
│  Input Validation (File Type & Size Guards)             │
├─────────────────────────────────────────────────────────┤
│  DOMPurify Sanitization (XSS Prevention)                │
├─────────────────────────────────────────────────────────┤
│  Web Worker Isolation (Thread Boundary)                 │
├─────────────────────────────────────────────────────────┤
│  WebAssembly Sandbox (Memory Isolation)                 │
├─────────────────────────────────────────────────────────┤
│  Output Sanitization (Safe DOM Rendering)               │
└─────────────────────────────────────────────────────────┘
```

## 📋 What we claim, and how you can check it

PRISM holds no certifications and claims none. What follows is the set of claims we can
defend today, each one checkable by a stranger without our cooperation. The full
reasoning, including the claims we are not making and why, is in
[docs/legal/COMPLIANCE_POSTURE.md](docs/legal/COMPLIANCE_POSTURE.md).

| # | Claim | Status | How you can verify it yourself |
|---|-------|--------|--------------------------------|
| 1 | Your data is never uploaded. Analysis happens entirely in your browser. | Verified | Open the Network tab and use the product. Disconnect the network and keep using it. |
| 2 | The application contains no code that can transmit your data: no XMLHttpRequest, WebSocket or sendBeacon, and the only fetch is the Python runtime download. | Verified | Search the source for those four terms. |
| 3 | The browser, not our good intentions, enforces the network boundary. The Content Security Policy denies all origins by default and permits only the runtime download. | Verified | Read the CSP in the page source. |
| 4 | That policy binds the worker thread that holds your data, because the worker is created from a blob URL and inherits the document policy. | Verified | `src/stores/prismStore.ts` and the comment above the worker construction. |
| 5 | PRISM stores nothing on your device: no cookies, no local storage, no IndexedDB. Closing the tab destroys everything. | Verified | Search the source. Check Application storage in developer tools. |
| 6 | There is no account, no login and no telemetry, and therefore no user record to subpoena, breach or sell. | Verified | There is no signup form. |
| 7 | The Python runtime is verified against pinned SHA-384 digests before it executes, so a compromised distribution network cannot inject code. | Verified | `PYODIDE_INTEGRITY` in `src/workers/prism.worker.js`. |
| 8 | The security architecture is designed against ISO/IEC 27001:2022 Annex A control objectives. PRISM holds no certification and claims none. | Designed against, not certified | Published architecture documentation. |
| 9 | PRISM is built against WCAG 2.2 and targets Level AA. Known gaps are published. | In progress, gaps published | The published gap list in `docs/legal/COMPLIANCE_POSTURE.md`. |
| 10 | An automated accessibility test suite runs in CI. | Verified | `vitest.a11y.config.ts` and the CI workflow. |

Specifically, and deliberately: we do not claim ISO 27001 certification or compliance,
WCAG 2.2 Level AAA, EN 301 549 conformance, GDPR or PIPEDA compliance or certification,
or OWASP Top 10 mitigation. Those are either not claimable by a piece of software at all
or not yet measured here. Compliance is a property of an organisation's processing and
management system, not of a download.

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS (High Contrast / Dark Mode)
- **Compute**: Pyodide (Python → WebAssembly)
- **Analytics**: Pandas, NumPy, SciPy (in browser)
- **Visualization**: Recharts
- **State**: Zustand

## 📝 License

Proprietary - See [LICENSE](LICENSE) for details.

## 📖 Documentation

- [Technical Design Document](docs/TECHNICAL_DESIGN_DOCUMENT.md)
- [Security Architecture](docs/TECHNICAL_DESIGN_DOCUMENT.md#4-security-architecture)
- [Accessibility Guide](docs/TECHNICAL_DESIGN_DOCUMENT.md#5-accessibility-architecture)
- [Compliance Posture: what we claim and what we do not](docs/legal/COMPLIANCE_POSTURE.md)
