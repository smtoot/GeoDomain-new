# 🚀 **GeoDomainLand API Quickstart Guide**

## **Get Started in 5 Minutes**

This guide will help you integrate with the GeoDomainLand API quickly and efficiently.

---

## **📋 Prerequisites**

- Node.js 18+ or any HTTP client
- Valid GeoDomainLand account
- Basic understanding of REST APIs

---

## **🔐 Step 1: Authentication**

### **Option A: Session-Based (Recommended for Web Apps)**
```typescript
// For Next.js applications
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session) {
  // Redirect to login
  redirect('/auth/signin');
}
```

### **Option B: API Key (Coming Soon)**
```typescript
const headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
};
```

---

## **🔍 Step 2: Search Domains**

### **Basic Search**
```typescript
const response = await fetch('/api/trpc/domains.search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'tech',
    limit: 10,
    offset: 0
  }),
  credentials: 'include' // For session auth
});

const data = await response.json();
console.log(data.data); // Array of domains
```

### **Advanced Search with Filters**
```typescript
const response = await fetch('/api/trpc/domains.search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'startup',
    filters: {
      category: 'Technology',
      geographicScope: 'National',
      minPrice: 5000,
      maxPrice: 50000
    },
    limit: 20,
    offset: 0
  }),
  credentials: 'include'
});
```

---

## **📊 Step 3: Get Dashboard Statistics**

### **Seller Dashboard**
```typescript
const stats = await fetch('/api/trpc/dashboard.getSellerStats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
});

const sellerStats = await stats.json();
console.log(sellerStats.data);
// { totalViews, totalInquiries, totalRevenue, totalDomains, ... }
```

### **Buyer Dashboard**
```typescript
const stats = await fetch('/api/trpc/dashboard.getBuyerStats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
});

const buyerStats = await stats.json();
console.log(buyerStats.data);
// { totalInquiries, totalSavedDomains, totalPurchases, ... }
```

---

## **💬 Step 4: Create an Inquiry**

```typescript
const inquiry = await fetch('/api/trpc/inquiries.create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domainId: 'domain_id_here',
    buyerName: 'John Doe',
    buyerEmail: 'john@example.com',
    buyerPhone: '+1234567890',
    buyerCompany: 'Tech Corp',
    budgetRange: '10000-20000',
    intendedUse: 'E-commerce platform',
    timeline: 'Within 30 days',
    message: 'Interested in purchasing this domain'
  }),
  credentials: 'include'
});

const result = await inquiry.json();
console.log(result.data.id); // Inquiry ID
```

---

## **👤 Step 5: Manage User Profile**

### **Get Profile**
```typescript
const profile = await fetch('/api/trpc/users.getProfile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
});

const userProfile = await profile.json();
console.log(userProfile.data);
```

### **Update Profile**
```typescript
const update = await fetch('/api/trpc/users.updateProfile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Smith',
    company: 'New Company Name',
    phone: '+1234567890'
  }),
  credentials: 'include'
});
```

---

## **🛠️ Complete Example: Domain Search App**

```typescript
// Complete React component example
import { useState, useEffect } from 'react';

interface Domain {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

export function DomainSearch() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const searchDomains = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/trpc/domains.search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          limit: 20,
          offset: 0
        }),
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setDomains(data.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchDomains(query);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search domains..."
          className="border p-2 rounded"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {domains.map((domain) => (
          <div key={domain.id} className="border p-4 rounded shadow">
            <h3 className="font-bold text-lg">{domain.name}</h3>
            <p className="text-gray-600">{domain.description}</p>
            <p className="text-green-600 font-semibold">
              ${domain.price.toLocaleString()}
            </p>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              {domain.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## **🔧 Using tRPC Client (Recommended)**

For better type safety and developer experience:

```typescript
// Install tRPC client
npm install @trpc/client @trpc/react-query

// Setup tRPC client
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/api/root';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  ],
});

// Use with full type safety
const domains = await client.domains.search.query({
  query: 'tech',
  limit: 10,
  offset: 0
});

const stats = await client.dashboard.getSellerStats.query();
```

---

## **🚨 Error Handling**

```typescript
try {
  const response = await fetch('/api/trpc/domains.search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'tech' }),
    credentials: 'include'
  });

  const data = await response.json();

  if (!data.success) {
    // Handle API errors
    console.error('API Error:', data.error);
    switch (data.error.code) {
      case 'UNAUTHORIZED':
        // Redirect to login
        break;
      case 'RATE_LIMIT_EXCEEDED':
        // Show rate limit message
        break;
      case 'VALIDATION_ERROR':
        // Show validation errors
        break;
      default:
        // Show generic error
    }
  } else {
    // Success - use data.data
    console.log(data.data);
  }
} catch (error) {
  // Handle network errors
  console.error('Network Error:', error);
}
```

---

## **📈 Performance Best Practices**

### **1. Implement Caching**
```typescript
const cache = new Map();

const searchDomains = async (query: string) => {
  const cacheKey = `search:${query}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const response = await fetch('/api/trpc/domains.search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 10, offset: 0 }),
    credentials: 'include'
  });

  const data = await response.json();
  cache.set(cacheKey, data);
  
  return data;
};
```

### **2. Use Pagination**
```typescript
const loadMoreDomains = async (offset: number) => {
  const response = await fetch('/api/trpc/domains.search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'tech',
      limit: 20,
      offset: offset
    }),
    credentials: 'include'
  });

  const data = await response.json();
  return data;
};
```

### **3. Handle Rate Limits**
```typescript
const makeRequest = async (url: string, options: RequestInit) => {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    // Implement retry logic
  }
  
  return response;
};
```

---

## **🧪 Testing Your Integration**

### **Health Check**
```bash
curl https://geo-domain-new.vercel.app/api/health/check
```

### **Test Domain Search**
```bash
curl -X POST https://geo-domain-new.vercel.app/api/trpc/domains.test \
  -H "Content-Type: application/json"
```

---

## **📚 Next Steps**

1. **Explore the API:** Visit `/api-docs` for interactive documentation
2. **Read the Full Reference:** Check out the [API Reference Guide](./API_REFERENCE.md)
3. **Join the Community:** Get help and share your projects
4. **Report Issues:** Help us improve the API

---

## **🆘 Need Help?**

- **Documentation:** [API Docs](/api-docs)
- **Support:** support@geodomainland.com
- **GitHub:** [Report issues](https://github.com/your-repo/issues)

**Happy coding! 🎉**
