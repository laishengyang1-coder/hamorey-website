# HAMOREY Tencent Launch Handoff

Updated: 2026-07-29

## Current baseline

- GitHub `main` is the only source of truth.
- A push to `main` runs the Tencent production workflow and deploys to the current Tencent preview address: `http://134.175.187.12`.
- Tencent production components are Nginx static hosting, PM2 `hamorey-api`, TencentDB MySQL, and COS assets.
- Cloudflare Pages is retained only as an emergency rollback path. Its GitHub Actions workflow is currently manually disabled and must not be re-enabled or deleted before Tencent's formal domain launch is stable.
- ICP filing has passed. The site-specific record number is `皖ICP备20013908号-8`. As of 2026-07-29, the formal root/system/api/www hostnames still have no public A record and no working HTTPS endpoint, so do not switch public traffic or submit a mini-program release yet.

## Changes in this handoff

1. API login defense: failed login attempts are limited to 10 per IP in 15 minutes. Successful requests are not counted. Values are configurable in `/etc/hamorey/api.env` using `LOGIN_RATE_LIMIT_WINDOW_MS` and `LOGIN_RATE_LIMIT_MAX`.
2. Tencent Nginx deployment: Gzip is enabled, hashed `/assets/` files receive one-year immutable cache headers, HTML remains non-cacheable, and API responses are explicitly `no-store`.
3. Cloudflare safety: the existing Cloudflare Actions workflow is manually disabled in GitHub, so pushes currently deploy Tencent only. Its YAML still contains the historical `push` trigger; do not re-enable it. Converting that YAML to `workflow_dispatch` only requires a GitHub token with `workflow` scope and is a later cleanup task.
4. Mini-program endpoint routing: development, trial, and release builds currently use the Tencent preview IP. `miniprogram/config/runtime.js` contains the formal API `https://api.hemoppf.cn/api`, but `ENABLE_FORMAL_RELEASE_API` is deliberately `false` until DNS, HTTPS, and WeChat legal domains are verified. Flip it in a reviewed commit immediately before the first formal release.
5. Domain readiness: `scripts/tencent-domain-cutover-check.sh` verifies DNS and Tencent API health after ICP approval. It does not change DNS or issue certificates.

## Required working rules

- Always start with `git fetch origin && git pull --ff-only origin main` and use the current `main` commit as the baseline.
- Never commit database credentials, COS keys, deployment keys, certificates, or `/etc/hamorey/api.env` content.
- Never run database reset/import scripts against Tencent production unless a dated backup has been created and the business owner explicitly confirms the operation.
- Do not turn the Cloudflare workflow back on. It is a rollback option only until Tencent has been stable on HTTPS for at least 48 hours.
- Keep all API changes backward compatible with both the website and the mini-program. Run `npm run test:contracts`, `npm run build`, and `npm --prefix server run build` before pushing.
- `npm --prefix server run typecheck` currently reports an existing Node/Workers global type conflict. Do not treat it as a release blocker; fix it separately without loosening the root Functions type checks.

## ICP passed: ordered cutover

1. Add DNS A records for `hemoppf.cn`, `system.hemoppf.cn`, `api.hemoppf.cn`, and `www.hemoppf.cn` to `134.175.187.12`.
2. Confirm the Tencent security group permits TCP 80 and 443.
3. Run `SERVER_IP=134.175.187.12 bash scripts/tencent-domain-cutover-check.sh` on the Tencent server. Do not continue until it prints `HAMOREY_DOMAIN_CUTOVER_READY`.
4. Configure the Nginx TLS virtual hosts and a certificate covering all four hostnames. Update `/etc/hamorey/api.env`:

   ```env
   CORS_ORIGIN=https://hemoppf.cn,https://system.hemoppf.cn,https://www.hemoppf.cn
   SITE_URL=https://system.hemoppf.cn
   ```

5. Run the normal Tencent deploy workflow, then verify `https://system.hemoppf.cn/api/health` and an administrator login.
6. In WeChat public platform, add `https://api.hemoppf.cn` as the request, uploadFile, and downloadFile legal domain. Add the COS public hostname too if mini-program images upload or download directly from COS.
7. Change `ENABLE_FORMAL_RELEASE_API` to `true`, test the mini-program in WeChat Developer Tools and on a real phone, then submit and publish a release build.
8. Place the site-specific ICP record number in the website footer. Do not use the ICP subject record number shown on the dashboard. Complete the WeChat mini-program filing with the same company subject, and complete public-security online filing within the required time after the website goes live.
9. After 48 hours of stable HTTPS traffic, export final Tencent backups and then decide whether to retire Cloudflare.

## Items needing business or supplier input

- Privacy policy, user agreement, customer-service contact, data-retention wording, and complaint process need a business/legal owner to confirm factual content.
- This system should prepare for a possible MLPS Level 2 assessment because it has multiple external roles and warranty/vehicle/customer information. A qualified MLPS supplier should make the final classification and quote the assessment/remediation work.
- Do not buy extra cloud security products or a higher database tier solely for compliance before the supplier gives a written scope.

## Current manual acceptance checklist

- Website: public query, HQ login, provincial login, store login, warranty creation, warranty search, code allocation, upload/download images.
- Mini-program: public query, store login, province login, warranty entry, quotation query, image upload, logout/login recovery.
- Admin: organizations, products, warranty codes, points, redemptions, dashboard, China store map, pagination and export.
- Production: `/api/health` returns MySQL and COS `ok`; no browser console errors; no API response is stale after a hard refresh.
