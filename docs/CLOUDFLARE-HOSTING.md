# Cloudflare deployment

Live: https://polynomial-pandemonium.pages.dev/

Published successfully via Cloudflare Pages Direct Upload. Verified live app loading, degree-seven Max Poly, factoring worker, labels, X-only scaling, and Fit View. Deployment package metadata is in `deployment/cloudflare-package.json`.

## Initial trial

Target: a separate Cloudflare Pages project named `polynomial-pandemonium` (subject to availability). No cloud database, account system or file storage is needed. The site's static production assets are the only files to upload; the GeoGebra source, source inventory and local filesystem paths are not part of the deployment.

Build with `pnpm build`, then run `python3 scripts/package-cloudflare.py`. Upload `deployment/polynomial-pandemonium-cloudflare.zip` to Cloudflare Pages using Direct Upload. The ZIP places index.html at its root and includes the bundled factorization worker and assets.

Direct Upload projects cannot be converted to Cloudflare's built-in Git integration; create a new project if that is desired later. Direct-upload projects can still receive automated deployments through Wrangler/CI.

## Future library

Keep each app in its own project and repository, so it can be updated independently. Add a separate library homepage when requested. Initially it can link to each app's pages.dev address. Later a custom domain can use a root homepage with app subdomains, for example:

- `example.org` — library homepage
- `poly.example.org` — Polynomial Pandemonium
- `pnav.example.org` — pnav
- `qsb.example.org` — QSB

These are illustrative addresses, not configured domains. No homepage or additional apps have been deployed as part of the initial trial.

## Verification after deployment

Open the deployed HTTPS URL. Check degree/coefficient changes, degree-seven Max Poly, feature labels, Factored Form and precision (worker loading), independent X/Y zoom, and JSON open/save. Native Save As support depends on the visiting browser; the filename/download fallback remains available where unsupported.

Documentation: https://developers.cloudflare.com/pages/get-started/direct-upload/

## GitHub Actions deployment

`.github/workflows/deploy-cloudflare.yml` runs locked installation, tests and a production build on pull requests and pushes to main. Only main pushes or a manual main run deploy. The deploy job downloads the tested build artifact and targets the existing `polynomial-pandemonium` Pages project, preserving its public URL. Build artifacts are retained for 14 days.

Required GitHub Actions repository secret: `CLOUDFLARE_API_TOKEN`. Create a Cloudflare API token granting Account → Cloudflare Pages → Edit only for the owning account. Keep the token in GitHub's encrypted secret store, never in source files or chat. Cloudflare grants this permission at account level, so the token can affect Pages projects within that account, not just this app.

The account identifier in the workflow is not a credential. Deployments use `main` as the production branch; verify that matches the Pages project's production branch before enabling the first run. No GitHub write permission is required by the workflow.

After the secret is configured, use Actions → Test and deploy to Cloudflare Pages → Run workflow (main) to verify the first automated deployment. Subsequent changes pushed to main trigger it automatically. A missing token stops only deployment; it does not change the live site.
