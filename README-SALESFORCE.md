# Salesforce MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with Salesforce Customer data. This server enables AI models and applications to interact with Salesforce Account (Customer) data, including related Contacts, Opportunities, and Cases.

## Overview

This MCP server exposes Salesforce Customer data through a standardized protocol, allowing AI assistants and applications to:
- Query and list customer records with flexible filtering
- Retrieve detailed customer information
- Search customers using Salesforce's powerful full-text search
- Create and update customer records
- Access related data like contacts, opportunities, and support cases

## Prerequisites

Before setting up this server, you need:

1. **Node.js and npm**: Version 18 or higher
2. **Salesforce Account**: A Salesforce org (Production, Sandbox, or Developer Edition)
3. **Salesforce Connected App**: For OAuth 2.0 authentication
4. **Salesforce Credentials**:
   - Username
   - Password
   - Security Token
   - Connected App Client ID and Secret

### Salesforce Connected App Setup

You need to create a Connected App in Salesforce to enable OAuth 2.0 authentication. See [SETUP.md](SETUP.md) for detailed instructions.

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd salesforce-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` with your Salesforce credentials**:
   ```env
   SF_LOGIN_URL=https://login.salesforce.com
   SF_USERNAME=your-username@example.com
   SF_PASSWORD=your-password
   SF_SECURITY_TOKEN=your-security-token
   SF_CLIENT_ID=your-connected-app-client-id
   SF_CLIENT_SECRET=your-connected-app-client-secret
   ```

   **Important Notes**:
   - For sandbox orgs, use `https://test.salesforce.com` as the login URL
   - The security token is sent to your email when you reset your password
   - Get Client ID and Secret from your Connected App in Salesforce Setup

5. **Build the server**:
   ```bash
   npm run build
   ```

## Usage

### Starting the Server

```bash
npm start
```

The server runs on standard input/output (stdio) and communicates using the MCP protocol.

### Development Mode

For development with auto-rebuild on file changes:

```bash
npm run dev
```

## Available Tools

### 1. list_customers

List and query Customer (Account) records with optional filtering and pagination.

**Parameters**:
- `filters` (string, optional): SOQL WHERE clause conditions
- `limit` (number, optional): Maximum records to return (default: 100)
- `offset` (number, optional): Number of records to skip (default: 0)

**Example**:
```json
{
  "filters": "Industry = 'Technology' AND AnnualRevenue > 1000000",
  "limit": 50,
  "offset": 0
}
```

### 2. get_customer

Get detailed information about a specific customer by ID.

**Parameters**:
- `customerId` (string, required): Salesforce Account ID

**Example**:
```json
{
  "customerId": "001XXXXXXXXXXXX"
}
```

### 3. search_customers

Search customers using Salesforce Object Search Language (SOSL) for full-text search.

**Parameters**:
- `searchTerm` (string, required): Search term or phrase
- `limit` (number, optional): Maximum results (default: 50)

**Example**:
```json
{
  "searchTerm": "Acme Corporation",
  "limit": 25
}
```

### 4. create_customer

Create a new Customer (Account) record.

**Parameters**:
- `name` (string, required): Customer name
- `phone` (string, optional): Phone number
- `website` (string, optional): Website URL
- `industry` (string, optional): Industry category
- `annualRevenue` (number, optional): Annual revenue
- `numberOfEmployees` (number, optional): Number of employees
- `billingStreet` (string, optional): Billing street address
- `billingCity` (string, optional): Billing city
- `billingState` (string, optional): Billing state/province
- `billingPostalCode` (string, optional): Billing postal code
- `billingCountry` (string, optional): Billing country
- `description` (string, optional): Account description

**Example**:
```json
{
  "name": "Acme Corporation",
  "phone": "+1-555-0100",
  "website": "https://acme.example.com",
  "industry": "Technology",
  "annualRevenue": 5000000,
  "billingCity": "San Francisco",
  "billingState": "CA",
  "billingCountry": "USA"
}
```

### 5. update_customer

Update an existing Customer (Account) record.

**Parameters**:
- `customerId` (string, required): Salesforce Account ID
- All other parameters from `create_customer` (all optional)

**Example**:
```json
{
  "customerId": "001XXXXXXXXXXXX",
  "phone": "+1-555-0199",
  "annualRevenue": 6000000
}
```

### 6. get_customer_contacts

Retrieve all Contact records associated with a customer.

**Parameters**:
- `customerId` (string, required): Salesforce Account ID
- `limit` (number, optional): Maximum contacts to return (default: 100)

**Example**:
```json
{
  "customerId": "001XXXXXXXXXXXX",
  "limit": 50
}
```

### 7. get_customer_opportunities

Retrieve all Opportunity records for a customer.

**Parameters**:
- `customerId` (string, required): Salesforce Account ID
- `limit` (number, optional): Maximum opportunities to return (default: 100)

**Example**:
```json
{
  "customerId": "001XXXXXXXXXXXX",
  "limit": 50
}
```

### 8. get_customer_cases

Retrieve all Case (support) records for a customer.

**Parameters**:
- `customerId` (string, required): Salesforce Account ID
- `limit` (number, optional): Maximum cases to return (default: 100)

**Example**:
```json
{
  "customerId": "001XXXXXXXXXXXX",
  "limit": 50
}
```

## Configuration

### Environment Variables

All configuration is done through environment variables. Required variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `SF_LOGIN_URL` | Salesforce login URL | `https://login.salesforce.com` |
| `SF_USERNAME` | Salesforce username | `user@example.com` |
| `SF_PASSWORD` | Salesforce password | `mypassword` |
| `SF_SECURITY_TOKEN` | Salesforce security token | `abcd1234efgh5678` |
| `SF_CLIENT_ID` | Connected App Client ID | `3MVG9...` |
| `SF_CLIENT_SECRET` | Connected App Client Secret | `1234567890...` |

### Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment-specific configurations** for development, staging, and production
3. **Rotate security tokens** regularly
4. **Restrict Connected App permissions** to minimum required access
5. **Monitor API usage** in Salesforce Setup

## Troubleshooting

### Authentication Errors

**Error**: "Salesforce authentication failed"

**Solutions**:
- Verify username and password are correct
- Ensure security token is up-to-date (check your email for token reset)
- Confirm the login URL matches your org type (login.salesforce.com vs test.salesforce.com)
- Check that the Connected App Client ID and Secret are correct

### Connection Timeout

**Error**: "Connection timeout" or "ECONNREFUSED"

**Solutions**:
- Check your network connection
- Verify Salesforce is accessible from your network
- Check if your IP is whitelisted in Salesforce (if IP restrictions are enabled)

### Invalid Query Errors

**Error**: "Invalid SOQL query" or "Invalid SOSL search"

**Solutions**:
- Verify field names exist on the Account object
- Check SOQL/SOSL syntax
- Ensure proper escaping of special characters
- Confirm you have read access to the fields being queried

### Permission Errors

**Error**: "Insufficient access rights" or "Operation not permitted"

**Solutions**:
- Verify the Salesforce user has appropriate permissions
- Check object-level and field-level security settings
- Ensure the Connected App has necessary OAuth scopes

### Missing Records

**Issue**: Expected records not returned

**Solutions**:
- Check record sharing settings
- Verify the user's role and sharing rules
- Confirm records meet filter criteria
- Check if records are owned by the user or shared with them

## Development

### Project Structure

```
salesforce-mcp-server/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript (generated)
├── .env.example          # Environment variable template
├── .gitignore           # Git ignore rules
├── package.json         # Node.js dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── README-SALESFORCE.md # This file
└── SETUP.md             # Salesforce Connected App setup guide
```

### Building

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Running in Development

```bash
npm run dev
```

Watches for file changes and automatically rebuilds.

## Technical Details

### Dependencies

- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **jsforce**: Salesforce API client library
- **dotenv**: Environment variable management
- **typescript**: TypeScript compiler

### Authentication Flow

1. Server reads credentials from environment variables
2. Creates JSforce connection with OAuth 2.0 configuration
3. Authenticates using username-password flow with security token
4. Maintains connection for subsequent API calls
5. Automatically reconnects if session expires

### Error Handling

The server implements comprehensive error handling:
- Configuration validation on startup
- Authentication error propagation
- SOQL/SOSL query validation
- Network error recovery
- Detailed error messages for debugging

### Connection Pooling

The server uses a single connection instance that's reused across requests. The connection automatically handles:
- Token refresh
- Session management
- Rate limiting (respects Salesforce API limits)

## License

MIT

## Support

For issues and questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Salesforce API documentation
3. Check MCP protocol documentation
4. Open an issue in the repository
