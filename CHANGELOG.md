# Changelog

All notable changes to the ClickUp Remote MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Major Architecture Changes

This project is a **complete architectural reimplementation** of the [original ClickUp MCP Server](https://github.com/taazkareem/clickup-mcp-server) by Talib Kareem.

**Key Differences:**
- **Remote MCP Server**: CloudFlare Workers SaaS deployment (vs. local STDIO server)
- **OAuth 2.0 Authentication**: Secure user authentication (vs. API key environment variables)
- **Multi-Tenancy**: Encrypted user isolation and session management
- **Premium Tier**: Monetization with free and paid tiers ($4.99/month)
- **72 Tools**: Expanded from original 45 tools across 12 categories

**Acknowledgment:** This project builds upon the excellent foundation provided by Talib Kareem's ClickUp MCP Server (v0.8.5). The core ClickUp API service layer, tool definitions, and natural language date parsing are derived from the original MIT-licensed project. All architectural changes for remote deployment, OAuth, multi-tenancy, and premium features are new implementations.

---

## v1.0.0 - TBD (Initial Remote MCP Release)

### Added
- **CloudFlare Workers Architecture**
  - Remote MCP server deployment on CloudFlare Workers
  - Multi-environment support (development, staging, production)
  - CloudFlare KV for session and API key storage
  - CloudFlare R2 for audit log storage

- **OAuth 2.0 Authentication**
  - Secure ClickUp OAuth 2.0 flow
  - No API key exposure to end users
  - JWT session tokens (24-hour validity)
  - Automatic token refresh
  - OAuth endpoints: `/auth/login`, `/auth/callback`, `/auth/refresh`

- **Multi-Tenancy & Security**
  - Complete user isolation
  - AES-256-GCM encryption for stored API keys
  - Per-user rate limiting (100 req/min free, 500 req/min premium)
  - Comprehensive audit logging to R2
  - Security layer with encryption, rate limiting, and monitoring

- **Premium Subscription**
  - Free tier with core tools
  - Premium tier ($4.99/month) with enhanced limits and advanced tools
  - Stripe integration for billing
  - Tool tier restrictions (free vs premium)
  - Webhook support for subscription events

- **Transport & Protocol**
  - HTTP Streamable transport for remote MCP protocol
  - WebSocket support for real-time connections
  - SSE endpoint for legacy compatibility
  - Bearer token authentication via JWT

### Enhanced
- Expanded tool count from 45 to 72 tools across 12 categories
- Premium tool tier with advanced features
- Enhanced error handling for multi-tenant scenarios
- Improved logging and monitoring for production SaaS

### Changed
- **Architecture**: Local STDIO server → Remote CloudFlare Workers SaaS
- **Authentication**: API key environment variables → OAuth 2.0
- **Storage**: None → CloudFlare KV (sessions/keys) + R2 (audit logs)
- **Deployment**: NPM package installation → Hosted service
- **Access Model**: Self-hosted → SaaS with free and premium tiers

---

## Original Project History (v0.5.0 - v0.8.5)

For the complete history of the original ClickUp MCP Server project, see:
https://github.com/taazkareem/clickup-mcp-server/blob/main/CHANGELOG.md

**Notable inherited features:**
- **v0.8.5**: Natural language date parsing with 47+ patterns, enhanced task assignment
- **v0.8.4**: Security features including HTTPS/TLS support, rate limiting, CORS
- **v0.8.3**: Enhanced workspace task filtering with Views API support
- **v0.8.0**: HTTP Streamable transport, member management tools, major refactoring
- **v0.7.1**: Document management, time tracking functionality, command disabling
- **v0.6.0**: Subtasks support, configurable logging, custom task ID handling
- **v0.5.1**: Custom IDs, file attachments, task comments, improved date parsing

**Core inherited functionality:**
- Complete ClickUp API service layer
- Task, list, folder, and space management
- Natural language date parsing
- Time tracking tools
- Custom fields support
- Tag management
- Document management
- Member and assignee resolution
- Workspace hierarchy navigation

---

## Acknowledgments

This Remote MCP Server builds upon the excellent [ClickUp MCP Server](https://github.com/taazkareem/clickup-mcp-server) by [Talib Kareem](https://github.com/taazkareem), licensed under MIT.

Thank you to Talib and all contributors to the original project for providing such a solid foundation!
