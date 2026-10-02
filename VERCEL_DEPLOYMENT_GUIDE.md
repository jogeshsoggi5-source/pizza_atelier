# Vercel Deployment Guide for Pizza Atelier

## Prerequisites

Before deploying to Vercel, make sure you have:
- A Vercel account (https://vercel.com)
- GitHub repository connected to Vercel
- Supabase project set up (https://supabase.com)

## Deployment Steps

### 1. Set Environment Variables on Vercel

Your project needs the following environment variables configured on Vercel. **Do NOT commit these to Git**.

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

#### Client-Side Variables (Public - Safe to expose)
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DELIVERY_FEE=3
VITE_RESTAURANT_NAME=Pizza Atelier
VITE_RESTAURANT_ADDRESS=214 Artisan Lane, Brooklyn, NY 11201
VITE_RESTAURANT_PHONE=+1 (555) 012-3456
VITE_RESTAURANT_EMAIL=hello@pizzaatelier.com
```

#### Server-Side Variables (Secret - Keep Private!)
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Trigger Deployment

Push your code to the `main` branch to trigger an automatic deployment:

```bash
git push origin main
```

Or use Vercel CLI:

```bash
npm install -g vercel
vercel deploy
```

### 4. Verify Deployment

- Check your Vercel Dashboard for build status
- Look for the deployment URL
- Test the site is working correctly

## Local Development

For local development, create a `.env` file (never commit this):

```bash
cp .env.example .env
# Edit .env and add your Supabase credentials
```

Then run:

```bash
npm run dev
```

## Troubleshooting

### 500 Error on Deployment

**Causes:**
1. Environment variables not set on Vercel
2. Supabase credentials are invalid
3. Build failed (check Vercel build logs)

**Solution:**
1. Verify all environment variables are set correctly in Vercel Settings
2. Check Vercel deployment logs for build errors
3. Test locally with `npm run build && npm run preview`

### Every page shows "This page didn't load" (`jsxDEV is not a function`)

`NODE_ENV` is set somewhere (a Vercel environment variable or `.env`). Delete it —
Vite sets it automatically, and a manual `NODE_ENV=development` makes the production
build use React's dev runtime, which crashes every server-rendered page.

### Supabase not connecting after changing env vars

`VITE_*` variables are baked in at **build time**. After adding or changing them in
Vercel, redeploy (Deployments → ⋯ → Redeploy) — saving them alone is not enough.

### How the build targets Vercel

The app is server-rendered (TanStack Start + Nitro). Nitro detects Vercel during the
build and writes `.vercel/output` (static assets + an SSR function). `vercel.json`
sets `"framework": null` so Vercel uses that output instead of looking for `dist/`.
Locally, `npm run build` targets Cloudflare by default; run `VERCEL=1 npm run build`
to reproduce the Vercel build.

### Build Fails

Check the Vercel build logs for error messages. Common issues:
- TypeScript errors
- Missing dependencies
- Environment variable issues

Fix the errors and push again.

## Security Best Practices

✅ **DO:**
- Set API keys in Vercel environment variables, not in .env file
- Use `.env.example` as a template for local development
- Never commit `.env` file with real credentials
- Use service role key only on the backend, never expose to frontend

❌ **DON'T:**
- Commit `.env` file with real credentials
- Put API keys in public code or comments
- Share your Vercel deployment logs with sensitive data
- Use test keys in production

## Deployment URL

Your deployed site will be available at:
```
https://pizza-atelier-f1xs.vercel.app
```

For a custom domain, configure it in Vercel Settings → Domains.
