# Realtime — System Health Monitoring Dashboard

A high-performance, real-time hardware telemetry panel and container diagnostic interface built with React, Vite, Express, and Recharts. This application feeds live compute resource stats directly from the container system to a highly optimized frontend workspace via persistent WebSockets.

## 📊 Live Views & Core Features

- **Real-Time Telemetry Stream**: Instantly feeds major performance data using ultra-low latency WebSockets with built-in heartbeat latency diagnostics.
- **Vitals Metrics Panel**: Tracks active processor utilization, RAM metrics (including total allocated, free, and cached capacity), and filesystem storage space.
- **Historical Chart (Telemetry Histogram)**: Dynamically plots rolling hardware parameters over time with interactive granular filters for processor loads, memory, network socket rates, and connection response delay.
- **Visual Design System**: Built with a visually elegant, high-contrast custom light theme prioritizing clear typography, robust padding, and modern, accessible color schemes.

## 📁 File Structure Reference

A modular architecture separating the client-side UI pages, atomic components, telemetry types, and the server-side telemetry socket engines.

```text
├── README.md                           # Core developer execution guides and architecture layout
├── index.html                          # Primary public web entry template
├── metadata.json                       # Core app description and telemetry permission declarations
├── package.json                        # Node dependencies, clean modular scripts, and esbuild pipeline
├── server/                             # Server-side environment logic
│   ├── server.ts                       # Prime Express server coordinating static routes and socket handshakes
│   └── websocketServer/
│       └── index.ts                    # Low-overhead WebSocket implementation sending live ticks
└── src/                                # Frontend React source application
    ├── App.tsx                         # Main client routing shell with lazy compilation wrappers
    ├── main.tsx                        # Global application mounting hook
    ├── index.css                       # Font families declaration and tailwind layout overrides
    ├── types.ts                        # Shared strict TypeScript telemetry specs and WebSocket typings
    ├── pages/
    │   └── SystemMonitoring/
    │       └── index.tsx               # Main container dashboard displaying grids of vital status widgets
    └── components/                     # Atomic reusable UI components
        ├── DashboardHeader/
        │   └── index.tsx               # Top-level action bar showing connection status and clock uptime
        ├── MetricCard/
        │   └── index.tsx               # Base component rendering single-metric progress meters with sparks
        ├── MetricsLineChart/
        │   └── index.tsx               # Lazy-loaded historical telemetry stream line chart
        ├── MetricsVitals/
        │   └── index.tsx               # Modular container grid syncing performance telemetry cards
        └── ServerSpecs/
            └── index.tsx               # Detailed component tracking workspace size metrics and volumes
```

## 🛠️ Design Architecture & Performance Checks

- **Advanced Lazy Loading**: Implements React code-splitting (`React.lazy` and `Suspense`) to partition intensive graphing components from core layouts, optimizing page initialization time.
- **Targeted Component Memoization**: Integrates strict data caching and memoized component structures (`React.memo`) to stop unnecessary client rendering during rapid data updates.
- **Sane Data Limits**: Automatically applies sliding windows to historical lists, maintaining peak animation framerates through hours of constant monitoring.

## 🚀 Execution Guides

### Project Installation

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

### Production Build Sequence

```bash
npm run build
```

### Production Ingress Startup

```bash
npm run start
```
