// LinkedIn API Service

class LinkedInAPI {
    constructor(auth, config) {
        this.auth = auth || null;
        this.config = config || {};
        this.apiBase = config ? config.apiBaseUrl : 'https://api.linkedin.com/v2';

        // Debug log
        console.log('API service initialized with config', this.config);
        console.log('API initialized with auth object:', this.auth ? 'present' : 'missing');
    }

    // Helper method to get API base URL - uses proxy if configured
    getApiUrl() {
        // Check if proxy is enabled in config
        if (this.config && this.config.useProxy && this.config.proxyUrl) {
            console.log('Using proxy server for API requests');
            return this.config.proxyUrl;
        }

        // Fall back to direct API access (likely to fail with CORS)
        console.log('Using direct API access (may face CORS issues)');
        return this.apiBase;
    }

    // Helper method for API requests
    async apiRequest(endpoint, method = 'GET', data = null) {
        // Make sure we have up-to-date auth reference
        if (window.auth) {
            this.auth = window.auth;
            console.log('Updated auth reference from window.auth');
        } else if (localStorage.getItem('linkedin_manual_token')) {
            console.log('Creating auth reference from manual token');
            // Create a minimal auth object
            this.auth = {
                getToken: function() {
                    return localStorage.getItem('linkedin_manual_token');
                }
            };
        }

        const token = this.auth ? this.auth.getToken() : null;
        if (!token) {
            console.error('API Request Error: No authentication token available');
            throw new Error('Not authenticated');
        }

        console.log(`Making ${method} request to ${endpoint} with token:`, token.substring(0, 10) + '...');

        // Get the base URL (either direct or proxy)
        const baseUrl = this.getApiUrl();
        const url = `${baseUrl}${endpoint}`;
        console.log(`Sending request to: ${url}`);

        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            console.log(`Fetching ${url} with options:`, options);
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API response error (${response.status}):`, errorText);
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            const responseData = await response.json();
            console.log('API response success:', responseData);
            return responseData;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Get current user's profile
    async getProfile() {
        try {
            console.log('Fetching user profile');
            return this.apiRequest('/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))');
        } catch (error) {
            console.error('Error fetching profile:', error);
            // For demo, return a simulated profile
            return this.simulateProfileResponse();
        }
    }

    // Simulate profile response for testing
    simulateProfileResponse() {
        console.log('Using simulated profile response');
        return {
            id: 'simulated-user-id',
            firstName: {
                localized: {
                    'en_US': 'Demo'
                }
            },
            lastName: {
                localized: {
                    'en_US': 'User'
                }
            }
        };
    }

    // Get user's recent posts
    async getPosts() {
        try {
            console.log('Attempting to fetch data from LinkedIn');
            const token = this.auth.getToken();

            if (!token) {
                console.error('No authentication token available for LinkedIn API');
                throw new Error('Not authenticated');
            }

            console.log('Using token:', token.substring(0, 10) + '...');

            // Try LinkedIn's V1 API which might work with limited permissions
            try {
                // Try to access basic profile endpoint
                console.log('Trying LinkedIn v1 basic profile endpoint');
                const profileData = await this.apiRequest('/v1/people/~', 'GET');
                console.log('Basic profile data received:', profileData);

                // If we get profile data, try to get connections
                try {
                    console.log('Successfully got profile, trying connections');
                    const connectionsData = await this.apiRequest('/v1/people/~/connections', 'GET');
                    console.log('Connections data received');

                    // Combine profile and connections data
                    const combinedData = {
                        profile: profileData,
                        connections: connectionsData
                    };

                    return this.processDataPortabilityResponse(combinedData, 'v1api');
                } catch (connectionsError) {
                    console.error('Error getting connections:', connectionsError.message);
                    // Just return profile data
                    return this.processDataPortabilityResponse({ profile: profileData }, 'v1api');
                }
            } catch (v1Error) {
                console.error('Error with v1 API:', v1Error.message);

                // Try older people API format
                try {
                    console.log('Trying /people/me endpoint');
                    const peopleData = await this.apiRequest('/people/me', 'GET');
                    console.log('People data received');
                    return this.processDataPortabilityResponse(peopleData, 'people');
                } catch (peopleError) {
                    console.error('Error with people endpoint:', peopleError.message);

                    // As a last attempt, try the most basic profile endpoint
                    try {
                        console.log('Trying /me endpoint');
                        const basicProfileData = await this.apiRequest('/me', 'GET');
                        console.log('Basic me data received');
                        return this.processDataPortabilityResponse(basicProfileData, 'basicProfile');
                    } catch (basicError) {
                        console.error('Error with basic profile endpoint:', basicError.message);
                        console.warn('All LinkedIn endpoints failed, using simulated data. Your access token might not have sufficient permissions.');
                        console.warn('Consider requesting r_liteprofile and w_member_social scopes in the LinkedIn Developer Portal');
                        return this.simulatePostsResponse();
                    }
                }
            }
        } catch (error) {
            console.error('General error fetching data:', error.message);
            console.warn('Using simulated data due to general error');
            return this.simulatePostsResponse();
        }
    }

    // Process data from various API responses
    processDataPortabilityResponse(data, responseType) {
        try {
            console.log(`Processing ${responseType} data from API:`, JSON.stringify(data, null, 2));

            // Each response type has a different structure
            let formattedPosts = [];

            if (responseType === 'v1api') {
                // Format profile data as a post
                if (data.profile) {
                    const profilePost = {
                        id: `linkedin_profile_${Date.now()}`,
                        title: 'Your LinkedIn Profile',
                        content: `First Name: ${data.profile.firstName || 'Not available'}\n` +
                                `Last Name: ${data.profile.lastName || 'Not available'}\n` +
                                `Industry: ${data.profile.industry || 'Not available'}\n` +
                                `Headline: ${data.profile.headline || 'Not available'}\n`,
                        status: 'published',
                        createdAt: new Date().toISOString(),
                        scheduledDate: null,
                        engagement: { likes: 0, comments: 0, shares: 0 }
                    };
                    formattedPosts.push(profilePost);
                }

                // Format connections as posts
                if (data.connections && data.connections._total > 0 && data.connections.values) {
                    const connectionsPost = {
                        id: `linkedin_connections_${Date.now()}`,
                        title: `Your LinkedIn Connections (${data.connections._total})`,
                        content: 'Your connections:\n\n' +
                            data.connections.values.map(c =>
                                `- ${c.firstName || ''} ${c.lastName || ''} (${c.headline || 'No headline'})`
                            ).join('\n'),
                        status: 'published',
                        createdAt: new Date().toISOString(),
                        scheduledDate: null,
                        engagement: { likes: 0, comments: 0, shares: 0 }
                    };
                    formattedPosts.push(connectionsPost);
                }
            } else if (responseType === 'people' || responseType === 'basicProfile') {
                // Format basic profile data
                const profilePost = {
                    id: `linkedin_profile_${Date.now()}`,
                    title: 'Your LinkedIn Profile',
                    content: '',
                    status: 'published',
                    createdAt: new Date().toISOString(),
                    scheduledDate: null,
                    engagement: { likes: 0, comments: 0, shares: 0 }
                };

                // Extract available fields
                if (data.firstName || data.first_name) {
                    profilePost.content += `First Name: ${data.firstName || data.first_name || 'Not available'}\n`;
                }
                if (data.lastName || data.last_name) {
                    profilePost.content += `Last Name: ${data.lastName || data.last_name || 'Not available'}\n`;
                }
                if (data.headline) {
                    profilePost.content += `Headline: ${data.headline}\n`;
                }
                if (data.industry) {
                    profilePost.content += `Industry: ${data.industry}\n`;
                }
                if (data.email || data.emailAddress) {
                    profilePost.content += `Email: ${data.email || data.emailAddress}\n`;
                }

                // If no fields were added, add a generic message
                if (profilePost.content === '') {
                    profilePost.content = 'Basic profile data available.\n\nRaw data:\n' +
                        JSON.stringify(data, null, 2);
                }

                formattedPosts.push(profilePost);
            } else if (responseType === 'snapshot') {
                // Try to find posts in the snapshot data
                if (data.postsCreated && Array.isArray(data.postsCreated)) {
                    formattedPosts = data.postsCreated.map(post => this.formatDataPortabilityPost(post, 'snapshot'));
                } else if (data.posts && Array.isArray(data.posts)) {
                    formattedPosts = data.posts.map(post => this.formatDataPortabilityPost(post, 'snapshot'));
                } else if (data.shares && Array.isArray(data.shares)) {
                    formattedPosts = data.shares.map(post => this.formatDataPortabilityPost(post, 'snapshot'));
                } else if (data.articles && Array.isArray(data.articles)) {
                    formattedPosts = data.articles.map(post => this.formatDataPortabilityPost(post, 'snapshot'));
                }
            } else if (responseType === 'authorizations') {
                // Extract what we can from authorizations data
                if (data.elements && Array.isArray(data.elements)) {
                    formattedPosts = data.elements.map(item => this.formatDataPortabilityPost(item, 'authorizations'));
                }
            } else if (responseType === 'changeLogs') {
                // Extract what we can from change logs
                if (data.elements && Array.isArray(data.elements)) {
                    formattedPosts = data.elements.map(item => this.formatDataPortabilityPost(item, 'changeLogs'));
                }
            } else if (responseType === 'dataExport') {
                // Handle data export response
                if (data.elements && Array.isArray(data.elements)) {
                    formattedPosts = data.elements.map(item => this.formatDataPortabilityPost(item, 'dataExport'));
                } else if (data.archives && Array.isArray(data.archives)) {
                    formattedPosts = data.archives.map(item => this.formatDataPortabilityPost(item, 'dataExport'));
                } else if (data.data && Array.isArray(data.data)) {
                    formattedPosts = data.data.map(item => this.formatDataPortabilityPost(item, 'dataExport'));
                }
            } else if (responseType === 'settings' || responseType === 'audiences') {
                // Create a single post with the settings data
                formattedPosts = [this.formatDataPortabilityPost(data, responseType)];
            }

            console.log(`Formatted ${formattedPosts.length} posts from API data`);

            if (formattedPosts.length === 0) {
                // Try to extract any array in the data as posts
                const extractedArray = this.findArrayInObject(data);
                if (extractedArray && extractedArray.length > 0) {
                    console.log(`Found array with ${extractedArray.length} items in data`);
                    formattedPosts = extractedArray.map(item => this.formatDataPortabilityPost(item, 'generic'));
                }
            }

            if (formattedPosts.length === 0) {
                console.warn('No posts could be extracted from API data, using simulated data');
                return this.simulatePostsResponse();
            }

            return formattedPosts;

        } catch (error) {
            console.error('Error processing API response:', error.message);
            return this.simulatePostsResponse();
        }
    }

    // Find any array in a complex object that might contain post-like data
    findArrayInObject(obj, maxDepth = 3, currentDepth = 0) {
        if (currentDepth > maxDepth) return null;

        if (Array.isArray(obj) && obj.length > 0) {
            // Check if this array contains objects with typical post properties
            if (obj[0] && (
                obj[0].title || obj[0].content || obj[0].text ||
                obj[0].name || obj[0].description || obj[0].id
            )) {
                return obj;
            }
        }

        if (obj !== null && typeof obj === 'object') {
            for (const key in obj) {
                const result = this.findArrayInObject(obj[key], maxDepth, currentDepth + 1);
                if (result) return result;
            }
        }

        return null;
    }

    // Format a post from Data Portability API
    formatDataPortabilityPost(item, dataType) {
        try {
            // Different format based on data type
            let title = 'LinkedIn Content';
            let content = 'Content from LinkedIn';
            let createdAt = new Date().toISOString();
            let id = `linkedin_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            let engagement = { likes: 0, comments: 0, shares: 0 };

            if (dataType === 'snapshot') {
                // Handle snapshot data format
                if (item.title) title = item.title;
                if (item.content) content = item.content;
                if (item.text) content = item.text;
                if (item.commentary) content = item.commentary;
                if (item.description) {
                    content = item.description;
                    if (!title || title === 'LinkedIn Content') title = content.substring(0, 50);
                }

                if (item.createdAt) createdAt = new Date(item.createdAt).toISOString();
                if (item.created) createdAt = new Date(item.created).toISOString();
                if (item.timeCreated) createdAt = new Date(item.timeCreated).toISOString();

                if (item.id) id = `linkedin_${item.id}`;

                if (item.numLikes) engagement.likes = item.numLikes;
                if (item.numComments) engagement.comments = item.numComments;
                if (item.numShares) engagement.shares = item.numShares;
            } else if (dataType === 'authorizations' || dataType === 'changeLogs') {
                // Handle authorizations/logs format - these might not have post content
                if (item.name) title = item.name;
                if (item.type) title = `${item.type} Record`;
                if (item.description) content = item.description;
                if (item.details) content = JSON.stringify(item.details);

                if (item.createdAt) createdAt = new Date(item.createdAt).toISOString();
                if (item.lastModified) createdAt = new Date(item.lastModified).toISOString();
                if (item.timestamp) createdAt = new Date(item.timestamp).toISOString();

                if (item.id) id = `linkedin_${item.id}`;
            } else if (dataType === 'dataExport') {
                // Handle data export format
                if (item.name) title = item.name;
                if (item.description) content = item.description;
                if (item.status) title = `Data Export: ${item.status}`;
                if (item.url) content = `Download URL: ${item.url}\n\n${content}`;
                if (item.size) content += `\nSize: ${item.size}`;
                if (item.requestTime) createdAt = new Date(item.requestTime).toISOString();
                if (item.expirationTime) content += `\nExpires: ${new Date(item.expirationTime).toLocaleString()}`;
                if (item.id) id = `linkedin_export_${item.id}`;
            } else if (dataType === 'settings') {
                // Handle settings format
                title = 'LinkedIn Settings';
                content = 'Your LinkedIn profile settings and preferences:';

                // Format the settings object into readable content
                Object.entries(item).forEach(([key, value]) => {
                    if (key !== 'id' && key !== 'timestamp') {
                        content += `\n\n${key}: ${JSON.stringify(value, null, 2)}`;
                    }
                });

                if (item.id) id = `linkedin_settings_${item.id}`;
                if (item.timestamp) createdAt = new Date(item.timestamp).toISOString();
            } else if (dataType === 'audiences') {
                // Handle audiences format
                title = 'LinkedIn Audience Data';
                content = 'Information about your LinkedIn audience segments:';

                // Format the audience object into readable content
                Object.entries(item).forEach(([key, value]) => {
                    if (key !== 'id' && key !== 'timestamp') {
                        content += `\n\n${key}: ${JSON.stringify(value, null, 2)}`;
                    }
                });

                if (item.id) id = `linkedin_audience_${item.id}`;
                if (item.lastModified) createdAt = new Date(item.lastModified).toISOString();
            } else if (dataType === 'generic') {
                // Handle generic data format - try to extract anything useful
                if (item.title || item.name) title = item.title || item.name;
                if (item.content || item.description || item.text) {
                    content = item.content || item.description || item.text;
                } else {
                    // Format the entire object into readable content
                    content = JSON.stringify(item, null, 2);
                }

                // Try to find date fields
                const dateFields = ['createdAt', 'created', 'timestamp', 'date', 'lastModified'];
                for (const field of dateFields) {
                    if (item[field]) {
                        try {
                            createdAt = new Date(item[field]).toISOString();
                            break;
                        } catch (e) {
                            // Not a valid date, continue checking
                        }
                    }
                }

                if (item.id) id = `linkedin_data_${item.id}`;
            }

            // Ensure title is not too long
            if (title.length > 100) title = title.substring(0, 97) + '...';

            return {
                id: id,
                title: title,
                content: content,
                status: 'published',
                createdAt: createdAt,
                scheduledDate: null,
                engagement: engagement
            };
        } catch (error) {
            console.error('Error formatting individual post:', error.message);
            return {
                id: `linkedin_error_${Date.now()}`,
                title: 'Error Processing Item',
                content: 'There was an error processing this item from LinkedIn.',
                status: 'published',
                createdAt: new Date().toISOString(),
                scheduledDate: null,
                engagement: { likes: 0, comments: 0, shares: 0 }
            };
        }
    }

    // Get scheduled posts
    async getScheduledPosts() {
        try {
            console.log('Attempting to fetch scheduled posts');
            // First try real API call
            //const scheduledPosts = await this.apiRequest('/ugcPosts?q=authors&authors=List(urn%3Ali%3Aperson%3A<id>)&status=SCHEDULED');
            //return scheduledPosts;

            // If that fails or for demo, throw to use simulation
            throw new Error('Using simulated scheduled posts for demo');
        } catch (error) {
            console.log('Using simulated scheduled posts response due to:', error.message);
            // In a real implementation, this would use LinkedIn's UGC API with filters
            // For demo purposes, we'll simulate the response
            return this.simulateScheduledPostsResponse();
        }
    }

    // Create a new post
    async createPost(postData) {
        try {
            console.log('Attempting to create post:', postData);
            // First try real API call
            //const createdPost = await this.apiRequest('/ugcPosts', 'POST', postData);
            //return createdPost;

            // If that fails or for demo, throw to use simulation
            throw new Error('Using simulated create post for demo');
        } catch (error) {
            console.log('Using simulated create post response due to:', error.message);
            // In a real implementation, this would send to LinkedIn's UGC API
            // For demo purposes, we'll simulate the response
            return this.simulateCreatePostResponse(postData);
        }
    }

    // Update an existing post
    async updatePost(postId, postData) {
        try {
            console.log('Attempting to update post:', postId);
            // First try real API call
            //const updatedPost = await this.apiRequest(`/ugcPosts/${postId}`, 'PUT', postData);
            //return updatedPost;

            // If that fails or for demo, throw to use simulation
            throw new Error('Using simulated update post for demo');
        } catch (error) {
            console.log('Using simulated update post response due to:', error.message);
            // In a real implementation, this would update via LinkedIn's UGC API
            // For demo purposes, we'll simulate the response
            return this.simulateUpdatePostResponse(postId, postData);
        }
    }

    // Delete a post
    async deletePost(postId) {
        try {
            console.log('Attempting to delete post:', postId);
            // First try real API call
            //await this.apiRequest(`/ugcPosts/${postId}`, 'DELETE');
            //return { success: true, id: postId };

            // If that fails or for demo, throw to use simulation
            throw new Error('Using simulated delete post for demo');
        } catch (error) {
            console.log('Using simulated delete post response due to:', error.message);
            // In a real implementation, this would delete via LinkedIn's UGC API
            // For demo purposes, we'll simulate the response
            return this.simulateDeletePostResponse(postId);
        }
    }

    // SIMULATION METHODS FOR DEMO PURPOSES
    // These would be replaced with actual API calls in a production app

    simulatePostsResponse() {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            console.log('Generating simulated posts');
            setTimeout(() => {
                // Generate some sample posts with random engagement
                const samplePosts = [];
                const statuses = ['published', 'draft'];
                const now = new Date();

                for (let i = 1; i <= 5; i++) {
                    const createDate = new Date(now);
                    createDate.setDate(now.getDate() - i);

                    samplePosts.push({
                        id: `linkedin_${Date.now()}_${i}`,
                        title: `LinkedIn API Post ${i}`,
                        content: `This is content for post ${i} imported from LinkedIn API.`,
                        status: statuses[Math.floor(Math.random() * statuses.length)],
                        createdAt: createDate.toISOString(),
                        scheduledDate: null,
                        engagement: {
                            likes: Math.floor(Math.random() * 100),
                            comments: Math.floor(Math.random() * 30),
                            shares: Math.floor(Math.random() * 15)
                        }
                    });
                }

                console.log('Generated simulated posts:', samplePosts.length);
                resolve(samplePosts);
            }, 800); // Simulate network delay
        });
    }

    simulateScheduledPostsResponse() {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            console.log('Generating simulated scheduled posts');
            setTimeout(() => {
                // Generate some sample scheduled posts
                const samplePosts = [];
                const now = new Date();

                for (let i = 1; i <= 3; i++) {
                    const scheduleDate = new Date(now);
                    scheduleDate.setDate(now.getDate() + i);
                    scheduleDate.setHours(9 + i, 0, 0, 0);

                    samplePosts.push({
                        id: `linkedin_scheduled_${Date.now()}_${i}`,
                        title: `Scheduled LinkedIn Post ${i}`,
                        content: `This is content for scheduled post ${i} imported from LinkedIn API.`,
                        status: 'scheduled',
                        createdAt: new Date().toISOString(),
                        scheduledDate: scheduleDate.toISOString(),
                        engagement: {
                            likes: 0,
                            comments: 0,
                            shares: 0
                        }
                    });
                }

                console.log('Generated simulated scheduled posts:', samplePosts.length);
                resolve(samplePosts);
            }, 800); // Simulate network delay
        });
    }

    simulateCreatePostResponse(postData) {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            console.log('Simulating post creation');
            setTimeout(() => {
                // Add an ID and creation date to the post data
                const response = {
                    ...postData,
                    id: `linkedin_${Date.now()}`,
                    createdAt: new Date().toISOString()
                };

                console.log('Simulated post creation response:', response);
                resolve(response);
            }, 800); // Simulate network delay
        });
    }

    simulateUpdatePostResponse(postId, postData) {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            console.log('Simulating post update for:', postId);
            setTimeout(() => {
                // Return the updated post data
                const response = {
                    ...postData,
                    id: postId,
                    updatedAt: new Date().toISOString()
                };

                console.log('Simulated post update response:', response);
                resolve(response);
            }, 800); // Simulate network delay
        });
    }

    simulateDeletePostResponse(postId) {
        // Simulate a delayed API response
        return new Promise((resolve) => {
            console.log('Simulating post deletion for:', postId);
            setTimeout(() => {
                console.log('Simulated successful deletion');
                resolve({ success: true, id: postId });
            }, 800); // Simulate network delay
        });
    }
}

// Make sure the API is initialized when auth changes
function initializeAPI() {
    console.log('Attempting to initialize API service');

    // DEBUG: Add more info about current state
    console.log('Current state check:');
    console.log('- window.auth exists:', !!window.auth);
    console.log('- window.config exists:', !!window.config);
    console.log('- manual token exists:', !!localStorage.getItem('linkedin_manual_token'));
    console.log('- access token exists:', !!localStorage.getItem('linkedin_access_token'));

    try {
        // Even if window.auth doesn't exist, create a minimal version that will be updated later
        if (!window.auth && localStorage.getItem('linkedin_manual_token')) {
            console.log('Creating temporary auth object from manual token');
            // Create a minimal mock auth object
            window.auth = {
                getToken: function() {
                    return localStorage.getItem('linkedin_manual_token');
                },
                isAuthenticated: function() {
                    return !!localStorage.getItem('linkedin_manual_token');
                }
            };
        }

        if (!window.config) {
            console.error('Config not available, cannot initialize API');
            console.log('Attempting to create minimal config');
            window.config = {
                apiBaseUrl: 'https://api.linkedin.com/v2'
            };
        }

        console.log('Creating new LinkedInAPI instance');
        window.api = new LinkedInAPI(window.auth || {}, window.config);
        console.log('API service initialized and assigned to window.api');
        return true;
    } catch (error) {
        console.error('Error initializing API:', error.message);
        console.error('Full error:', error);
        return false;
    }
}

// Initialize the API service whenever the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, trying to initialize API');

    // First attempt at initialization
    if (initializeAPI()) {
        console.log('API initialized on page load');
        return;
    }

    // If not successful, wait for auth to be available
    console.log('Waiting for auth to be available');
    const authCheckInterval = setInterval(() => {
        if (window.auth) {
            console.log('Auth detected, initializing API service');
            if (initializeAPI()) {
                console.log('API service connected');
                clearInterval(authCheckInterval);
            }
        }
    }, 100);
});

// Add a global function to manually reinitialize API
window.reinitializeAPI = function() {
    console.log('Manual API reinitialization requested');
    return initializeAPI();
};
