/**
 * Cloudflare Worker for Spotify Dashboard
 *
 * Public API that serves your Spotify data to the dashboard.
 * Uses stored refresh token to authenticate with Spotify.
 */

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

// In-memory token cache (per worker instance)
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Handle incoming requests
 */
export default {
    async fetch(request, env) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Public API endpoints
            if (path === '/api/user') {
                return await handleGetUser(env);
            }

            if (path === '/api/playlists') {
                const limit = url.searchParams.get('limit') || '50';
                const offset = url.searchParams.get('offset') || '0';
                return await handleGetPlaylists(env, limit, offset);
            }

            // Health check
            if (path === '/health') {
                return jsonResponse({ status: 'ok' });
            }

            return jsonResponse({ error: 'Not found' }, 404);
        } catch (error) {
            console.error('Worker error:', error);
            return jsonResponse({ error: error.message || 'Internal server error' }, 500);
        }
    }
};

/**
 * Get a valid access token using the stored refresh token
 */
async function getAccessToken(env) {
    const now = Math.floor(Date.now() / 1000);

    // Return cached token if still valid (with 5 min buffer)
    if (cachedToken && tokenExpiry > now + 300) {
        return cachedToken;
    }

    // Refresh the token
    const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);

    const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: env.SPOTIFY_REFRESH_TOKEN
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || 'Failed to refresh token');
    }

    const data = await response.json();

    // Cache the new token (Spotify tokens expire in 1 hour)
    cachedToken = data.access_token;
    tokenExpiry = now + data.expires_in;

    return cachedToken;
}

/**
 * Make an authenticated request to Spotify API
 */
async function spotifyRequest(env, endpoint) {
    const accessToken = await getAccessToken(env);

    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Get user profile
 */
async function handleGetUser(env) {
    const user = await spotifyRequest(env, '/me');
    return jsonResponse(user);
}

/**
 * Get user's playlists
 */
async function handleGetPlaylists(env, limit, offset) {
    const playlists = await spotifyRequest(env, `/me/playlists?limit=${limit}&offset=${offset}`);
    return jsonResponse(playlists);
}

/**
 * Helper to create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        }
    });
}
