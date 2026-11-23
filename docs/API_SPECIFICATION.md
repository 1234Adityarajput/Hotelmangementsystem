# Hotel Management System - REST API Specification

## Base URL
- Development: `http://localhost:4000/api/v1`
- Swagger OpenAPI: `http://localhost:4000/api/docs`

---

## Endpoints

### 1. System Health
#### `GET /api/v1/health`
- **Access**: Public
- **Description**: Verifies backend server health, uptime, system resources, and database connectivity.
- **Response `200 OK`**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "ok",
    "service": "hotel-management-backend",
    "version": "1.0.0",
    "environment": "development",
    "port": 4000,
    "timestamp": "2026-11-23T11:00:00.000Z",
    "uptimeSeconds": 45,
    "database": {
      "configured": true,
      "provider": "postgresql",
      "connected": true,
      "message": "Successfully connected and verified PostgreSQL database.",
      "latencyMs": 14
    },
    "system": {
      "memoryUsageMb": 58,
      "nodeVersion": "v24.21.0",
      "platform": "win32"
    }
  },
  "timestamp": "2026-11-23T11:00:00.000Z"
}
```

---

### 2. Authentication
#### `POST /api/v1/auth/login`
- **Access**: Public
- **Description**: Authenticates the single Admin user using email and password.
- **Request Body**:
```json
{
  "email": "admin@hotel.com",
  "password": "AdminSecurePassword123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "uuid-here",
      "email": "admin@hotel.com",
      "name": "Hotel Administrator"
    }
  },
  "timestamp": "2026-11-23T11:00:00.000Z"
}
```

#### `GET /api/v1/auth/me`
- **Access**: Protected (Requires Bearer JWT in Authorization header)
- **Description**: Returns profile details for the authenticated Admin.
- **Response `200 OK`**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "userId": "uuid-here",
    "email": "admin@hotel.com",
    "name": "Hotel Administrator",
    "isAdmin": true
  },
  "timestamp": "2026-11-23T11:00:00.000Z"
}
```

#### `GET /api/v1/auth/status`
- **Access**: Public
- **Description**: Returns status of authentication infrastructure.
