# Spotify Dashboard Project

## Overview
A personal dashboard displaying John's Spotify playlists, hosted at `spotify.johnhpower.com`.

## Architecture

```
┌─────────────────────────┐       ┌────────────────────────────────────┐       ┌─────────────┐
│  Frontend               │       │  Cloudflare Worker (Backend)       │       │ Spotify API │
│  spotify.johnhpower.com │──────▶│  spotify-dashboard.johnhenry-pwr   │──────▶│             │
│  (GitHub Pages)         │       │  .workers.dev                      │       │             │
└─────────────────────────┘       └────────────────────────────────────┘       └─────────────┘
```

### Frontend (GitHub Pages)
- **Repo:** https://github.com/johnhenrypower/spotify-dashboard
- **URL:** https://spotify.johnhpower.com
- **Files:**
  - `index.html` - Main page
  - `css/styles.css` - Dark theme matching main site
  - `js/dashboard.js` - Fetches from Worker API, renders playlists
  - `CNAME` - Points to spotify.johnhpower.com

### Backend (Cloudflare Worker)
- **URL:** https://spotify-dashboard.johnhenry-pwr.workers.dev
- **Files:** `worker/index.js`, `worker/wrangler.toml`
- **Endpoints:**
  - `GET /api/user` - Returns Spotify user profile
  - `GET /api/playlists` - Returns user's playlists
  - `GET /health` - Health check

### Secrets (stored in Cloudflare)
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`

## OAuth / Refresh Token Flow

Spotify access tokens expire after 1 hour. The refresh token (obtained once during initial setup) allows the Worker to get fresh access tokens without user interaction.

**How it works:**
1. Browser requests playlists from Worker
2. Worker checks if cached access token is still valid
3. If expired, Worker uses refresh token to get a new access token from Spotify
4. Worker calls Spotify API with the access token
5. Returns playlists to browser

**To get a new refresh token (if needed):**
1. Visit: `https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://johnhpower.com&scope=playlist-read-private%20playlist-read-collaborative`
2. Authorize and copy the `code` from the redirect URL
3. Exchange for refresh token:
```bash
curl -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d grant_type=authorization_code \
  -d "code=CODE_HERE" \
  -d "redirect_uri=https://johnhpower.com" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```
4. Update the secret: `wrangler secret put SPOTIFY_REFRESH_TOKEN`

## Deployment

### Update Frontend
```bash
cd spotify-dashboard
git add .
git commit -m "Update"
git push
```
GitHub Pages auto-deploys on push.

### Update Worker
```bash
cd spotify-dashboard/worker
wrangler deploy
```

## Design
- Dark theme with purple/pink gradients (matches johnhpower.com)
- Responsive grid layout for playlist cards
- Shows: playlist image, name, track count
- Each card links to Spotify

## Related Projects
- **Strava Dashboard:** `strava.johnhpower.com` - Same architecture pattern
- **Main Site:** `johnhpower.com`
