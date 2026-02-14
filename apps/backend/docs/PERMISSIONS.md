# Strapi Role-Based Access Control (RBAC)

## Public Role Permissions

### Read-Only Content Types
- **Page**: `find`, `findOne`
- **Blog Post**: `find`, `findOne`
- **Blog Category**: `find`, `findOne`
- **Global Settings**: `find`

### Form Submission Content Types
- **Contact Submission**: `create` only
- **Intake Submission**: `create` only

## API Token Authentication

- **Frontend Server Token**: Read-only access for server-side rendering
- **Token Type**: Read-only
- **Duration**: Unlimited
- **Usage**: Server-to-server communication only (never exposed to client)

## Rate Limiting

- **Contact Submissions**: 5 requests per 15 minutes per IP
- **Intake Submissions**: 3 requests per 15 minutes per IP
- **Response**: `429 Too Many Requests` with Dutch error message
- **Storage**: In-memory (single-instance), migrate to Redis for multi-instance

## CORS Configuration

- **Allowed Origins**: Local development + production frontend URLs
- **Credentials**: Enabled
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization, X-Requested-With
