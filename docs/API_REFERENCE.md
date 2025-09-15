# 📚 **GeoDomainLand API Reference Guide**

## **Overview**

The GeoDomainLand API is a comprehensive RESTful API built with tRPC that provides access to all functionality of the domain marketplace platform. This guide covers authentication, endpoints, request/response formats, and integration examples.

---

## **🔐 Authentication**

### **Session-Based Authentication**
The API uses NextAuth.js for session management. Include the session cookie in your requests:

```typescript
// For browser requests (automatic)
const response = await fetch('/api/trpc/domains.search', {
  credentials: 'include'
});

// For server-side requests
const session = await getServerSession(authOptions);
```

### **API Key Authentication** (Coming Soon)
```typescript
const response = await fetch('/api/trpc/domains.search', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
```

---

## **🌐 Base URLs**

- **Development:** `http://localhost:3000`
- **Production:** `https://geo-domain-new.vercel.app`

---

## **📋 API Endpoints**

### **Domains**

#### **Search Domains**
```typescript
POST /api/trpc/domains.search
```

**Request Body:**
```json
{
  "query": "tech",
  "filters": {
    "category": "Technology",
    "geographicScope": "National",
    "minPrice": 1000,
    "maxPrice": 50000
  },
  "limit": 10,
  "offset": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "domain_id",
      "name": "techstartup.com",
      "price": 15000,
      "priceType": "FIXED",
      "description": "Perfect for tech startups",
      "category": "Technology",
      "geographicScope": "National",
      "owner": {
        "id": "user_id",
        "name": "John Doe",
        "company": "Domain Seller Co"
      },
      "analytics": [
        {
          "views": 150,
          "inquiries": 5,
          "date": "2024-01-15T00:00:00.000Z"
        }
      ]
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### **Get Domain by ID**
```typescript
POST /api/trpc/domains.getById
```

**Request Body:**
```json
{
  "id": "domain_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "domain_id",
    "name": "techstartup.com",
    "price": 15000,
    "description": "Perfect for tech startups",
    "status": "VERIFIED",
    "owner": {
      "id": "user_id",
      "name": "John Doe",
      "company": "Domain Seller Co"
    },
    "analytics": [...],
    "inquiries": [...]
  }
}
```

### **Dashboard**

#### **Get Seller Statistics**
```typescript
POST /api/trpc/dashboard.getSellerStats
```

**Response:**
```json
{
  "totalViews": 1250,
  "totalInquiries": 45,
  "totalRevenue": 125000,
  "totalDomains": 12,
  "viewsChange": 15,
  "inquiriesChange": -5,
  "revenueChange": 25,
  "domainsChange": 0
}
```

#### **Get Buyer Statistics**
```typescript
POST /api/trpc/dashboard.getBuyerStats
```

**Response:**
```json
{
  "totalInquiries": 8,
  "pendingInquiries": 2,
  "openInquiries": 3,
  "closedInquiries": 3,
  "totalSavedDomains": 15,
  "totalPurchases": 2,
  "totalSpent": 25000,
  "recentActivity": 5,
  "inquiriesChange": 20,
  "spendingChange": 100,
  "savedChange": 10,
  "activityChange": 20
}
```

### **Inquiries**

#### **Create Inquiry**
```typescript
POST /api/trpc/inquiries.create
```

**Request Body:**
```json
{
  "domainId": "domain_id",
  "buyerName": "Jane Smith",
  "buyerEmail": "jane@example.com",
  "buyerPhone": "+1234567890",
  "buyerCompany": "Tech Corp",
  "budgetRange": "10000-20000",
  "intendedUse": "E-commerce platform",
  "timeline": "Within 30 days",
  "message": "Interested in purchasing this domain for our new project"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inquiry_id",
    "status": "PENDING_REVIEW",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Get User Inquiries**
```typescript
POST /api/trpc/inquiries.getUserInquiries
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "inquiry_id",
      "domain": {
        "id": "domain_id",
        "name": "techstartup.com",
        "price": 15000
      },
      "status": "OPEN",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "message": "Interested in purchasing this domain"
    }
  ]
}
```

### **Users**

#### **Get User Profile**
```typescript
POST /api/trpc/users.getProfile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "SELLER",
    "company": "Domain Seller Co",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### **Update User Profile**
```typescript
POST /api/trpc/users.updateProfile
```

**Request Body:**
```json
{
  "name": "John Smith",
  "company": "New Company Name",
  "phone": "+1234567890"
}
```

### **Health Check**

#### **System Health**
```typescript
GET /api/health/check
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 86400,
    "environment": "production",
    "database": {
      "status": "connected",
      "responseTime": 24,
      "statistics": {
        "users": 150,
        "domains": 500,
        "inquiries": 75
      }
    },
    "cache": {
      "status": "connected",
      "responseTime": 5
    },
    "performance": {
      "totalResponseTime": 29,
      "memory": {
        "used": 206380856,
        "total": 239812608
      }
    }
  }
}
```

---

## **📊 Response Formats**

### **Success Response**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### **Pagination Response**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": true,
    "total": 150
  }
}
```

---

## **🚨 Error Codes**

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_SERVER_ERROR` | Server error | 500 |

---

## **🔧 Rate Limiting**

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public endpoints | 1000 requests | 1 minute |
| User endpoints | 100 requests | 1 minute |
| Admin endpoints | 10 requests | 1 minute |

---

## **💡 Integration Examples**

### **JavaScript/TypeScript**
```typescript
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/api/root';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'https://geo-domain-new.vercel.app/api/trpc',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  ],
});

// Search domains
const domains = await client.domains.search.query({
  query: 'tech',
  limit: 10,
  offset: 0
});

// Get dashboard stats
const stats = await client.dashboard.getSellerStats.query();
```

### **Python**
```python
import requests
import json

# Search domains
response = requests.post(
    'https://geo-domain-new.vercel.app/api/trpc/domains.search',
    json={
        'query': 'tech',
        'limit': 10,
        'offset': 0
    },
    headers={'Content-Type': 'application/json'}
)

domains = response.json()
```

### **cURL**
```bash
# Search domains
curl -X POST https://geo-domain-new.vercel.app/api/trpc/domains.search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "tech",
    "limit": 10,
    "offset": 0
  }'

# Get health check
curl https://geo-domain-new.vercel.app/api/health/check
```

---

## **📈 Performance Tips**

1. **Use Pagination:** Always use `limit` and `offset` for large datasets
2. **Cache Responses:** Implement client-side caching for frequently accessed data
3. **Batch Requests:** Use tRPC's batch functionality for multiple requests
4. **Monitor Rate Limits:** Check response headers for rate limit information

---

## **🛠️ Development Tools**

### **API Documentation**
- **Swagger UI:** `/api-docs` - Interactive API documentation
- **OpenAPI Spec:** `/api/docs` - Machine-readable API specification

### **Testing**
```bash
# Health check
curl https://geo-domain-new.vercel.app/api/health/check

# Test domain search
curl -X POST https://geo-domain-new.vercel.app/api/trpc/domains.test
```

---

## **📞 Support**

- **Documentation:** [API Docs](/api-docs)
- **Support Email:** support@geodomainland.com
- **GitHub Issues:** [Report bugs and feature requests](https://github.com/your-repo/issues)

---

## **🔄 Changelog**

### **v1.0.0** (Current)
- Initial API release
- Domain search and management
- User authentication and profiles
- Inquiry system
- Dashboard analytics
- Rate limiting and security features
