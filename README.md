# The Builder's Journey — From Teaching to Technology

A static React and TypeScript portfolio for Azad Akin Arslan and the **AWS Student Builder Challenge: Build Your Tech Superpower**. The site runs entirely in the browser and requires no API, database, AWS credentials, or persistent storage.

## Current status

The local portfolio includes:

- responsive desktop and mobile navigation;
- sourced About, skills, Teaching → Cloud → AI journey, and superpower content;
- six development-stage project records with unverified destinations kept non-operable;
- a local command explorer with `help`, `journey`, `skills`, `projects`, and `superpower`;
- a sourced Certifications area with explicit earned, expired, completed, resume-reported, and verification-pending states.

Deployment is verified on AWS Amplify Hosting at [production.de88a9ko9s0fe.amplifyapp.com](https://production.de88a9ko9s0fe.amplifyapp.com/). The dedicated app uses a manually deployed `production` branch with no connected repository, backend, custom domain, or auto-build.

## Prerequisites

Repository metadata pins the supported tool policy:

- Node.js 26 (`.nvmrc`, `package.json`)
- npm 11 (`packageManager: npm@11.19.1`)

Use a Node version manager where available:

```bash
nvm use
npm ci
```

`npm ci` installs the exact dependency graph from `package-lock.json`.

## Local development and preview

```bash
npm run dev
```

The development server binds to localhost in explicit Vite development mode.

Build and inspect the static output:

```bash
npm run build
npm run preview
```

A successful build creates the complete client application in `dist/`. The preview server also binds to localhost. Stop it with `Ctrl+C` when finished.

## Verification commands

The release checks below are local and make no AWS request:

```bash
npm run typecheck
npm run lint
npm test
npm run validate:production
npm run build
npm run test:browser
npm run test:a11y
npm run validate:secrets:source
npm run validate:secrets:dist
npm run validate:deployment-claims
```

Install the pinned Chromium test runtime if Playwright reports that it is absent:

```bash
npm run test:browser:install
```

`test:browser` and `test:a11y` rebuild first, serve `dist/` on the isolated localhost test port, and block external application requests.

After an authorized deployment, verify its real HTTPS endpoint with the same-origin-only browser harness:

```bash
npm run verify:deployment -- https://production.de88a9ko9s0fe.amplifyapp.com/
```

This command intentionally connects to the supplied deployment URL. It blocks requests to every other origin and checks deployed assets, desktop/mobile navigation, the Teaching/Cloud/AI journey, all five commands, certification status/link rendering, horizontal overflow, and automated axe results.

### Latest local results

Verified on 2026-11-01 in this workspace:

| Check | Result |
| --- | --- |
| TypeScript | Passed |
| ESLint | Passed with zero warnings |
| Production configuration/content/source scan | Passed |
| Unit and component tests | 62 passed across 10 files |
| Production build | Passed; one `dist/` directory |
| Browser behavior | 7 passed |
| Automated axe scans | 2 passed with zero reported violations |
| Responsive widths | 320, 375, 640, 767, 768, 1024, 1280, and 1920 CSS pixels passed without horizontal page overflow |
| Public deployment verification | HTTP 200; exact JS/CSS assets loaded; desktop/mobile navigation, Teaching/Cloud/AI, five commands, and certifications passed; zero axe violations and zero external application requests |

Automated accessibility checks do not replace manual review. For every future deployment, manually verify keyboard order and visible focus, screen-reader announcements, contrast, touch targets, reduced motion, orientation changes, and actual 200% browser zoom. Record the browser, operating system, viewport, date, reviewed revision, result, and evidence reference. The current deployment has automated axe and interaction evidence; a separate manual screen-reader and contrast-tool record has not been added.

### Manual accessibility and visual checklist

For each reviewed source revision or manual deployment archive, retain a dated note or screenshot reference for:

- keyboard-only operation in visual order, visible focus, Escape behavior, and the ability to leave every widget;
- command-result announcements with a documented browser and screen-reader pairing while focus remains on the command input;
- normal and large text contrast, plus focus and meaningful interaction-state contrast, measured with a contrast tool;
- visibly distinct default, hover, focus, selected, pending, expired, and disabled states without relying only on color or motion;
- reduced-motion behavior at the operating-system or browser preference;
- 320–1920 CSS-pixel widths, portrait and landscape orientation changes, usable 44-by-44 CSS-pixel touch targets, and no clipped content or horizontal page scrolling;
- actual 200% browser zoom at a 1280 CSS-pixel viewport; and
- editorial hierarchy and safe wrapping for long headings, credential statuses, project descriptions, and verification labels.

Evidence should identify the reviewed revision or archive checksum and must exclude private certificate identifiers, contact details, credentials, and signed upload URLs.

## Content maintenance

Editable public content is centralized under `src/content/`:

- `portfolio.ts`: About, skills, journey, and superpower copy
- `projects.ts`: the sole `readonly ProjectRecord[]`
- `certifications.ts`: the sole sourced certification collection
- `provenance.ts`: owner-approval source metadata helpers

Every factual display value carries an owner-approval source note. Do not add claims, dates, metrics, current-status labels, technologies, achievements, or URLs without owner-approved evidence. `npm run validate:production` blocks invalid required content and prints safe field locations rather than source values.

### Project destinations

A project without an owner-verified destination must retain:

```ts
{
  kind: 'placeholder',
  label: 'Link pending verification'
}
```

To add a destination:

1. Obtain the exact URL from the owner or an owner-approved source.
2. Open it independently and confirm that it identifies the intended project and uses HTTPS.
3. Record a concise source note that contains no secret or personal contact data.
4. Change only that record to the verified link union member.
5. Run production validation, unit tests, browser tests, the built-asset scan, and a manual link check before deploying the update.

### Certification evidence policy

`src/content/certifications.ts` distinguishes issuer documents from resume-only reporting:

- CKA uses issuer evidence and is labeled expired on December 3, 2025.
- Terraform Associate (002) is labeled earned January 25, 2023, with current validity unverified.
- Udacity AWS AI Practitioner Challenge is labeled course completion dated June 23, 2026. It is not presented as the AWS Certified AI Practitioner certification.
- AWS Solutions Architect – Associate, AWS Cloud Practitioner, Azure Fundamentals, LFCA, and LFS200 retain resume-reported or current-verification-pending language where issuer evidence was not supplied.
- AWS Solutions Architect Knowledge Badge Assessment and IBT Advanced DevOps Engineer use their supplied completion documents without asserting unsupported current validity.

Only the owner-supplied CKA Credly and Udacity verification destinations are operable. Raw certificate files, personal contact details, and private credential identifiers are not copied into this repository or rendered by the site.

## Runtime dependencies

| Dependency | Purpose |
| --- | --- |
| `react` | Semantic UI composition and local interaction state |
| `react-dom` | Mounts the React application in the browser |

All linting, testing, accessibility, and build packages are development-only. The browser application includes no router, state-management framework, styling library, AWS SDK, analytics client, or remote-data dependency.

## Environment and security

The application currently requires zero environment variables. Any future `VITE_*` value is public browser data and must never contain a credential or secret. Real `.env` and `*.local` files are ignored; no example file is needed until a reviewed public variable becomes required.

Run both source and built-asset scans before every deployment. If a real credential is ever detected, remove it from all source and generated assets and have its owner rotate it outside this application.

## Amplify Hosting deployment evidence

Deployment Confirmation evidence: AWS Amplify app `de88a9ko9s0fe`, branch `production`, manual deployment job `2`, status `SUCCEED`, completed 2026-11-01. Public URL: [https://production.de88a9ko9s0fe.amplifyapp.com/](https://production.de88a9ko9s0fe.amplifyapp.com/).

| Field | Confirmed value |
| --- | --- |
| Region | `us-east-1` |
| App name | `azad-builders-journey-portfolio` |
| App ID | `de88a9ko9s0fe` |
| Platform | Static Amplify Hosting (`WEB`) |
| Repository connection | None |
| Production branch | `production` |
| Auto-build | Disabled |
| Pull-request previews | Disabled |
| Current manual job | `2` — `SUCCEED` |
| Build output | `dist/` contents uploaded at archive root |
| Deployed archive SHA-256 | `11959f2850558055c604bc38f6b23aed7735a54d1e48c5d66b8e9da62bf07d0b` |
| Deployed assets | `/assets/index-CljEBg8u.js`, `/assets/index-CYdAFT1W.css` |
| Custom domain | None |
| Backend resources | None |

The initial job `1` established and verified the public endpoint. Job `2` published the same reviewed portfolio with the verified-deployment footer. The post-deployment harness confirmed HTTP 200, both deployed assets, desktop and mobile navigation, Teaching/Cloud/AI stage controls, all five commands, ten certification cards, exactly two supported certification links, zero automated axe violations, zero failed same-origin assets, and zero unexpected external application requests.

Future AWS resource creation, branch creation, custom-domain work, IAM changes, or security-setting changes require separate explicit authorization from the responsible operator. A normal content update must first inspect and confirm the existing app ID, branch, region, public URL, and archive before starting the one authorized manual deployment job.

### Updating the manual deployment

The signed upload URL returned by Amplify is temporary. Treat it as sensitive operational data: do not log, commit, or document it.

1. Confirm the intended target is app `de88a9ko9s0fe`, branch `production`, in `us-east-1`.
2. Run `npm ci` after a clean checkout or dependency reset.
3. Run type checking, lint, production validation, tests, browser checks, accessibility checks, and `npm run build`.
4. Run `npm run validate:secrets:dist` and confirm `dist/` contains only reviewed static assets.
5. Zip the **contents** of `dist/` so `index.html` is at the archive root, and record the SHA-256 checksum.
6. Call `aws amplify create-deployment` for this app and branch, upload the archive to its temporary `zipUploadUrl`, then call `aws amplify start-deployment` with the returned job ID.
7. Poll `aws amplify get-job` until the job reports `SUCCEED`. A failed or canceled job is not a completed deployment.
8. Run:

   ```bash
   npm run verify:deployment -- https://production.de88a9ko9s0fe.amplifyapp.com/
   ```

9. Record the job ID, completion time, archive checksum, deployed asset names, and verification result here. Do not modify `RojAI`, `traces-of-sine`, `dengbej-ai`, or any other Amplify app.

### Rollback

Rollback is a new, explicit manual deployment rather than a destructive Git action:

1. Select the last reviewed static archive and verify its recorded SHA-256 checksum. The immediately preceding successful archive in this local evidence set is job `1`; job `2` is the current known-good deployment.
2. Run the local release checks against the source that produced that archive when available.
3. Create a new manual deployment for app `de88a9ko9s0fe`, branch `production`, and upload only the selected known-good static archive.
4. Wait for `SUCCEED`, run the public deployment verifier, and record the new rollback job as the current deployment.
5. If access is denied, stop and report the exact missing Amplify permission. Do not broaden IAM or change account security settings.
