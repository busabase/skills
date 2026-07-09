---
name: log-coder
description: Analyze app logs (Local, OpenObserve, ES) to identify, diagnose, and fix errors automatically.
disable-model-invocation: false
allowed-tools: Bash(cat:*), Bash(tail:*), Bash(grep:*), Bash(curl:*), Read, Edit, Write, Grep, Glob, Skill, WebFetch
user-invocable: true
---

# Log Coder

Analyze logs from multiple sources to detect errors and provide automated fixes.

## Supported Log Sources

1.  **Local**: `apps/<app-name>/.logs/app-YYYY-MM-DD.log`
2.  **OpenObserve (OO)**: Remote log API with SQL support.
3.  **Elasticsearch (ES)**: Remote log API.

## Configuration & Auth

Log sources and credentials should be retrieved from environment variables or `.env` files:
- `LOG_SOURCE_TYPE`: `local` | `openobserve` | `elasticsearch`
- `OPENOBSERVE_URL`: e.g., `https://log.bika.ltd/api/default/_search`
- `OPENOBSERVE_USER`, `OPENOBSERVE_PASS`
- `OPENOBSERVE_STREAM`: e.g., `kapp_source_log`
- `ES_URL`, `ES_INDEX`, `ES_API_KEY` (or `ES_USER`/`ES_PASS`)

## Workflow

### 1. Identify the Source and App
- Determine the target app (e.g., `buda`, `productready`).
- For **OpenObserve**: Use the provided SQL search API to filter logs.
  - **Table**: Specified by `OPENOBSERVE_STREAM`.
  - **Filter**: Filter by `kubernetes_deployment_name` or `app` fields.
  - **Time Range**: Use `start_time` and `end_time` (microseconds) to focus on recent errors.

### 2. Fetch and Analyze Logs
- **Local**: Read last 200 lines.
- **OpenObserve**: Execute SQL query via `curl`.
  ```bash
  curl 'OPENOBSERVE_URL?type=logs&use_cache=true' \
    -u 'USER:PASS' \
    --data-raw '{"query":{"sql":"SELECT * FROM \"STREAM\" WHERE kubernetes_deployment_name = '\''APP_NAME'\'' AND (level = '\''error'\'' OR level = '\''fatal'\'') ORDER BY \"@timestamp\" DESC","start_time":START,"end_time":END,"from":0,"size":50,"sql_mode":"full"}}'
  ```
- Parse JSON logs to extract `message`, `stack`, and `context`.

### 3. Diagnose the Root Cause
- Use `Grep` or `Glob` to find the relevant code files mentioned in the stack trace.
- Compare with `apps/productready` for infrastructure alignment.

### 4. Propose and Apply Fixes
- Explain the root cause.
- Apply the fix using `Edit` or `Write`.
- **CRITICAL**: Adhere to `VO/DTO/PO` pattern and design system rules.

### 5. Verify and Log
- Run `make typecheck` to ensure no regression.
- **MANDATORY**: Create a changelog entry.

## Usage
```bash
/log-coder <app-name>                   # Use default source from env
/log-coder <app-name> --source local    # Force local logs
/log-coder <app-name> --source remote   # Force remote logs (OO/ES)
```

## Rules
- **SECURITY**: Never print raw passwords or API keys in the conversation. Use `curl -u 'USER:PASS'` style.
- **AUTH**: If credentials are missing, ask the user to provide them or set the corresponding `.env` variables.
- **REFERENCE**: Always check `apps/productready` first.
- **KUI**: Stop if the error is in `packages/kui`.
