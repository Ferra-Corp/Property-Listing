# Client — D&G Realtors

The Next.js app (public site + admin panel + API proxy). See the [project README](../README.md) for the full picture — tech stack, features, environment variables, and how to run both this app and the Server together.

## This app specifically

```bash
npm install
npm run dev         # http://localhost:3000
npm run build        # production build
npm run typecheck
npm run lint
```

Needs `.env.local` at this directory's root (not inside `app/`) with `NEXT_PUBLIC_API_URL` pointing at the Server — see the main README for the full variable list.
