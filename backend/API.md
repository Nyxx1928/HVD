# API Documentation

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: Configure via `CORS_ORIGIN` environment variable

## Response Format

All API responses follow a consistent JSON structure.

### Success Response
```json
{
  "id": "uuid",
  "name": "string",
  "message": "string",
  "created_at": "ISO 8601 timestamp"
}
```

### Error Response
```json
{
  "error": "Human-readable error message",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/love-notes"
}
```

## Error Status Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Validation error or malformed request |
| 404 | Not Found - Resource does not exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Unexpected server error |

---

## Endpoints

### 1. Root Endpoint

Simple endpoint to verify the API is running.

**Endpoint**: `GET /`

**Rate Limit**: None

**Request Example**:
```bash
curl http://localhost:3001/
```

**Response 200 - Success**:
```
Valentine's Love Wall API
```

**Response Type**: Plain text string

---

### 2. Health Check

Check the API and database health status.

**Endpoint**: `GET /health`

**Rate Limit**: None

**Request Example**:
```bash
curl http://localhost:3001/health
```

**Response 200 - Success**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

**Response Fields**:
- `status` (string): Overall API status, always "ok" if responding
- `timestamp` (string): Current server time in ISO 8601 format
- `database` (string): Database connection status - "connected" or "disconnected"

---

### 3. Get All Love Notes

Retrieve all love notes ordered by creation date (newest first).

**Endpoint**: `GET /love-notes`

**Rate Limit**: None

**Query Parameters**: None

**Request Example**:
```bash
curl http://localhost:3001/love-notes
```

**Response 200 - Success**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Alice",
    "message": "Happy Valentine's Day! 💕",
    "emoji": "💗",
    "color": "rose",
    "created_at": "2024-02-14T10:30:00.000Z"
  },
  {
    "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "name": "Bob",
    "message": "Sending love to everyone!",
    "emoji": "🌹",
    "color": "red",
    "created_at": "2024-02-14T09:15:00.000Z"
  }
]
```

**Response Fields**:
- `id` (string): UUID of the love note
- `name` (string): Author name (max 36 characters)
- `message` (string): Love note message (max 240 characters)
- `emoji` (string): Selected emoji (💗, 💘, 💝, 🌹, or ✨)
- `color` (string): Selected color theme (rose, pink, red, coral, or lilac)
- `created_at` (string): Creation timestamp in ISO 8601 format

**Notes**:
- Returns up to 100 most recent love notes
- Results are ordered by `created_at` descending (newest first)
- Returns empty array `[]` if no love notes exist

---

### 4. Create Love Note

Create a new love note with validated data.

**Endpoint**: `POST /love-notes`

**Rate Limit**: 5 requests per 60 seconds per IP address

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "name": "Alice",
  "message": "Happy Valentine's Day! 💕",
  "emoji": "💗",
  "color": "rose"
}
```

**Request Fields**:
- `name` (string, required): Author name
  - Must not be empty after trimming whitespace
  - Maximum length: 36 characters
  - Automatically trimmed of leading/trailing whitespace
- `message` (string, required): Love note message
  - Must not be empty after trimming whitespace
  - Maximum length: 240 characters
  - Automatically trimmed of leading/trailing whitespace
- `emoji` (string, optional): Selected emoji
  - Allowed values: `💗`, `💘`, `💝`, `🌹`, `✨`
  - Default: `💗` if not provided
- `color` (string, optional): Color theme
  - Allowed values: `rose`, `pink`, `red`, `coral`, `lilac`
  - Default: `rose` if not provided

**Request Example**:
```bash
curl -X POST http://localhost:3001/love-notes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "message": "Happy Valentine'\''s Day! 💕",
    "emoji": "💗",
    "color": "rose"
  }'
```

**Response 201 - Created**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alice",
  "message": "Happy Valentine's Day! 💕",
  "emoji": "💗",
  "color": "rose",
  "created_at": "2024-02-14T10:30:00.000Z"
}
```

**Response 400 - Validation Error**:
```json
{
  "error": "name should not be empty",
  "statusCode": 400,
  "timestamp": "2024-02-14T10:30:00.000Z",
  "path": "/love-notes"
}
```

**Common Validation Errors**:
- `"name should not be empty"` - Missing or empty name field
- `"name must be shorter than or equal to 36 characters"` - Name too long
- `"message should not be empty"` - Missing or empty message field
- `"message must be shorter than or equal to 240 characters"` - Message too long
- `"emoji must be one of the following values: 💗, 💘, 💝, 🌹, ✨"` - Invalid emoji
- `"color must be one of the following values: rose, pink, red, coral, lilac"` - Invalid color

**Response 429 - Rate Limit Exceeded**:
```json
{
  "error": "Too many requests, please try again later",
  "statusCode": 429,
  "timestamp": "2024-02-14T10:30:00.000Z",
  "path": "/love-notes"
}
```

**Response Headers (429)**:
- `Retry-After`: Number of seconds until the rate limit resets (e.g., "45")

---

### 5. Get Comments for Love Note

Retrieve all comments for a specific love note ordered by creation date (oldest first).

**Endpoint**: `GET /love-notes/:noteId/comments`

**Rate Limit**: None

**Path Parameters**:
- `noteId` (string, required): UUID of the love note

**Request Example**:
```bash
curl http://localhost:3001/love-notes/550e8400-e29b-41d4-a716-446655440000/comments
```

**Response 200 - Success**:
```json
[
  {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Bob",
    "comment": "Beautiful message!",
    "created_at": "2024-02-14T10:35:00.000Z"
  },
  {
    "id": "8d0e7780-8536-51ef-a55c-f18gd2g01bf8",
    "name": "Charlie",
    "comment": "Love this! ❤️",
    "created_at": "2024-02-14T10:40:00.000Z"
  }
]
```

**Response Fields**:
- `id` (string): UUID of the comment
- `name` (string): Commenter name (max 36 characters)
- `comment` (string): Comment text (max 200 characters)
- `created_at` (string): Creation timestamp in ISO 8601 format

**Response 400 - Invalid UUID**:
```json
{
  "error": "Validation failed (uuid is expected)",
  "statusCode": 400,
  "timestamp": "2024-02-14T10:30:00.000Z",
  "path": "/love-notes/invalid-uuid/comments"
}
```

**Notes**:
- Returns up to 50 comments per love note
- Results are ordered by `created_at` ascending (oldest first)
- Returns empty array `[]` if no comments exist for the note
- Returns empty array `[]` if the noteId doesn't exist (not a 404)

---

### 6. Create Comment

Create a new comment for a specific love note.

**Endpoint**: `POST /love-notes/:noteId/comments`

**Rate Limit**: 10 requests per 60 seconds per IP address

**Content-Type**: `application/json`

**Path Parameters**:
- `noteId` (string, required): UUID of the love note

**Request Body**:
```json
{
  "name": "Bob",
  "comment": "Beautiful message!"
}
```

**Request Fields**:
- `name` (string, required): Commenter name
  - Must not be empty after trimming whitespace
  - Maximum length: 36 characters
  - Automatically trimmed of leading/trailing whitespace
- `comment` (string, required): Comment text
  - Must not be empty after trimming whitespace
  - Maximum length: 200 characters
  - Automatically trimmed of leading/trailing whitespace

**Request Example**:
```bash
curl -X POST http://localhost:3001/love-notes/550e8400-e29b-41d4-a716-446655440000/comments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob",
    "comment": "Beautiful message!"
  }'
```

**Response 201 - Created**:
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "Bob",
  "comment": "Beautiful message!",
  "created_at": "2024-02-14T10:35:00.000Z"
}
```

**Response 400 - Validation Error**:
```json
{
  "error": "name should not be empty",
  "statusCode": 400,
  "timestamp": "2024-02-14T10:30:00.000Z",
  "path": "/love-notes/550e8400-e29b-41d4-a716-446655440000/comments"
}
```

**Common Validation Errors**:
- `"name should not be empty"` - Missing or empty name field
- `"name must be shorter than or equal to 36 characters"` - Name too long
- `"comment should not be empty"` - Missing or empty comment field
- `"comment must be shorter than or equal to 200 characters"` - Comment too long
- `"Validation failed (uuid is expected)"` - Invalid UUID format for noteId

**Response 404 - Love Note Not Found**:
```json
{
  "error": "Love note not found",
  "statusCode": 404,
  "timestamp": "2024-02-14T10:30:00.000Z",
  "path": "/love-notes/550e8400-e29b-41d4-a716-446655440000/comments"
}
```

**Response 429 - Rate Limit Exceeded**:
```json
{
  "error": "Too many requests, please try again later",
  "statusCode": 429,
  "timestamp": "2024-02-14T10:30:00.000Z",
  "path": "/love-notes/550e8400-e29b-41d4-a716-446655440000/comments"
}
```

**Response Headers (429)**:
- `Retry-After`: Number of seconds until the rate limit resets (e.g., "45")

---

## Rate Limiting

The API implements database-backed rate limiting to prevent abuse and spam.

### Rate Limit Configuration

| Endpoint | Method | Max Requests | Time Window |
|----------|--------|--------------|-------------|
| `/love-notes` | POST | 5 | 60 seconds |
| `/love-notes/:noteId/comments` | POST | 10 | 60 seconds |
| All other endpoints | * | None | N/A |

### How Rate Limiting Works

1. **IP Extraction**: The server extracts the client IP address from:
   - `x-forwarded-for` header (for requests through proxies/load balancers)
   - `x-real-ip` header (fallback)
   - Falls back to "unknown" if neither header is present

2. **Request Tracking**: Each POST request increments a counter for the client IP

3. **Limit Enforcement**: When the counter exceeds the limit within the time window:
   - Returns HTTP 429 (Too Many Requests)
   - Includes `Retry-After` header with seconds until reset
   - Blocks the request from being processed

4. **Window Reset**: After the time window expires (60 seconds), the counter resets to 0

5. **Persistence**: Rate limit data is stored in the PostgreSQL database, persisting across server restarts

### Rate Limit Response

When rate limited, the API returns:

**Status**: 429 Too Many Requests

**Headers**:
```
Retry-After: 45
```

**Body**:
```json
{
  "error": "Too many requests, please try again later",
  "statusCode": 429,
  "timestamp": "2024-02-14T10:30:00.000Z",
  "path": "/love-notes"
}
```

### Best Practices

- **Respect Rate Limits**: Implement exponential backoff when receiving 429 responses
- **Use Retry-After**: Wait for the duration specified in the `Retry-After` header
- **Cache Responses**: Cache GET responses to reduce unnecessary requests
- **Handle Errors Gracefully**: Display user-friendly messages when rate limited

---

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) to allow requests from the frontend application.

### Allowed Origins

Configure via the `CORS_ORIGIN` environment variable:
- **Development**: `http://localhost:3000` (default)
- **Production**: Set to your frontend domain (e.g., `https://example.com`)

### Allowed Methods

- GET
- HEAD
- PUT
- PATCH
- POST
- DELETE

### Credentials

Credentials (cookies, authorization headers) are supported: `credentials: true`

---

## Environment Variables

Configure the API using environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `PORT` | Server port | 3001 | No |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |

**Example `.env` file**:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/lovewall"
PORT=3001
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

---

## Testing the API

### Using cURL

**Check API status**:
```bash
curl http://localhost:3001/
```

**Check health**:
```bash
curl http://localhost:3001/health
```

**Create a love note**:
```bash
curl -X POST http://localhost:3001/love-notes \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","message":"Testing the API"}'
```

**Get all love notes**:
```bash
curl http://localhost:3001/love-notes
```

**Create a comment**:
```bash
curl -X POST http://localhost:3001/love-notes/YOUR_NOTE_ID/comments \
  -H "Content-Type: application/json" \
  -d '{"name":"Commenter","comment":"Great note!"}'
```

**Get comments**:
```bash
curl http://localhost:3001/love-notes/YOUR_NOTE_ID/comments
```

### Using JavaScript Fetch

**Check API status**:
```javascript
const response = await fetch('http://localhost:3001/');
const message = await response.text();
console.log('API Status:', message); // "Valentine's Love Wall API"
```

**Check health**:
```javascript
const healthResponse = await fetch('http://localhost:3001/health');
const health = await healthResponse.json();
console.log('Health:', health);
```

**Create a love note**:
```javascript
const response = await fetch('http://localhost:3001/love-notes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Alice',
    message: 'Happy Valentine\'s Day!',
    emoji: '💗',
    color: 'rose'
  })
});

if (!response.ok) {
  const error = await response.json();
  console.error('Error:', error.error);
} else {
  const loveNote = await response.json();
  console.log('Created:', loveNote);
}
```

**Get all love notes**:
```javascript
const notesResponse = await fetch('http://localhost:3001/love-notes');
const notes = await notesResponse.json();
console.log('Love notes:', notes);
```

---

## Common Issues and Troubleshooting

### 400 Bad Request

**Cause**: Invalid request data or validation failure

**Solutions**:
- Ensure all required fields are present (`name`, `message` for love notes; `name`, `comment` for comments)
- Check field length constraints (name ≤ 36 chars, message ≤ 240 chars, comment ≤ 200 chars)
- Verify enum values for `emoji` and `color` fields
- Ensure UUID format is valid for `noteId` parameter

### 404 Not Found

**Cause**: Love note with specified ID does not exist

**Solutions**:
- Verify the `noteId` exists by fetching all love notes first
- Check for typos in the UUID
- Ensure the love note wasn't deleted

### 429 Too Many Requests

**Cause**: Rate limit exceeded

**Solutions**:
- Wait for the duration specified in the `Retry-After` header
- Implement exponential backoff in your client
- Reduce request frequency
- Consider caching responses

### 500 Internal Server Error

**Cause**: Unexpected server error or database connection issue

**Solutions**:
- Check server logs for detailed error information
- Verify database connection using the `/health` endpoint
- Ensure PostgreSQL is running and accessible
- Check environment variables are correctly configured

### CORS Errors

**Cause**: Request from unauthorized origin

**Solutions**:
- Verify `CORS_ORIGIN` environment variable matches your frontend URL
- Ensure the frontend is making requests to the correct API URL
- Check browser console for specific CORS error messages

---

## Additional Resources

- **NestJS Documentation**: https://docs.nestjs.com/
- **Prisma Documentation**: https://www.prisma.io/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

For more information about the backend architecture and deployment, see:
- `README.md` - Setup and development instructions
- `docker-compose.yml` - Docker deployment configuration
- `prisma/schema.prisma` - Database schema definition
