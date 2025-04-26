# LinkedIn Post Analyser

A web-based application for managing your LinkedIn posts with analytics, scheduling, and direct LinkedIn API integration.

## Features

- **Connect to LinkedIn**: Import posts directly from your LinkedIn account
- **Dashboard Analytics**: View engagement statistics and recent post activity
- **Post Management**: Create, edit, and delete posts
- **Scheduling**: Schedule posts for future publication
- **Engagement Tracking**: Monitor likes, comments, and shares on your posts
- **Local Storage**: All data is stored in your browser, ensuring privacy
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Getting Started

1. **Open the app**: Simply open the `index.html` file in your web browser
2. **Connect your LinkedIn account**:
   - Click on the "Account" tab in the navigation
   - Click "Connect LinkedIn Account"
   - Authorize the application to access your LinkedIn data
3. **Sync your posts**:
   - After connecting, click "Sync Posts from LinkedIn" to import your existing posts
4. **Start managing your content**:
   - View analytics on the Dashboard
   - Create new posts in the Create Post section
   - Manage existing posts in the My Posts section
   - View upcoming posts in the Scheduled section

## API Integration Setup

To make the LinkedIn API integration work with your LinkedIn account:

1. Create a LinkedIn Developer account at [https://developer.linkedin.com/](https://developer.linkedin.com/)
2. Create a new application in the LinkedIn Developer portal
3. Configure the OAuth 2.0 settings:
   - Add your app's URL to the Authorized Redirect URLs
   - Request the necessary permissions: `r_emailaddress`, `r_liteprofile`, and `w_member_social`
4. Get your Client ID from the application settings
5. Update the `config.js` file with your Client ID:
   ```javascript
   clientId: 'YOUR_LINKEDIN_CLIENT_ID', // Replace with your actual Client ID
   ```

## Notes for Development & Production

- **Demo Mode**: The current implementation simulates LinkedIn API responses for demo purposes
- **Production Setup**: For a production environment, you'll need:
  - A server-side component to securely handle the OAuth flow
  - Proper API endpoint implementation for the LinkedIn API
  - Secure storage of your application's client secret

## Privacy & Security

- All post data is stored locally in your browser's localStorage
- Authentication tokens are stored securely and never shared
- No data is sent to any servers beyond the official LinkedIn API

## License

This project is open source and available under the MIT License.
