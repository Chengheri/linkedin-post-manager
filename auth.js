// LinkedIn Authentication Module

class LinkedInAuth {
    constructor(config) {
        this.config = config;
        this.accessToken = localStorage.getItem('linkedin_access_token');
        this.tokenExpiry = localStorage.getItem('linkedin_token_expiry');

        // Check if we returned from LinkedIn OAuth redirect
        this.handleAuthCallback();
    }

    // Check if user is authenticated
    isAuthenticated() {
        if (!this.accessToken) return false;

        // Check if token is expired
        const expiryTime = parseInt(this.tokenExpiry, 10);
        if (expiryTime && Date.now() > expiryTime) {
            this.logout(); // Token expired, logout
            return false;
        }

        return true;
    }

    // Initialize login process
    login() {
        // Build the LinkedIn authorization URL
        const authUrl = new URL(this.config.authEndpoint);

        // Add query parameters
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', this.config.clientId);
        authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
        authUrl.searchParams.append('state', this.config.state);
        authUrl.searchParams.append('scope', this.config.scope);

        // Redirect to LinkedIn auth page
        window.location.href = authUrl.toString();
    }

    // Handle the redirect from LinkedIn with auth code
    handleAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const storedState = sessionStorage.getItem('linkedin_auth_state');

        // Clear the URL parameters after extracting needed data
        if (code || error) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Check for errors or if code is not present
        if (error || !code) return;

        // Validate state to prevent CSRF attacks
        if (state !== storedState) {
            console.error('OAuth state mismatch');
            return;
        }

        // Exchange authorization code for access token
        this.getAccessToken(code);
    }

    // Exchange authorization code for access token
    async getAccessToken(code) {
        try {
            // In a real app, this would be a server call to protect your client secret
            // For demo purposes, we're simulating token acquisition
            // WARNING: In a production app, NEVER expose your client secret on the client side!

            // Simulating token acquisition for demo
            // In production: This should be a server-side call
            const tokenEndpoint = this.config.tokenEndpoint;

            // Normally this would be a fetch to your backend, which would securely exchange the code for a token
            // Simulate a successful token response
            const mockResponse = {
                access_token: 'simulated_access_token_' + Date.now(),
                expires_in: 3600 // 1 hour
            };

            this.setSession(mockResponse);

            // Refresh the UI after login
            if (typeof updateLinkedInUI === 'function') {
                updateLinkedInUI();
            }

        } catch (error) {
            console.error('Error exchanging code for token:', error);
        }
    }

    // Store the session data
    setSession(authResult) {
        const expiresAt = Date.now() + (authResult.expires_in * 1000);

        // Store token information
        localStorage.setItem('linkedin_access_token', authResult.access_token);
        localStorage.setItem('linkedin_token_expiry', expiresAt);

        // Update instance properties
        this.accessToken = authResult.access_token;
        this.tokenExpiry = expiresAt;
    }

    // Log out user
    logout() {
        // Remove tokens from storage
        localStorage.removeItem('linkedin_access_token');
        localStorage.removeItem('linkedin_token_expiry');

        // Clear instance properties
        this.accessToken = null;
        this.tokenExpiry = null;

        // Refresh UI after logout
        if (typeof updateLinkedInUI === 'function') {
            updateLinkedInUI();
        }
    }

    // Get the access token for API calls
    getToken() {
        return this.isAuthenticated() ? this.accessToken : null;
    }
}

// Initialize the auth object after loading config
let auth;
document.addEventListener('DOMContentLoaded', () => {
    auth = new LinkedInAuth(config);

    // Update UI based on auth state
    if (typeof updateLinkedInUI === 'function') {
        updateLinkedInUI();
    }
});
