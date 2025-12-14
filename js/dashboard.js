/**
 * Spotify Playlists Dashboard
 * Fetches and displays playlists from the API
 */

const Dashboard = (function() {
    const API_URL = 'https://spotify-dashboard.johnhenry-pwr.workers.dev';

    // DOM Elements
    let elements = {};

    /**
     * Initialize dashboard
     */
    async function init() {
        cacheElements();
        bindEvents();
        await loadDashboard();
    }

    /**
     * Cache DOM elements
     */
    function cacheElements() {
        elements = {
            dashboardSection: document.getElementById('dashboard-section'),
            errorSection: document.getElementById('error-section'),
            retryBtn: document.getElementById('retry-btn'),
            userAvatar: document.getElementById('user-avatar'),
            userName: document.getElementById('user-name'),
            playlistCount: document.getElementById('playlist-count'),
            playlistsGrid: document.getElementById('playlists-grid'),
            errorMessage: document.getElementById('error-message')
        };
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        elements.retryBtn?.addEventListener('click', loadDashboard);
    }

    /**
     * Show error section
     */
    function showError(message) {
        elements.dashboardSection.style.display = 'none';
        elements.errorMessage.textContent = message;
        elements.errorSection.style.display = 'flex';
    }

    /**
     * Show dashboard section
     */
    function showDashboard() {
        elements.errorSection.style.display = 'none';
        elements.dashboardSection.style.display = 'block';
    }

    /**
     * Fetch data from API
     */
    async function fetchAPI(endpoint) {
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Load dashboard data
     */
    async function loadDashboard() {
        try {
            const [user, playlistsData] = await Promise.all([
                fetchAPI('/api/user'),
                fetchAPI('/api/playlists')
            ]);

            renderUser(user, playlistsData.total);
            renderPlaylists(playlistsData.items);
            showDashboard();
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            showError('Unable to load playlists. Please try again later.');
        }
    }

    /**
     * Render user info
     */
    function renderUser(user, totalPlaylists) {
        const avatarUrl = user.images && user.images.length > 0
            ? user.images[0].url
            : '';

        if (avatarUrl) {
            elements.userAvatar.src = avatarUrl;
            elements.userAvatar.style.display = 'block';
        } else {
            elements.userAvatar.style.display = 'none';
        }

        elements.userName.textContent = user.display_name || user.id;
        elements.playlistCount.textContent = `${totalPlaylists} playlist${totalPlaylists !== 1 ? 's' : ''}`;
    }

    /**
     * Render playlists grid
     */
    function renderPlaylists(playlists) {
        if (!playlists || playlists.length === 0) {
            elements.playlistsGrid.innerHTML = `
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                    </svg>
                    <p>No playlists yet.</p>
                </div>
            `;
            return;
        }

        elements.playlistsGrid.innerHTML = playlists.map(playlist => {
            const imageUrl = playlist.images && playlist.images.length > 0
                ? playlist.images[0].url
                : null;

            const trackCount = playlist.tracks?.total || 0;
            const spotifyUrl = playlist.external_urls?.spotify || '#';

            return `
                <a href="${spotifyUrl}" target="_blank" class="playlist-card">
                    <div class="playlist-image-container">
                        ${imageUrl
                            ? `<img src="${imageUrl}" alt="${escapeHtml(playlist.name)}" class="playlist-image">`
                            : `<div class="playlist-image-placeholder">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 18V5l12-2v13"/>
                                    <circle cx="6" cy="18" r="3"/>
                                    <circle cx="18" cy="16" r="3"/>
                                </svg>
                            </div>`
                        }
                    </div>
                    <div class="playlist-info">
                        <div class="playlist-name">${escapeHtml(playlist.name)}</div>
                        <div class="playlist-tracks">${trackCount} track${trackCount !== 1 ? 's' : ''}</div>
                    </div>
                </a>
            `;
        }).join('');
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { refresh: loadDashboard };
})();
