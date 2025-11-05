# Salesforce Connected App Setup Guide

This guide provides detailed instructions for setting up a Salesforce Connected App to enable OAuth 2.0 authentication for the MCP Server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a Connected App](#creating-a-connected-app)
3. [Configuring OAuth Settings](#configuring-oauth-settings)
4. [Obtaining Credentials](#obtaining-credentials)
5. [Security Token](#security-token)
6. [Testing the Configuration](#testing-the-configuration)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Salesforce account with System Administrator or appropriate permissions
- Access to Salesforce Setup
- Understanding of OAuth 2.0 concepts (helpful but not required)

## Creating a Connected App

### Step 1: Navigate to App Manager

1. Log in to your Salesforce org
2. Click the **Setup** gear icon (⚙️) in the top-right corner
3. In the Quick Find box, type "App Manager"
4. Click **App Manager** under Apps

### Step 2: Create New Connected App

1. Click the **New Connected App** button
2. Fill in the basic information:
   - **Connected App Name**: `MCP Server Integration` (or your preferred name)
   - **API Name**: Auto-filled based on Connected App Name
   - **Contact Email**: Your email address

### Step 3: Enable OAuth Settings

1. Check **Enable OAuth Settings**
2. **Callback URL**: 
   - For development: `http://localhost:3000/oauth/callback`
   - For production: Use your actual callback URL
   - Note: For username-password flow, the callback URL won't be used but is still required
3. **Selected OAuth Scopes**: Add the following scopes:
   - `Access and manage your data (api)`
   - `Perform requests on your behalf at any time (refresh_token, offline_access)`
   - `Full access (full)` (optional, for broader access)

### Step 4: Additional Settings

1. **Require Secret for Web Server Flow**: Check this box
2. **Require Secret for Refresh Token Flow**: Check this box (recommended)
3. **Enable Client Credentials Flow**: Leave unchecked (not needed for username-password flow)
4. Click **Save**

### Step 5: Wait for Propagation

After saving, Salesforce will display a message that it may take 2-10 minutes for changes to take effect. Wait for this period before testing.

## Configuring OAuth Settings

### Managing Policies

1. After creating the Connected App, click **Manage** on the Connected App detail page
2. Click **Edit Policies**
3. Configure the following:

   **Permitted Users**:
   - Select "Admin approved users are pre-authorized"
   - This allows you to control which users can use the Connected App

   **IP Relaxation**:
   - Select "Relax IP restrictions" if you're accessing from various locations
   - Or configure specific IP ranges for enhanced security

   **Refresh Token Policy**:
   - Select "Refresh token is valid until revoked"

4. Click **Save**

### Managing Profiles or Permission Sets

If you selected "Admin approved users are pre-authorized":

1. Go back to the Connected App management page
2. Click **Manage Profiles** or **Manage Permission Sets**
3. Add the profiles/permission sets for users who should access this app
4. Click **Save**

## Obtaining Credentials

### Client ID and Client Secret

1. From the Connected App detail page, click **View** under the API (Enable OAuth Settings) section
2. You'll see:
   - **Consumer Key**: This is your `SF_CLIENT_ID`
   - **Consumer Secret**: Click to reveal - this is your `SF_CLIENT_SECRET`

3. Copy these values to your `.env` file:
   ```env
   SF_CLIENT_ID=3MVG9...your-consumer-key...
   SF_CLIENT_SECRET=1234567890...your-consumer-secret...
   ```

### Important Security Notes

- **Never share or commit** the Client Secret to version control
- Store credentials securely (use environment variables or secret management tools)
- Rotate credentials periodically
- Use different Connected Apps for different environments (dev, staging, prod)

## Security Token

The security token is an additional security mechanism required for API authentication from unknown locations.

### Resetting Your Security Token

1. Click your profile picture or name in Salesforce
2. Select **Settings**
3. In the Quick Find box, type "Reset"
4. Click **Reset My Security Token** under "My Personal Information"
5. Click **Reset Security Token**
6. Check your email for the new security token

### Using the Security Token

When authenticating, the password must be followed immediately by the security token (no space):

```env
SF_PASSWORD=mypassword
SF_SECURITY_TOKEN=abcd1234efgh5678ijkl
```

The server automatically concatenates these: `mypassword` + `abcd1234efgh5678ijkl`

### When Security Token is Not Required

Security tokens may not be required if:
- Your IP address is in the organization's trusted IP range
- You're using IP whitelisting in the Connected App
- Your user profile has relaxed IP restrictions

However, it's recommended to always use a security token for API integrations.

## Testing the Configuration

### Test Using the MCP Server

1. Ensure all environment variables are set in `.env`:
   ```env
   SF_LOGIN_URL=https://login.salesforce.com
   SF_USERNAME=your-username@example.com
   SF_PASSWORD=your-password
   SF_SECURITY_TOKEN=your-security-token
   SF_CLIENT_ID=your-consumer-key
   SF_CLIENT_SECRET=your-consumer-secret
   ```

2. Build and start the server:
   ```bash
   npm run build
   npm start
   ```

3. Check the console output for:
   - "Successfully connected to Salesforce" - Authentication succeeded
   - "Salesforce MCP Server running on stdio" - Server is ready

### Test Using cURL (Alternative)

You can test the OAuth flow directly:

```bash
curl -X POST https://login.salesforce.com/services/oauth2/token \
  -d "grant_type=password" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=YOUR_USERNAME" \
  -d "password=YOUR_PASSWORD_AND_TOKEN"
```

Replace `login.salesforce.com` with `test.salesforce.com` for sandbox orgs.

A successful response looks like:
```json
{
  "access_token": "00D...",
  "instance_url": "https://yourinstance.salesforce.com",
  "id": "https://login.salesforce.com/id/00D.../005...",
  "token_type": "Bearer",
  "issued_at": "1234567890",
  "signature": "..."
}
```

## Troubleshooting

### Error: "invalid_client_id"

**Problem**: Client ID is incorrect or Connected App not found

**Solutions**:
- Verify the Consumer Key (Client ID) is copied correctly
- Ensure the Connected App is saved and propagated (wait 2-10 minutes)
- Check that you're using the correct Salesforce org

### Error: "invalid_client"

**Problem**: Client Secret is incorrect

**Solutions**:
- Verify the Consumer Secret is copied correctly (click to reveal in Salesforce)
- Ensure there are no extra spaces or characters
- Try regenerating the Consumer Secret (requires updating your `.env`)

### Error: "invalid_grant"

**Problem**: Username, password, or security token is incorrect

**Solutions**:
- Verify username is correct (including @domain)
- Check password is correct
- Confirm security token is current (reset if unsure)
- Ensure password and token are concatenated: `password` + `token`
- Verify you're using the correct login URL (login vs test.salesforce.com)

### Error: "user hasn't approved this consumer"

**Problem**: User not authorized to use the Connected App

**Solutions**:
- Ensure "Admin approved users are pre-authorized" is selected
- Add user's profile or permission set to the Connected App
- Or change Permitted Users to "All users may self-authorize"

### Error: "API is disabled for this org"

**Problem**: API access is not enabled

**Solutions**:
- Verify your Salesforce edition includes API access
- Check user profile has "API Enabled" permission
- Contact Salesforce support if needed

### Connected App Not Appearing

**Problem**: Can't find the Connected App after creation

**Solutions**:
- Wait 2-10 minutes for propagation
- Refresh the App Manager page
- Check you're in the correct Salesforce org
- Verify you have proper permissions to view Connected Apps

### IP Restrictions Blocking Access

**Problem**: Authentication fails due to IP restrictions

**Solutions**:
- Add your IP address to the org's trusted IP ranges (Setup > Network Access)
- Configure IP relaxation in the Connected App policies
- Use a VPN if required by your organization
- Whitelist IP ranges in the Connected App settings

## Best Practices

### Security

1. **Use Different Apps for Different Environments**:
   - Create separate Connected Apps for Dev, Test, and Production
   - Use environment-specific credentials

2. **Restrict Access**:
   - Use "Admin approved users are pre-authorized"
   - Only add necessary profiles/permission sets
   - Implement IP whitelisting when possible

3. **Monitor Usage**:
   - Regularly review OAuth tokens in Setup > Identity > OAuth and OpenID Connect
   - Monitor API usage in Setup > System Overview
   - Set up event monitoring for security audit

4. **Credential Management**:
   - Never commit credentials to version control
   - Use secret management services (AWS Secrets Manager, Azure Key Vault, etc.)
   - Rotate credentials periodically
   - Use different credentials for each environment

### Maintenance

1. **Regular Reviews**:
   - Review Connected App settings quarterly
   - Update OAuth scopes as needed
   - Remove unused or deprecated Connected Apps

2. **Documentation**:
   - Document your Connected App configurations
   - Keep track of which apps are used for what purpose
   - Maintain a change log for configuration updates

3. **Testing**:
   - Test authentication after any Salesforce release
   - Verify Connected App still works after security token resets
   - Have a rollback plan for credential rotation

## Additional Resources

- [Salesforce Connected Apps Documentation](https://help.salesforce.com/s/articleView?id=sf.connected_app_overview.htm)
- [OAuth 2.0 Username-Password Flow](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_username_password_flow.htm)
- [Salesforce API Security Best Practices](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_security.htm)
- [Managing API Usage](https://help.salesforce.com/s/articleView?id=sf.integrate_api_rate_limiting.htm)

## Support

For issues specific to Salesforce configuration:
- Contact Salesforce support
- Post in [Salesforce Developer Forums](https://developer.salesforce.com/forums)
- Check [Salesforce Trust Status](https://status.salesforce.com/)

For MCP Server issues:
- See the main [README.md](README.md) troubleshooting section
- Check server logs for detailed error messages
- Verify all environment variables are set correctly
