# PRISM - Secure Data Analytics Platform

[![Security](https://img.shields.io/badge/Security-Zero%20Trust-green.svg)](docs/TECHNICAL_DESIGN_DOCUMENT.md)
[![Accessibility](https://img.shields.io/badge/WCAG-2.2%20AAA-blue.svg)](docs/TECHNICAL_DESIGN_DOCUMENT.md)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

**Browser-Based, Serverless Data Analytics & Visualization Platform**

> 🔒 **Your data never leaves your browser.** All processing happens locally using WebAssembly.

## 🎯 Overview

PRISM is a zero-trust data analytics platform that processes sensitive data (Excel, CSV, XML) entirely within your browser. It generates AI-driven visual insights while guaranteeing complete data sovereignty—**no bytes ever leave your machine**.

## ✨ Features

### Security (ISO/IEC 27001:2022 Compliant)
- **Zero Data Exfiltration**: Strict CSP blocks all network transmission
- **WebAssembly Sandbox**: Pyodide runs Python in isolated WASM environment
- **Web Worker Isolation**: Data processing in separate thread
- **Input Sanitization**: DOMPurify for XSS prevention

### Accessibility (WCAG 2.2 Level AAA)
- **Screen Reader Support**: Full NVDA/VoiceOver compatibility
- **Sonification**: Audio representation of chart data
- **Data Table Fallbacks**: Hidden tables for screen readers
- **High Contrast Mode**: 7:1 contrast ratio support
- **Keyboard Navigation**: Complete keyboard accessibility

### Analytics
- **Auto Column Detection**: Smart data type inference
- **Statistical Analysis**: Mean, median, std dev, quartiles
- **AI Insights**: Automated trend, outlier, and correlation detection
- **Smart Visualizations**: Recommended charts based on data types

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
│   └── prism.worker.ts         # Pyodide Web Worker
├── python/
│   └── prism_core.py           # Analytics engine
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

## 📋 Compliance

| Standard | Requirement | Status |
|----------|-------------|--------|
| ISO/IEC 40500:2025 | WCAG 2.2 AAA | ✅ Compliant |
| EN 301 549 | EU Accessibility | ✅ Compliant |
| ISO/IEC 27001:2022 | Information Security | ✅ Compliant |
| GDPR Article 32 | Data Security | ✅ Compliant |
| PIPEDA | Canadian Privacy | ✅ Compliant |
| OWASP Top 10 | Web Security | ✅ Mitigated |

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS (High Contrast / Dark Mode)
- **Compute**: Pyodide (Python → WebAssembly)
- **Analytics**: Pandas, NumPy, Scikit-Learn (in browser)
- **Visualization**: Recharts
- **State**: Zustand

## 📝 License

Proprietary - See [LICENSE](LICENSE) for details.

## 📖 Documentation

- [Technical Design Document](docs/TECHNICAL_DESIGN_DOCUMENT.md)
- [Security Architecture](docs/TECHNICAL_DESIGN_DOCUMENT.md#4-security-architecture)
- [Accessibility Guide](docs/TECHNICAL_DESIGN_DOCUMENT.md#5-accessibility-architecture)
