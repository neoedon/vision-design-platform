# Vision Design Platform

Mage-style design workbench shell for Open Design, slice export, Figma project management, gallery, templates, and uploads.

## Run

```bash
npm install
npm run dev
```

## Feishu Auth Hook

The shell includes a Feishu OAuth adapter in `src/auth/feishu.ts`.

Set these when wiring real OAuth:

```bash
VITE_FEISHU_APP_ID=cli_xxx
VITE_FEISHU_REDIRECT_URI=http://localhost:5173
VITE_FEISHU_OAUTH_EXCHANGE_URL=http://localhost:8787/api/feishu/oauth/exchange
```

The frontend starts the Feishu authorization-code flow and consumes the `code`
callback. `VITE_FEISHU_OAUTH_EXCHANGE_URL` must point to your own backend because
the code-to-token exchange requires server-side credentials. Do not put the
Feishu app secret in Vite env variables or browser code.

Exchange endpoint contract:

```http
POST /api/feishu/oauth/exchange
Content-Type: application/json

{
  "code": "<feishu authorization code>",
  "redirectUri": "http://localhost:5173",
  "requestedRole": "designer"
}
```

Return either:

```json
{
  "account": {
    "id": "ou_xxx",
    "name": "User Name",
    "email": "user@example.com",
    "role": "designer"
  }
}
```

or a Feishu-style `user` object containing `open_id`/`union_id`, `name`, and
`email`. Until `VITE_FEISHU_APP_ID` is configured, the login dialog uses a local
demo account and stores it in `localStorage`.

## Design Project Snapshot

The design project workbench reads a static snapshot from
`public/data/feishu-base-snapshot.json`.

```bash
FEISHU_DESIGN_PROJECT_WIKI_URL=https://example.feishu.cn/wiki/xxx npm run sync:design-projects
```

Use `FEISHU_DESIGN_PROJECT_WIKI_TOKEN` when you want to pass the wiki token
directly. `FEISHU_DESIGN_PROJECT_PUBLIC_WIKI_URL` is optional; leave it blank to
avoid publishing an internal Feishu URL in the GitHub Pages bundle.
