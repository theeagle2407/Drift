# Drift

### See what quietly changed in your spending.

Drift transforms an ordinary bank statement into a private money changelog. It detects subscriptions that appeared, charges that increased, possible duplicate payments, and fees quietly reducing your balance—then turns confirmed findings into a practical recovery plan.

**No account. No bank connection. No statement upload. Everything runs inside your browser.**

## The problem

Bank statements record transactions, but they do not explain what changed.

A subscription begins unnoticed. A familiar charge becomes more expensive. The same payment appears twice. Small fees accumulate across the month.

Most people only discover these changes after losing money for months.

Drift makes them visible immediately.

## What Drift finds

| Detection | What it reveals |
|---|---|
| New recurring charges | Merchants that appeared in the latest month |
| Price increases | Familiar charges that became more expensive |
| Possible duplicates | Similar payments occurring unusually close together |
| Accumulated fees | Transfer, service, maintenance, and processing fees |
| Monthly drift | The total increase between the two analyzed periods |

Every finding includes the supporting transactions and a confidence score. Drift flags patterns for review—it never falsely presents them as confirmed fraud.

## How it works

1. Drop a CSV statement or paste transaction rows.
2. Drift automatically detects the columns and currency.
3. Review a visual month-to-month money changelog.
4. Mark each finding as expected, worth reviewing, or something to stop.
5. Download a readable action plan.
6. Revisit previous analyses through private browser history.

## Privacy by design

Drift analyzes statements entirely inside the browser.

- Transaction data is never uploaded.
- No account or bank connection is required.
- No external AI receives financial information.
- Only compact analysis summaries are saved locally.
- Saved history can be cleared at any time.

This is not merely a privacy promise—the application has no statement-processing backend.

## Why Drift is different

Budgeting applications show where money went.

Drift shows **what changed**.

Instead of overwhelming users with charts and categories, it focuses on one urgent question:

> “What started, increased, repeated, or quietly cost me more?”

That makes the result understandable in seconds and actionable immediately.

## Supported statements

Drift accepts:

- CSV files, including quoted fields
- Pasted comma-separated transactions
- Tab-separated bank exports
- Markdown-style transaction tables
- Statements containing repeated headers
- Separate debit or signed-amount columns

It automatically excludes pending, failed, declined, reversed, and cancelled transactions when status information is available.

Currency detection supports NGN, USD, GBP, EUR, GHS, KES, and ZAR.

## Technical design

Drift is a dependency-free browser application built with HTML, CSS, and JavaScript and served through a minimal Node.js server.

Its detection engine is deterministic and explainable. Every result can be traced directly to the transactions that produced it.

```text
Statement
   ↓
Local parsing and normalization
   ↓
Period and currency detection
   ↓
Change-detection engine
   ↓
Evidence-backed findings
   ↓
Personal recovery plan


