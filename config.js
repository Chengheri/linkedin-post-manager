// LinkedIn API Configuration
window.config = {
    clientId: '78sx18y82409uh', // Updated client ID

    // IMPORTANT: This must EXACTLY match what's in your LinkedIn Developer Portal
    // Copy and paste the exact redirect URI from your LinkedIn App's settings
    redirectUri: 'https://chengheri.github.io/linkedin-post-manager/',

    scope: 'r_liteprofile', // Simplified to just basic profile access
    apiBaseUrl: 'https://api.linkedin.com/v2',
    state: generateRandomString(16), // Random state for OAuth security
    authEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
    // Privacy policy URL - for LinkedIn app registration
    privacyPolicyUrl: 'https://chengheri.github.io/linkedin-post-manager/privacy-policy.html',
    lastUpdated: Date.now(), // Cache busting timestamp
};

// Debug output
console.log('LinkedIn config loaded with client ID:', window.config.clientId);
console.log('Current URL:', window.location.href);
console.log('Using redirect URI:', window.config.redirectUri);

// Generate a random string for the state parameter
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Store state in session storage for validation
sessionStorage.setItem('linkedin_auth_state', window.config.state);
