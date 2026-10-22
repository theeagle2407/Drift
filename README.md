# Drift

**See what quietly changed in your spending.**

Drift turns a bank-statement export into a private money changelog. It surfaces recurring charges, price increases, possible duplicates, and fees, then lets the user turn confirmed findings into a practical recovery plan.

## Why it matters

Bank statements show transactions, not change. The costly details are usually buried across months: a subscription starts, a familiar charge rises, a payment appears twice, or small fees accumulate. Drift makes those changes visible in one focused workflow.

## Product flow

1. Drop a CSV or paste transaction rows.
2. Confirm the automatically detected structure and currency.
3. Review month-to-month changes with supporting transactions.
4. Mark each finding as expected, worth reviewing, or something to stop.
5. Download a readable recovery plan.

## Privacy by design

Statement parsing and analysis happen entirely in the browser. Transaction data is not uploaded or stored on a server. History is limited to compact analysis summaries saved in the same browser and can be cleared at any time.

## Supported input

- CSV files, including quoted cells
- Pasted comma-separated rows
- Tab-separated bank exports
- Markdown-style tables
- Automatic removal of repeated headers and table separators
- Automatic exclusion of pending, failed, declined, reversed, or cancelled rows when a status column exists

Drift automatically recognizes common date, merchant, amount, debit, and status column names. It detects NGN, USD, GBP, EUR, GHS, KES, and ZAR when currency information is present, otherwise it asks the user once.

## Run locally

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Verify

```bash
npm run check
npm test
```

## Technical notes

Drift is a dependency-free browser application served by a minimal Node.js static server. The detection system is deterministic and explainable: findings always include the transactions and comparison that produced them. Drift flags patterns, not fraud, and never claims to cancel a charge automatically.

## License

MIT
