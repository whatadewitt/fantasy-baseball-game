# Deploy Rookie Fantasy Ball to Vercel

## Prerequisites
- GitHub repo already connected
- Domain `whatadewitt.com` managed in AWS Route 53
- Vercel free (Hobby) account

## Steps

### 1. Create Vercel Account / Project
- Sign up at vercel.com (GitHub OAuth)
- Import the `mlb-draft` repo
- Vercel auto-detects Next.js — should need minimal config

### 2. Configure Environment Variables in Vercel
Copy these from `.env.local` into Vercel project settings (Settings → Environment Variables):
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `JWT_SECRET`
- `ADMIN_USER_ID`
- `NEXT_PUBLIC_BASE_URL` — update to `https://rfb.whatadewitt.com`

### 3. Add Custom Domain in Vercel
- Vercel project → Settings → Domains
- Add `rfb.whatadewitt.com`
- Vercel will show the required DNS record

### 4. Add CNAME in Route 53
- Go to Route 53 → Hosted zone for `whatadewitt.com`
- Create record:
  - **Name:** `rfb`
  - **Type:** CNAME
  - **Value:** `cname.vercel-dns.com`
  - **TTL:** 300
- Vercel handles SSL automatically once DNS propagates

### 5. Verify
- Visit `https://rfb.whatadewitt.com`
- Test magic link auth (emails already send from `noreply@whatadewitt.com`)
- Confirm the magic link URLs point to the new domain (uses `NEXT_PUBLIC_BASE_URL`)

### 6. Update Resend (if needed)
- Verify that Resend's sending domain config doesn't need changes
- The `from` address (`noreply@whatadewitt.com`) is independent of the app URL

## Decisions to Make
- [x] Subdomain choice: `rfb.whatadewitt.com`
