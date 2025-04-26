// LinkedIn Authentication Module

class LinkedInAuth {
    constructor(config) {
        this.config = config;

        // Check for manual access token
        this.manualAccessToken = localStorage.getItem('linkedin_manual_token');
        this.accessToken = this.manualAccessToken || localStorage.getItem('linkedin_access_token');
        this.tokenExpiry = localStorage.getItem('linkedin_token_expiry');

        // Debug logging
        console.log('LinkedIn Auth initialized with client ID:', this.config.clientId);
        console.log('Redirect URI:', this.config.redirectUri);
        console.log('Using manual token:', !!this.manualAccessToken);

        // Check if we returned from LinkedIn OAuth redirect
        this.handleAuthCallback();
    }

    // Set manual access token
    setManualAccessToken(token, expiryInHours = 24) {
        if (!token) return false;

        const expiresAt = Date.now() + (expiryInHours * 60 * 60 * 1000); // Convert hours to milliseconds

        // Store token information
        localStorage.setItem('linkedin_manual_token', token);
        localStorage.setItem('linkedin_token_expiry', expiresAt);

        // Update instance properties
        this.manualAccessToken = token;
        this.accessToken = token;
        this.tokenExpiry = expiresAt;

        // Refresh UI after setting token
        if (typeof updateLinkedInUI === 'function') {
            updateLinkedInUI();
        }

        return true;
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
        // Check if we should show token input instead
        const useManualToken = confirm("Do you want to use a manual access token instead of OAuth login?");

        if (useManualToken) {
            const token = prompt("Enter your LinkedIn access token:");
            if (token) {
                const success = this.setManualAccessToken(token);
                if (success) {
                    alert("Access token saved successfully!");
                    return;
                }
            }
            return;
        }

        // Continue with regular OAuth flow
        try {
            // Debug logging
            console.log('Starting login with client ID:', this.config.clientId);

            // Build the LinkedIn authorization URL
            const authUrl = new URL(this.config.authEndpoint);

            // Add query parameters
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('client_id', this.config.clientId);
            authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
            authUrl.searchParams.append('state', this.config.state);
            authUrl.searchParams.append('scope', this.config.scope);

            // Debug: log the full authorization URL
            console.log('Auth URL:', authUrl.toString());

            // Redirect to LinkedIn auth page
            window.location.href = authUrl.toString();
        } catch (error) {
            console.error('Error during login process:', error);
            alert('Error starting login process. See console for details.');
        }
    }

    // Handle the redirect from LinkedIn with auth code
    handleAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        const storedState = sessionStorage.getItem('linkedin_auth_state');

        // Debug logging for callback
        if (error) {
            console.error('LinkedIn Auth Error:', error, errorDescription);
        }

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
        localStorage.removeItem('linkedin_manual_token');

        // Clear instance properties
        this.accessToken = null;
        this.tokenExpiry = null;
        this.manualAccessToken = null;

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

// Initialize the auth object after DOM is loaded
let auth;
document.addEventListener('DOMContentLoaded', () => {
    // Debug check to ensure config is loaded
    if (!window.config) {
        console.error('LinkedIn config not found! Make sure config.js is loaded before auth.js');
        alert('LinkedIn configuration error. Check console for details.');
        return;
    }

    // Debug log config
    console.log('Using LinkedIn client ID:', window.config.clientId);

    auth = new LinkedInAuth(window.config);

    // Update UI based on auth state
    if (typeof updateLinkedInUI === 'function') {
        updateLinkedInUI();
    }
});
