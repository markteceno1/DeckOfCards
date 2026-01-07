# Testplan.md — Deck of Cards API Performance Test Plan

## 1. Goals

**Primary goals**
- Validate the API meets latency, reliability, and throughput expectations under realistic usage.
- Detect regressions (latency spikes, error-rate increases) early via repeatable test runs and thresholds.
- Characterize performance limits and identify bottlenecks.

**Non-goals**
- Functional correctness beyond basic success checks (these tests are performance-focused).
- Security testing, fuzzing, or penetration testing.

---

## 2. System Under Test

**API surface covered**
- **Deck API**
  - Create & shuffle deck
  - Shuffle existing deck
  - Draw cards
  - Create partial deck
  - Open new deck (optional jokers)
- **Pile API**
  - Add to pile
  - Shuffle pile
  - List pile
  - Draw from pile
- **Return API**
  - Return specific cards to deck
  - Return all cards to deck
  - Move cards pile → pile
  - Return cards pile → deck

**Target environments**
- Local (default): `BASE_URL=http://127.0.0.1:8000`and `API_PREFIX=/api/deck`
- Public API (optional): `BASE_URL=https://deckofcardsapi.com` and `API_PREFIX=/api/deck`

> Note: Local Django runs should disable HTTP→HTTPS redirect for k6 HTTP runs (e.g., `SECURE_SSL_REDIRECT = False`).

---

## 3. Performance Testing Approach

We use **k6** with **TypeScript** and modular API clients. The approach is:

1. **Model realistic user flows** (create → draw → pile operations → return).
2. **Isolate behaviors** using static `group()` names (stable metric series and thresholds).
3. **Validate responses** with checks (HTTP status + key fields) while keeping check names stable.
4. **Apply thresholds** to fail fast on regressions.
5. **Export metrics** to Prometheus via remote-write for dashboards and long-term trend analysis.

### Workload Modeling
- **Smoke**: Minimal traffic to validate correctness and wiring.
- **Load**: Sustained/steady traffic to validate expected production behavior.
- **Endurance (soak)**: Long duration to uncover memory leaks, resource exhaustion, and degradation over time.

### Data Strategy
- Each scenario iteration creates its own deck to avoid cross-VU shared-state collisions.
- Card codes are extracted from draw calls and re-used for pile and return operations.
- Avoids “infinite cardinality” metric tags (no deck IDs in metric names).

---

## 4. Scenarios

Scenarios are selected via `TEST_TYPE` and defined in `src/tests/scenarios.ts`.

### 4.1 Smoke Test
**Purpose:** Confirm endpoints are reachable and responses are valid.

- Executor: `per-vu-iterations`
- VUs: 1
- Iterations: 1 (or a small number)

**Flow (example)**
- Create & shuffle deck
- Shuffle deck
- Draw cards
- (Optional) Open new deck
- Create partial deck
- Pile/Return flows may be enabled/disabled depending on local readiness

**Pass criteria**
- Error rate < 1%
- p90 group durations below baseline thresholds (see section 6)

---

### 4.2 Load Test
**Purpose:** Validate the API under expected traffic volume and ramp patterns.

- Executor: typically `ramping-arrival-rate` (arrival-rate based)
- Stages: ramp up → steady → ramp down

**Flow**
- Deck scenario
- Pile scenario
- Return scenario

**Pass criteria**
- Error rate < 1%
- Latency percentiles (p90/p95) within SLO thresholds for each group
- No sustained increase in latency during steady stage

---

### 4.3 Endurance (Soak) Test
**Purpose:** Validate stability under long-running traffic and detect degradation.

- Executor: typically `ramping-arrival-rate` (lower constant target)
- Stages: ramp up → long steady (hours) → ramp down

**Pass criteria**
- Error rate < 1% (or defined per environment)
- p90/p95 remains stable over time (no upward trend)
- No resource-related failures (timeouts, connection errors)

---

## 5. Instrumentation & Observability

### 5.1 k6 Built-in Metrics
We rely on:
- `http_req_failed` (error rate)
- `http_req_duration` (request latency)
- `group_duration` (latency per group; key metric for endpoint “bundles”)
- `http_reqs`, `iterations`, `vus`

### 5.2 Group & Check Conventions
**Groups**
- Use static `groupName` strings, e.g.:
  - `Create & Shuffle Deck`
  - `Draw Cards`
  - `Add to pile`
  - `Draw from pile`
  - etc.

**Checks**
- Use stable check keys:
  - `Group Name | status is 200`
  - `Group Name | success is true`
  - `Group Name | N cards returned`

This makes results readable and threshold-friendly.

### 5.3 Prometheus Remote Write (Optional but Recommended)
Enable:
- `K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write`
- `K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true`

This exports Trend metrics as histograms for accurate aggregation across runs.

### 5.4 Environment Monitoring

- The test environment must be instrumented to provide visibility into application and infrastructure behavior.
- Metrics collection must include:
  - Application-level performance metrics
  - Environmental metrics (CPU, memory, disk I/O, network utilization)
- Observability tooling must be validated prior to test execution.
- Metrics must be continuously captured and retained for the full test duration.
- Any gaps in telemetry, metric loss, or ingestion failures must be documented.
- Test results impacted by incomplete or unreliable monitoring data should be considered invalid.

---

## 6. Measuring & Evaluating Performance

### 6.1 Success Criteria
We evaluate performance via:
1. **Reliability**: `http_req_failed` rate
2. **Latency**: group-level duration percentiles (p90/p95)
3. **Throughput**: requests per second / arrival rate achieved
4. **Stability**: latency over time, no increasing trend (especially in soak tests)
5. **Environment**: System resources (CPU, memory, disk, network) remain within expected operating thresholds throughout the test

### 6.2 Thresholds (Examples)
Thresholds are defined per group. Example pattern:

- `http_req_failed`: `rate < 0.01`
- `group_duration{group:::<Group Name>}`: `p(90) < 500ms` (tune per environment)

Example:
- `group_duration{group:::Create & Shuffle Deck}`: `p(90)<500`
- `group_duration{group:::Draw Cards}`: `p(90)<500`

> Tune thresholds after establishing a baseline in the target environment.

### 6.3 PromQL Examples (Histogram Quantiles)
If histograms are enabled:

**p95 request duration**
```promql
histogram_quantile(0.95, sum by(le, name, method, status) (rate(k6_http_req_duration_seconds{testid=~"$testid"}[$__rate_interval])))
```

**p90 group duration**
```promql
histogram_quantile(0.90, sum by(le, name, method, status) (rate(k6_http_req_duration_seconds{testid=~"$testid"}[$__rate_interval])))
```

### 6.4 Baseline & Regression Strategy
- Establish a baseline from a known-good commit in the target environment.
- Compare subsequent runs:
  - p90/p95 per group
  - error rate
  - throughput achieved
- Fail CI on threshold breaches.

### 6.5 Environmental Monitoring

- Environmental metrics are monitored continuously during test execution.
- System resources (CPU, memory, disk I/O, network) must remain within expected operating thresholds.
- Infrastructure events (deployments, scaling activities, configuration changes) must be recorded.
- Resource saturation or environmental instability must be documented.
- Tests affected by environmental issues should be flagged and rerun under stable conditions.

---

## 7. Execution Guide

### 7.1 Build
```bash
npm install
npm run build:k6
```

### 7.2 Run (local)
```bash
npm run run:k6:smoke
npm run run:k6:load
npm run run:k6:endurance
```

### 7.3 Run with Prometheus RW + histograms
```bash
npm run run:k6:prom
npm run run:k6:prom:load
npm run run:k6:prom:endurance
```

---

## 8. Risks & Mitigations

- **HTTP→HTTPS redirect locally** can cause TLS parsing errors  
  → Disable redirect in local Django settings or ensure TLS termination exists.
- **High cardinality metrics** (dynamic group names, deck IDs in labels)  
  → Keep group/check names static; avoid tagging with per-request unique IDs.
- **Non-JSON responses** (HTML error pages/redirects)  
  → Use the defensive `parseJson` helper to surface status/URL/body snippets.

---

## 9. Reporting

Outputs:
- k6 CLI summary for quick feedback
- Prometheus/Grafana dashboards for:
  - latency percentiles per group
  - error rate
  - throughput
  - soak trends over time

Artifacts to track per run:
- Git commit hash
- `TEST_TYPE`
- `BASE_URL`
- k6 version
- environment notes (local vs staging vs prod-like)
