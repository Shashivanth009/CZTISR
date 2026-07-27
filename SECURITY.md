# 🛡️ Security Policy — C5ISR Zero Trust Platform

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report security issues by emailing:

📧 **shashivanth009@gmail.com**

Include the following in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive a response within **48 hours** acknowledging receipt of your report.

---

## Scope

The following are in scope for security reports:

| Area | Examples |
|:-----|:---------|
| **Authentication** | JWT bypass, TOTP bypass, brute force lockout circumvention |
| **Authorization** | Bell-LaPadula violation, RBAC bypass, clearance escalation |
| **Injection** | SQL injection, command injection, XSS |
| **Data Exposure** | Credential leakage, token exposure, PII in logs |
| **Infrastructure** | Docker misconfiguration, open ports, default credentials |
| **Dependencies** | Known CVEs in `requirements.txt` or `package.json` packages |

---

## Out of Scope

- Demo/default credentials (`password` for all users) — this is intentional for demonstration
- Denial of service against the demo deployment
- Social engineering attacks
- Issues in third-party services (Render.com, Vercel)

---

## Security Measures

### Currently Implemented

| Measure | Implementation |
|:--------|:---------------|
| Password Hashing | `bcrypt` via `passlib` (auto-deprecation) |
| Authentication | JWT (HS256) with 30-minute TTL |
| Multi-Factor Auth | TOTP (RFC 6238) via `pyotp` |
| Brute Force Protection | 5 attempts → 300-second lockout per IP:user |
| Device Trust | 4-factor scoring (Browser, TLS, Hours, Origin) |
| Access Control | Bell-LaPadula (MAC) + RBAC |
| Audit Trail | Immutable PERMIT/DENY log with risk scoring |
| Transport | HTTPS (Render/Vercel), WSS for WebSocket |
| CORS | Configurable allowed origins |

### Known Limitations (Demo Context)

> ⚠️ This is a demonstration platform. The following are known areas for production hardening:

- Default credentials should be replaced with strong, unique passphrases
- TOTP secrets are hardcoded — use encrypted vault storage in production
- JWT secret (`supersecretkey`) should be rotated and stored securely
- In-memory stores should be migrated to PostgreSQL/Redis
- CORS is set to `*` for demo flexibility — restrict in production
- Rate limiting is IP-based — consider token-bucket or sliding window

---

## Supported Versions

| Version | Supported |
|:--------|:---------:|
| Latest `main` | ✅ |
| Older commits | ❌ |

---

## Disclosure Policy

1. Reporter submits vulnerability via email
2. Maintainer acknowledges within 48 hours
3. Maintainer investigates and develops a fix
4. Fix is deployed and reporter is credited (if desired)
5. Public disclosure after fix is live (coordinated disclosure)

---

<div align="center">
  <sub>🛡️ Security policy for C5ISR Zero Trust Platform</sub>
</div>
