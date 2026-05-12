# Performance suite — k6

Enterprise load-testing layer for the Testition platform. Lives alongside
the Playwright QA suite but runs on a different cadence (weekly, not per-PR).

## Why k6 (decision log)

| Tool | Verdict |
|---|---|
| **k6** | ✅ JavaScript, single Go binary, native threshold language, Prometheus/InfluxDB sinks. Same lang as the Playwright suite |
| JMeter | ❌ XML test plans are unreviewable in git, GUI-centric workflow |
| Locust | ❌ Python; slower than k6 at high RPS |
| Gatling | ❌ Scala — wrong language for this team |

## Directory

```
perf/
├── config/
│   ├── env.js              # Per-env API URLs + credentials
│   └── thresholds.js       # SLO definitions (p95, p99, error rate)
├── helpers/
│   ├── auth.js             # Login once per VU, cache token
│   ├── data.js             # Realistic search query distribution
│   └── utils.js            # Think time, tag helper
├── scenarios/
│   ├── smoke.js            # 1 VU, 30s — pre-flight check
│   ├── load-search.js      # 50 VUs, 5min — hottest path
│   ├── load-login.js       # 30 req/sec constant, 3min — bcrypt-bound
│   ├── load-wallet.js      # Authenticated, 20 VUs — read+write mix
│   ├── stress.js           # Ramp to 300 VUs — find the ceiling
│   ├── spike.js            # 10× burst — marketing-campaign simulation
│   └── soak.js             # 20 VUs × 30min — leak detection
└── observability/
    ├── docker-compose.yml  # Local InfluxDB + Grafana
    ├── grafana-datasource.yml
    └── grafana-dashboard.json
```

## SLO contract

Enforced as k6 thresholds — if breached, CI fails:

| Endpoint | p95 | p99 | Error rate |
|---|---|---|---|
| `GET /properties/search` | 500ms | 1000ms | 1% |
| `POST /auth/login` | 300ms | 800ms | 0.5% |
| `GET /properties/{id}` | 600ms | 1200ms | 1% |
| `GET /wallet` | 400ms | — | 1% |
| `POST /wallet/topup/checkout` | 800ms | 2000ms | 2% |

Edit `config/thresholds.js` to tighten or relax. Loosening is a deliberate
business decision — flag it in the PR description.

## Quick start

### Install k6

```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg -k && \
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 && \
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list && \
sudo apt-get update && sudo apt-get install -y k6

# Docker (no install)
docker run --rm -v $(pwd):/scripts grafana/k6 run /scripts/perf/scenarios/smoke.js
```

### Run a scenario

```bash
# Boot the app locally first (backend on :8080)
cd qa-automation

# Smoke — always run this first
k6 run -e ENV=local perf/scenarios/smoke.js

# Load test — search
k6 run -e ENV=local perf/scenarios/load-search.js

# Load test — login
k6 run -e ENV=local perf/scenarios/load-login.js

# Stress (longer; warn the team first)
k6 run -e ENV=staging perf/scenarios/stress.js
```

### Live dashboard (optional but recommended)

```bash
# Boot InfluxDB + Grafana
docker compose -f perf/observability/docker-compose.yml up -d

# Run with --out flag to stream metrics
k6 run --out influxdb=http://localhost:8086/k6 perf/scenarios/load-search.js

# Open dashboard
open http://localhost:3001
```

You'll see live charts of: RPS per endpoint, p95 latency, error rate, active VUs.

## CI

`.github/workflows/perf.yml` runs the perf suite:

| Trigger | Scenario | Env |
|---|---|---|
| **Cron — Sun 21:30 UTC** | `load-search` | staging |
| **Manual dispatch** | Pick from dropdown | Pick env |

Results land as a GitHub artifact (`summary.json`, `metrics.json`) with 30-day retention.

## Reading the output

k6 prints a summary block at the end of every run. The important rows:

```
http_req_duration..............: avg=187.4ms  p(95)=412ms   ← Is this under your SLO?
http_req_failed................: 0.42% ✓ 12   ✗ 2853       ← Error rate
http_reqs......................: 2865    143.21/s         ← Throughput
✓ search status 200..............: 100.00% ✓ 2865 ✗ 0
```

If a threshold breaches, k6 exits non-zero. Look for the line:

```
✗ http_req_duration{endpoint:search}: p(95)=812ms < 500ms
```

That's the smoking gun — `endpoint:search` blew the p95 budget.

## Anti-patterns

- ❌ Running stress/soak on production without coordinating with on-call
- ❌ Loosening thresholds quietly because a test "feels slow today" — promote it to a PR with reasoning
- ❌ Removing `thinkTime()` to "make the test go faster" — destroys realism, every result becomes a cache-flatter artifact
- ❌ Hard-coding listing IDs — use the search response to drive subsequent requests, like real users do
- ❌ Running multiple long scenarios in parallel on the same env — they collide on connections and the numbers lie

## Extending — adding a new scenario

1. Decide the executor (`constant-vus`, `ramping-vus`, `constant-arrival-rate`).
2. Tag every HTTP call with `tag("endpoint_name")`.
3. Add an SLO to `config/thresholds.js` for that endpoint.
4. Reference the threshold in `options.thresholds`.
5. Test locally with 5 VUs × 30s first; if it works, scale up.

## Things this suite intentionally does NOT do

- **Realistic geographic distribution** — k6 runs from one location. For
  multi-region perf use [k6 Cloud](https://k6.io/cloud) or run from
  multiple regional CI runners.
- **Browser-rendered perf** (Lighthouse / Web Vitals) — that's a different
  tool. See [k6 browser module](https://k6.io/docs/using-k6-browser/) if
  you need it.
- **Database-level profiling** — pair this with `pg_stat_statements` and
  Datadog APM. Perf tests show *what* is slow; APM shows *why*.
