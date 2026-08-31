# Security Policy

## Reporting a vulnerability
Do not post secrets, tokens, private URLs, personal data, exploit details, or sensitive logs in a public issue.

If GitHub private vulnerability reporting is enabled, use it. Otherwise open a minimal issue that says you found a security problem and leave out sensitive details until a private channel is established.

## Security expectations
- Never commit credentials or provider tokens.
- Keep browser-side AI free of embedded secrets.
- Treat player names/settings as local user data.
- Validate untrusted input and model output before using it.
- AI/model failures must fall back safely without blocking gameplay.
- Review third-party CDN/dependency updates before release.
