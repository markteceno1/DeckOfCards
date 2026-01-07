# Deck of Cards – k6 Performance Test Suite

This repository contains a **k6 performance testing framework** written in **TypeScript** for testing a **Deck of Cards API**.  
It supports **smoke, load, and endurance tests**, structured API modules, Prometheus remote write, and histogram-based metrics.

---

## Features

- k6 tests written in **TypeScript**
- Modular API clients:
  - Deck API
  - Pile API
  - Return API
- Scenario presets:
  - Smoke
  - Load
  - Endurance
- Prometheus **Remote Write** (`experimental-prometheus-rw`)
- Histogram-based metrics (p90 / p95 / p99)
- Works with **local Django backend** or public Deck of Cards API
- Clean grouping & threshold strategy

---

## Test Plan
See the detailed test plan here:
- [Test Plan](./docs/TestPlan.md)

---

## Project Structure

```
src/
├── apis/
│   ├── deckAPI.ts
│   ├── pileApi.ts
│   └── returnApi.ts
│
├── tests/
│   ├── test.ts              # main k6 entry point
│   ├── scenarios.ts         # smoke / load / endurance presets
│
├── types/
│   └── deck.ts              # API response types
│
├── utils/
│   └── parseJson.ts         # safe JSON parsing helper
│
dist/
└── main.js                  # bundled output (generated)
```

---

## Test Types

| Test Type | Description |
|---------|------------|
| Smoke | Fast validation that APIs work |
| Load | Sustained traffic with ramping arrival rate |
| Endurance | Long-running soak test |

The test type is selected via an **environment variable**.

---

## Prerequisites

{
  "@types/k6": "^1.5.0",
  "esbuild": "^0.27.2",
  "typescript": "^5.9.3",
  "cross-env": "^7.0.3"
}


---

## Install Dependencies

```bash
npm install
npm install --save-dev cross-env
```

---

## Build the k6 Bundle

k6 does not run TypeScript directly.  
Tests are bundled using **esbuild**.

```bash
npm run build:k6
```

---

## Running Tests

### Local
```bash
npm run run:k6:smoke
npm run run:k6:load
npm run run:k6:endurance
```

### Prometheus
```bash
npm run run:k6:prom:smoke
npm run run:k6:prom:load
npm run run:k6:prom:endurance
```

## Design Decisions

- Static group names → safe for thresholds
- Computed check names → readable output
- `parseJson` helper → avoids JSON parse crashes
- Arrival-rate executors → realistic load modeling
- Histograms over summaries → correct aggregation in Prometheus

---

## NPM Scripts

```json
{
  "scripts": {
    "build:k6": "esbuild src/tests/test.ts --bundle --format=esm --platform=neutral --outfile=dist/main.js --external:k6 --external:k6/*",

    "run:k6:smoke": "npm run build:k6 && cross-env TEST_TYPE=smoke BASE_URL=http://127.0.0.1:8000 k6 run --summary-mode=legacy dist/main.js",
    "run:k6:load": "npm run build:k6 && cross-env TEST_TYPE=load BASE_URL=http://127.0.0.1:8000 k6 run --summary-mode=legacy dist/main.js",
    "run:k6:endurance": "npm run build:k6 && cross-env TEST_TYPE=endurance BASE_URL=http://127.0.0.1:8000 k6 run --summary-mode=legacy dist/main.js",

    "run:k6:prom": "npm run build:k6 && cross-env BASE_URL=http://127.0.0.1:8000 TEST_TYPE=smoke K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true k6 run -o experimental-prometheus-rw --summary-mode=legacy dist/main.js",
    "run:k6:prom:load": "npm run build:k6 && cross-env BASE_URL=http://127.0.0.1:8000 TEST_TYPE=load K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true k6 run -o experimental-prometheus-rw --summary-mode=legacy dist/main.js",
    "run:k6:prom:endurance": "npm run build:k6 && cross-env BASE_URL=http://127.0.0.1:8000 TEST_TYPE=endurance K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true k6 run -o experimental-prometheus-rw --summary-mode=legacy dist/main.js",

    "watch:k6": "esbuild src/tests/test.ts --bundle --format=esm --platform=neutral --outfile=dist/main.js --external:k6 --external:k6/* --watch"
  }
}
```

---

## Future Enhancements

- CI integration (GitHub Actions)
- Grafana dashboards

---

## License

MIT
