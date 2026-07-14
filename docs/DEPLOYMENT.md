# Deployment — Netlify & Vercel

The game is a fully static Next.js export (`output: "export"`), so it
deploys to any static host. There is no server code, no database and no
runtime API calls — after loading once, it works offline.

## Local production run

```bash
npm install
npm run build          # writes the static site to ./out
npx serve out          # or any static file server
```

## Netlify

### Option 1 — drag and drop
1. `npm run build`
2. Go to https://app.netlify.com/drop and drag the `out/` folder in.

### Option 2 — Git-connected
1. Push this repository to GitHub/GitLab.
2. In Netlify: **Add new site → Import an existing project**.
3. Settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `out`
4. Deploy.

## Vercel

1. Push this repository to GitHub/GitLab.
2. In Vercel: **Add New → Project**, import the repo.
3. Vercel auto-detects Next.js — no settings needed (the static export is
   produced automatically by `next build`).
4. Deploy.

CLI alternative:

```bash
npx vercel
```

## Event-day recommendation

For the live event, prefer running **locally** on the presentation machine
(step “Local production run” above) so unreliable venue internet cannot
affect the game. A deployed URL is best used for pre-event review and
rehearsals.
