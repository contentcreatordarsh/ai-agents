# SE Technical Assignment — Presentation Outline

Copy each section into one slide (title + bullets). Add screenshots from your dashboard and terminal.

---

## Slide 1 — Title

- Your name
- Domain used
- Date of Technical Panel

---

## Slide 2 — Goals

- Origin that echoes HTTP headers
- Traffic through Cloudflare with strict TLS
- Rate limiting, Tunnel, Zero Trust Access, Worker + R2

---

## Slide 3 — Architecture

- Diagram: User → Cloudflare → (DNS proxy | Tunnel) → Origin
- Worker + Access on `tunnel.domain/secure`
- Private R2 for flag assets

---

## Slide 4 — Step 1: Origin server

- Platform chosen (e.g. DigitalOcean, AWS, local VM)
- Stack: Python Flask + gunicorn (or Docker)
- Demo: screenshot of `curl` showing headers

---

## Slide 5 — Step 2–3: Proxy and TLS

- DNS proxied record
- Let's Encrypt (or other non-CF cert) on origin
- SSL mode: Full (strict)
- Why strict mode matters for customers (no insecure origin)

---

## Slide 6 — Step 4: Rate limiting

- Rule definition (host, path, threshold)
- Customer demo: loop `curl` + Security Events
- Use cases: APIs, login, scraping protection

---

## Slide 7 — Step 5: Cloudflare Tunnel

- Why tunnel (no open inbound ports, consistent egress)
- `tunnel.domain` DNS and `cloudflared` on origin
- Use cases: hybrid IT, ephemeral dev environments

---

## Slide 8 — Step 6–7: Zero Trust Access

- IdP chosen (or OTP)
- Application on `/secure`
- Policies: your user + `@cloudflare.com`
- Bypass prevention: firewall / localhost bind + tunnel only

---

## Slide 9 — Step 8: Worker + R2

- Wrangler deploy, public Git repo link
- HTML at `/secure` with email, timestamp, country link
- `/secure/CC` serves flag from private bucket
- Code walkthrough (1–2 minutes)

---

## Slide 10 — Product use cases

- CDN/WAF: performance and L7 security
- Tunnel: secure connectivity without VPN sprawl
- Access: SSO for internal apps
- Workers + R2: edge logic and private assets

---

## Slide 11 — Learning journey

- What you researched (docs, IPs, Access headers)
- Gaps filled (certs, tunnel ingress, Worker routes)

---

## Slide 12 — Customer experience

- What a non-technical buyer sees (login, fast site, blocked attacks)
- What an engineer sees (dashboards, logs, IaC via Wrangler)

---

## Slide 13 — Live demo plan

- Order: headers site → rate limit → tunnel `/secure` → flag link
- Fallback screenshots if live network fails

---

## Slide 14 — Q&A

- Repository URL
- Thank you
