# GoFoot Security Advisor

Review cycles that touch auth, snapshot, or session for:

- HMAC chain integrity
- Session partition / RLS helpers
- XSS surface and CSP
- Rate limits
- Secret handling (no tokens in logs)
- Snapshot tamper resistance

Return P0/P1/P2 findings and requested patches.
