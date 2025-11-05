#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import jsforce from "jsforce";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Salesforce connection configuration
interface SalesforceConfig {
  loginUrl: string;
  username: string;
  password: string;
  securityToken: string;
  clientId: string;
  clientSecret: string;
}

// Validate required environment variables
function validateConfig(): SalesforceConfig {
  const required = [
    "SF_LOGIN_URL",
    "SF_USERNAME",
    "SF_PASSWORD",
    "SF_SECURITY_TOKEN",
    "SF_CLIENT_ID",
    "SF_CLIENT_SECRET",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  return {
    loginUrl: process.env.SF_LOGIN_URL!,
    username: process.env.SF_USERNAME!,
    password: process.env.SF_PASSWORD!,
    securityToken: process.env.SF_SECURITY_TOKEN!,
    clientId: process.env.SF_CLIENT_ID!,
    clientSecret: process.env.SF_CLIENT_SECRET!,
  };
}

// Salesforce connection manager
class SalesforceConnection {
  private conn: jsforce.Connection | null = null;
  private config: SalesforceConfig;

  constructor(config: SalesforceConfig) {
    this.config = config;
  }

  async getConnection(): Promise<jsforce.Connection> {
    if (this.conn && this.conn.accessToken) {
      return this.conn;
    }

    this.conn = new jsforce.Connection({
      loginUrl: this.config.loginUrl,
      oauth2: {
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
      },
    });

    try {
      await this.conn.login(
        this.config.username,
        this.config.password + this.config.securityToken
      );
      console.error("Successfully connected to Salesforce");
      return this.conn;
    } catch (error) {
      console.error("Failed to connect to Salesforce:", error);
      throw new McpError(
        ErrorCode.InternalError,
        `Salesforce authentication failed: ${error}`
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.conn) {
      await this.conn.logout();
      this.conn = null;
    }
  }
}

// Initialize Salesforce connection
let sfConnection: SalesforceConnection;

try {
  const config = validateConfig();
  sfConnection = new SalesforceConnection(config);
} catch (error) {
  console.error("Configuration error:", error);
  process.exit(1);
}

// Create MCP server
const server = new Server(
  {
    name: "salesforce-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_customers",
        description:
          "List/query Customer (Account) records with optional filters and pagination. Returns a list of customers matching the criteria.",
        inputSchema: {
          type: "object",
          properties: {
            filters: {
              type: "string",
              description:
                "Optional SOQL WHERE clause filters (e.g., 'Industry = \\'Technology\\' AND AnnualRevenue > 1000000')",
            },
            limit: {
              type: "number",
              description: "Maximum number of records to return (default: 100)",
              default: 100,
            },
            offset: {
              type: "number",
              description: "Number of records to skip for pagination (default: 0)",
              default: 0,
            },
          },
        },
      },
      {
        name: "get_customer",
        description:
          "Get detailed Customer (Account) information by ID including related records. Returns comprehensive customer data.",
        inputSchema: {
          type: "object",
          properties: {
            customerId: {
              type: "string",
              description: "Salesforce Account ID (e.g., '001XXXXXXXXXXXX')",
            },
          },
          required: ["customerId"],
        },
      },
      {
        name: "search_customers",
        description:
          "Search Customers using SOSL (Salesforce Object Search Language). Performs full-text search across customer fields.",
        inputSchema: {
          type: "object",
          properties: {
            searchTerm: {
              type: "string",
              description: "Search term or phrase to find in customer records",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 50)",
              default: 50,
            },
          },
          required: ["searchTerm"],
        },
      },
      {
        name: "create_customer",
        description:
          "Create a new Customer (Account) record in Salesforce. Returns the ID of the newly created customer.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Customer/Account name (required)",
            },
            phone: {
              type: "string",
              description: "Phone number",
            },
            website: {
              type: "string",
              description: "Website URL",
            },
            industry: {
              type: "string",
              description: "Industry category",
            },
            annualRevenue: {
              type: "number",
              description: "Annual revenue amount",
            },
            numberOfEmployees: {
              type: "number",
              description: "Number of employees",
            },
            billingStreet: {
              type: "string",
              description: "Billing street address",
            },
            billingCity: {
              type: "string",
              description: "Billing city",
            },
            billingState: {
              type: "string",
              description: "Billing state/province",
            },
            billingPostalCode: {
              type: "string",
              description: "Billing postal code",
            },
            billingCountry: {
              type: "string",
              description: "Billing country",
            },
            description: {
              type: "string",
              description: "Account description",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "update_customer",
        description:
          "Update an existing Customer (Account) record. Returns success status.",
        inputSchema: {
          type: "object",
          properties: {
            customerId: {
              type: "string",
              description: "Salesforce Account ID to update",
            },
            name: {
              type: "string",
              description: "Customer/Account name",
            },
            phone: {
              type: "string",
              description: "Phone number",
            },
            website: {
              type: "string",
              description: "Website URL",
            },
            industry: {
              type: "string",
              description: "Industry category",
            },
            annualRevenue: {
              type: "number",
              description: "Annual revenue amount",
            },
            numberOfEmployees: {
              type: "number",
              description: "Number of employees",
            },
            billingStreet: {
              type: "string",
              description: "Billing street address",
            },
            billingCity: {
              type: "string",
              description: "Billing city",
            },
            billingState: {
              type: "string",
              description: "Billing state/province",
            },
            billingPostalCode: {
              type: "string",
              description: "Billing postal code",
            },
            billingCountry: {
              type: "string",
              description: "Billing country",
            },
            description: {
              type: "string",
              description: "Account description",
            },
          },
          required: ["customerId"],
        },
      },
      {
        name: "get_customer_contacts",
        description:
          "Get all Contacts associated with a Customer (Account). Returns contact list with details.",
        inputSchema: {
          type: "object",
          properties: {
            customerId: {
              type: "string",
              description: "Salesforce Account ID",
            },
            limit: {
              type: "number",
              description: "Maximum number of contacts to return (default: 100)",
              default: 100,
            },
          },
          required: ["customerId"],
        },
      },
      {
        name: "get_customer_opportunities",
        description:
          "Get all Opportunities for a Customer (Account). Returns opportunity list with details.",
        inputSchema: {
          type: "object",
          properties: {
            customerId: {
              type: "string",
              description: "Salesforce Account ID",
            },
            limit: {
              type: "number",
              description:
                "Maximum number of opportunities to return (default: 100)",
              default: 100,
            },
          },
          required: ["customerId"],
        },
      },
      {
        name: "get_customer_cases",
        description:
          "Get all Cases for a Customer (Account). Returns case list with details.",
        inputSchema: {
          type: "object",
          properties: {
            customerId: {
              type: "string",
              description: "Salesforce Account ID",
            },
            limit: {
              type: "number",
              description: "Maximum number of cases to return (default: 100)",
              default: 100,
            },
          },
          required: ["customerId"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const conn = await sfConnection.getConnection();

    switch (name) {
      case "list_customers": {
        const { filters, limit = 100, offset = 0 } = args as {
          filters?: string;
          limit?: number;
          offset?: number;
        };

        const whereClause = filters ? `WHERE ${filters}` : "";
        const query = `SELECT Id, Name, Phone, Website, Industry, AnnualRevenue, NumberOfEmployees, BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry, Description, CreatedDate, LastModifiedDate FROM Account ${whereClause} ORDER BY Name LIMIT ${limit} OFFSET ${offset}`;

        const result = await conn.query(query);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalSize: result.totalSize,
                  done: result.done,
                  records: result.records,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_customer": {
        const { customerId } = args as { customerId: string };

        if (!customerId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "customerId is required"
          );
        }

        const query = `SELECT Id, Name, Phone, Website, Industry, Type, AnnualRevenue, NumberOfEmployees, BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry, ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode, ShippingCountry, Description, CreatedDate, LastModifiedDate, OwnerId, Owner.Name FROM Account WHERE Id = '${customerId}'`;

        const result = await conn.query(query);

        if (result.records.length === 0) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Customer not found: ${customerId}`
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.records[0], null, 2),
            },
          ],
        };
      }

      case "search_customers": {
        const { searchTerm, limit = 50 } = args as {
          searchTerm: string;
          limit?: number;
        };

        if (!searchTerm) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "searchTerm is required"
          );
        }

        const soslQuery = `FIND {${searchTerm}} IN ALL FIELDS RETURNING Account(Id, Name, Phone, Website, Industry, AnnualRevenue, BillingCity, BillingState, BillingCountry) LIMIT ${limit}`;

        const result = await conn.search(soslQuery);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_customer": {
        const {
          name,
          phone,
          website,
          industry,
          annualRevenue,
          numberOfEmployees,
          billingStreet,
          billingCity,
          billingState,
          billingPostalCode,
          billingCountry,
          description,
        } = args as {
          name: string;
          phone?: string;
          website?: string;
          industry?: string;
          annualRevenue?: number;
          numberOfEmployees?: number;
          billingStreet?: string;
          billingCity?: string;
          billingState?: string;
          billingPostalCode?: string;
          billingCountry?: string;
          description?: string;
        };

        if (!name) {
          throw new McpError(ErrorCode.InvalidParams, "name is required");
        }

        const accountData: any = { Name: name };
        if (phone) accountData.Phone = phone;
        if (website) accountData.Website = website;
        if (industry) accountData.Industry = industry;
        if (annualRevenue) accountData.AnnualRevenue = annualRevenue;
        if (numberOfEmployees)
          accountData.NumberOfEmployees = numberOfEmployees;
        if (billingStreet) accountData.BillingStreet = billingStreet;
        if (billingCity) accountData.BillingCity = billingCity;
        if (billingState) accountData.BillingState = billingState;
        if (billingPostalCode)
          accountData.BillingPostalCode = billingPostalCode;
        if (billingCountry) accountData.BillingCountry = billingCountry;
        if (description) accountData.Description = description;

        const result = await conn.sobject("Account").create(accountData);

        // Handle both single result and array result
        const singleResult = Array.isArray(result) ? result[0] : result;

        if (!singleResult.success) {
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to create customer: ${JSON.stringify(singleResult.errors)}`
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  id: singleResult.id,
                  message: "Customer created successfully",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "update_customer": {
        const {
          customerId,
          name,
          phone,
          website,
          industry,
          annualRevenue,
          numberOfEmployees,
          billingStreet,
          billingCity,
          billingState,
          billingPostalCode,
          billingCountry,
          description,
        } = args as {
          customerId: string;
          name?: string;
          phone?: string;
          website?: string;
          industry?: string;
          annualRevenue?: number;
          numberOfEmployees?: number;
          billingStreet?: string;
          billingCity?: string;
          billingState?: string;
          billingPostalCode?: string;
          billingCountry?: string;
          description?: string;
        };

        if (!customerId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "customerId is required"
          );
        }

        const updateData: any = { Id: customerId };
        if (name) updateData.Name = name;
        if (phone) updateData.Phone = phone;
        if (website) updateData.Website = website;
        if (industry) updateData.Industry = industry;
        if (annualRevenue) updateData.AnnualRevenue = annualRevenue;
        if (numberOfEmployees)
          updateData.NumberOfEmployees = numberOfEmployees;
        if (billingStreet) updateData.BillingStreet = billingStreet;
        if (billingCity) updateData.BillingCity = billingCity;
        if (billingState) updateData.BillingState = billingState;
        if (billingPostalCode)
          updateData.BillingPostalCode = billingPostalCode;
        if (billingCountry) updateData.BillingCountry = billingCountry;
        if (description) updateData.Description = description;

        const result = await conn.sobject("Account").update(updateData);

        // Handle both single result and array result
        const singleResult = Array.isArray(result) ? result[0] : result;

        if (!singleResult.success) {
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to update customer: ${JSON.stringify(singleResult.errors)}`
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  id: singleResult.id,
                  message: "Customer updated successfully",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_customer_contacts": {
        const { customerId, limit = 100 } = args as {
          customerId: string;
          limit?: number;
        };

        if (!customerId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "customerId is required"
          );
        }

        const query = `SELECT Id, FirstName, LastName, Email, Phone, Title, Department, MailingStreet, MailingCity, MailingState, MailingPostalCode, MailingCountry, CreatedDate, LastModifiedDate FROM Contact WHERE AccountId = '${customerId}' ORDER BY LastName, FirstName LIMIT ${limit}`;

        const result = await conn.query(query);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalSize: result.totalSize,
                  records: result.records,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_customer_opportunities": {
        const { customerId, limit = 100 } = args as {
          customerId: string;
          limit?: number;
        };

        if (!customerId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "customerId is required"
          );
        }

        const query = `SELECT Id, Name, StageName, Amount, CloseDate, Probability, Type, LeadSource, Description, CreatedDate, LastModifiedDate, Owner.Name FROM Opportunity WHERE AccountId = '${customerId}' ORDER BY CloseDate DESC LIMIT ${limit}`;

        const result = await conn.query(query);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalSize: result.totalSize,
                  records: result.records,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_customer_cases": {
        const { customerId, limit = 100 } = args as {
          customerId: string;
          limit?: number;
        };

        if (!customerId) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "customerId is required"
          );
        }

        const query = `SELECT Id, CaseNumber, Subject, Status, Priority, Origin, Type, Reason, Description, CreatedDate, ClosedDate, LastModifiedDate, Owner.Name FROM Case WHERE AccountId = '${customerId}' ORDER BY CreatedDate DESC LIMIT ${limit}`;

        const result = await conn.query(query);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalSize: result.totalSize,
                  records: result.records,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    console.error(`Error executing tool ${name}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Salesforce MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
