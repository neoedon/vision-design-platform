# Vision Design Platform

Mage-style design workbench shell for Open Design, slice export, Figma project management, gallery, templates, and uploads.

## Run

```bash
npm install
npm run dev
```

## Feishu Auth Hook

The shell includes a replaceable Feishu auth adapter in `src/auth/feishu.ts`.

Set these when wiring real OAuth:

```bash
VITE_FEISHU_APP_ID=cli_xxx
VITE_FEISHU_REDIRECT_URI=http://localhost:5173
```

Until then, the login dialog uses a local demo account and stores it in `localStorage`.
