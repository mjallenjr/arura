# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest on `main` | ✅ Yes |
| Older releases | ❌ No |

Only the latest version of arura on the `main` branch receives security updates.

---

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, we appreciate your help in disclosing it responsibly.

### How to Report

1. **Email**: Send a detailed report to **security@arura.app**
2. **Subject line**: `[SECURITY] Brief description of the vulnerability`
3. **Include** as much of the following as possible:
   - Type of vulnerability (e.g., XSS, SQL injection, authentication bypass, data exposure)
   - Affected files or components
   - Step-by-step instructions to reproduce the issue
   - Proof of concept (code, screenshots, or video)
   - Potential impact and severity assessment

### What to Expect

| Timeframe | Action |
|---|---|
| **24 hours** | Acknowledgement of your report |
| **72 hours** | Initial assessment and severity classification |
| **7 days** | Status update with remediation plan |
| **30 days** | Target resolution for critical/high severity issues |

### Severity Levels

| Level | Description | Example |
|---|---|---|
| **Critical** | Immediate risk to user data or system integrity | Authentication bypass, remote code execution |
| **High** | Significant impact requiring prompt action | Privilege escalation, data leakage |
| **Medium** | Moderate impact with limited scope | Stored XSS, CSRF in non-critical flows |
| **Low** | Minimal impact or requires unlikely conditions | Information disclosure of non-sensitive data |

---

## Scope

The following are **in scope** for security reports:

- Authentication and session management
- Row-Level Security (RLS) policy bypasses
- Cross-site scripting (XSS) and injection attacks
- Insecure direct object references
- Data exposure through API endpoints
- Edge function vulnerabilities
- Push notification abuse
- Payment/Stripe integration security

The following are **out of scope**:

- Denial of service (DoS/DDoS) attacks
- Social engineering or phishing
- Vulnerabilities in third-party dependencies (report these upstream)
- Issues in development/staging environments
- Rate limiting on non-critical endpoints

---

## Safe Harbor

We consider security research conducted in good faith to be authorized. We will not pursue legal action against researchers who:

- Make a good faith effort to avoid privacy violations, data destruction, or service disruption
- Only interact with accounts they own or have explicit permission to test
- Report vulnerabilities promptly and do not publicly disclose before resolution
- Do not exploit vulnerabilities beyond what is necessary to demonstrate the issue

---

## Security Best Practices for Contributors

When contributing to arura, please follow these security guidelines:

- **Never commit secrets** — use environment variables for all API keys and credentials
- **Use design tokens** — avoid hardcoded values that could leak internal configuration
- **Validate all inputs** — both client-side and in edge functions
- **Respect RLS policies** — never bypass Row-Level Security; always test data access rules
- **Keep dependencies updated** — check for known vulnerabilities before adding packages
- **Use parameterized queries** — never concatenate user input into SQL

---

## Acknowledgements

We gratefully recognize security researchers who help keep arura and its community safe. With your permission, we'll add your name here after a vulnerability is resolved.

---

**Thank you for helping keep arura secure. 🔒**
