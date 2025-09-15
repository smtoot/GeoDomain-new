# 📋 **GeoDomainLand Coding Standards**

## **Overview**

This document outlines the coding standards and best practices for the GeoDomainLand project. These standards ensure code consistency, maintainability, and security across the entire codebase.

---

## **🔧 Development Environment**

### **Required Tools**
- **Node.js:** >= 18.0.0
- **npm:** >= 8.0.0
- **TypeScript:** ^5.3.3
- **ESLint:** Latest version
- **Prettier:** Latest version

### **IDE Configuration**
- **VS Code:** Recommended with extensions:
  - ESLint
  - Prettier
  - TypeScript Importer
  - Auto Rename Tag
  - Bracket Pair Colorizer

---

## **📝 Code Style Guidelines**

### **TypeScript/JavaScript**

#### **Naming Conventions**
```typescript
// ✅ Good
const userEmail = 'user@example.com';
const isAuthenticated = true;
const API_BASE_URL = 'https://api.example.com';

// ❌ Bad
const useremail = 'user@example.com';
const is_authenticated = true;
const apiBaseUrl = 'https://api.example.com';
```

#### **Function Declarations**
```typescript
// ✅ Good - Use arrow functions for callbacks
const handleSubmit = async (data: FormData): Promise<void> => {
  // Implementation
};

// ✅ Good - Use function declarations for main functions
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ❌ Bad
const handleSubmit = function(data) {
  // Implementation
};
```

#### **Type Definitions**
```typescript
// ✅ Good - Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// ✅ Good - Use type aliases for unions
type Status = 'pending' | 'approved' | 'rejected';

// ✅ Good - Use enums for constants
enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}
```

### **React Components**

#### **Component Structure**
```typescript
// ✅ Good - Functional components with TypeScript
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

#### **Hooks Usage**
```typescript
// ✅ Good - Custom hooks for complex logic
const useUserData = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api.users.getById.query({ id: userId });
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading };
};
```

### **API Development**

#### **tRPC Procedures**
```typescript
// ✅ Good - Well-documented procedures
/**
 * Search domains with advanced filtering and caching
 * @description Searches for domains based on query string and optional filters
 * @param input.searchSchema - Search parameters including query, filters, pagination
 * @returns Paginated list of matching domains with owner and analytics data
 * @example
 * ```typescript
 * const results = await api.domains.search.query({
 *   query: "tech",
 *   filters: { category: "Technology" },
 *   limit: 10,
 *   offset: 0
 * });
 * ```
 */
export const search = publicProcedure
  .input(searchSchema)
  .query(async ({ input }) => {
    // Implementation
  });
```

#### **Error Handling**
```typescript
// ✅ Good - Use custom error classes
try {
  const result = await someOperation();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    throw createValidationError('Invalid input provided');
  }
  throw createDatabaseError('Operation failed');
}

// ❌ Bad
try {
  const result = await someOperation();
  return result;
} catch (error) {
  throw new Error('Something went wrong');
}
```

---

## **🔒 Security Guidelines**

### **Input Validation**
```typescript
// ✅ Good - Always validate and sanitize input
const sanitizedInput = sanitization.searchQuery(userInput);
const validatedEmail = sanitization.email(userEmail);

// ❌ Bad
const query = userInput; // Direct use without validation
```

### **Authentication**
```typescript
// ✅ Good - Check authentication in procedures
export const protectedProcedure = t.procedure
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next();
  });
```

### **Rate Limiting**
```typescript
// ✅ Good - Apply rate limiting to all endpoints
export const publicProcedure = t.procedure
  .use(createPublicRateLimitedProcedure(t));
```

---

## **📁 File Organization**

### **Directory Structure**
```
src/
├── app/                    # Next.js app directory
├── components/             # Reusable UI components
├── lib/                    # Utility libraries
│   ├── auth/              # Authentication utilities
│   ├── cache/             # Caching utilities
│   ├── security/          # Security utilities
│   └── utils/             # General utilities
├── server/                # Server-side code
│   └── api/               # tRPC API routes
├── types/                 # TypeScript type definitions
└── __tests__/             # Test files
```

### **File Naming**
```typescript
// ✅ Good
user-profile.component.tsx
api-client.utils.ts
auth.middleware.ts

// ❌ Bad
userProfile.component.tsx
apiClient.utils.ts
authMiddleware.ts
```

---

## **🧪 Testing Standards**

### **Test Structure**
```typescript
// ✅ Good - Descriptive test names
describe('User Authentication', () => {
  describe('when user provides valid credentials', () => {
    it('should return user data and session token', async () => {
      // Test implementation
    });
  });

  describe('when user provides invalid credentials', () => {
    it('should return authentication error', async () => {
      // Test implementation
    });
  });
});
```

### **Test Coverage**
- **Minimum Coverage:** 80%
- **Critical Paths:** 100% coverage required
- **API Endpoints:** All endpoints must have tests
- **Security Functions:** All security utilities must be tested

---

## **📚 Documentation Standards**

### **Code Comments**
```typescript
// ✅ Good - Explain why, not what
// Calculate change percentage to show trend in dashboard
const calculateChangePercentage = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// ❌ Bad
// Add current and previous numbers
const calculateChangePercentage = (current: number, previous: number) => {
  // Implementation
};
```

### **API Documentation**
```typescript
/**
 * Get user profile with authentication
 * @description Retrieves the authenticated user's profile information
 * @returns User profile data including name, email, and role
 * @throws {TRPCError} UNAUTHORIZED if user is not authenticated
 * @example
 * ```typescript
 * const profile = await api.users.getProfile.query();
 * console.log(profile.name);
 * ```
 */
```

---

## **🚀 Performance Guidelines**

### **Database Queries**
```typescript
// ✅ Good - Use proper includes to avoid N+1 queries
const domains = await prisma.domain.findMany({
  include: {
    owner: true,
    analytics: {
      take: 1,
      orderBy: { date: 'desc' }
    }
  }
});

// ❌ Bad - N+1 query problem
const domains = await prisma.domain.findMany();
for (const domain of domains) {
  const owner = await prisma.user.findUnique({
    where: { id: domain.ownerId }
  });
}
```

### **Caching**
```typescript
// ✅ Good - Implement caching for expensive operations
const cacheKey = cacheKeys.domainSearch(query, filters);
const cached = await cache.get(cacheKey);
if (cached) return cached;

const result = await expensiveOperation();
await cache.set(cacheKey, result, 300); // 5 minutes
return result;
```

---

## **🔄 Git Workflow**

### **Commit Messages**
```bash
# ✅ Good - Conventional commits
feat: add domain search functionality
fix: resolve authentication issue
docs: update API documentation
test: add unit tests for user service
refactor: optimize database queries

# ❌ Bad
fix stuff
update
changes
```

### **Branch Naming**
```bash
# ✅ Good
feature/domain-search
bugfix/auth-issue
hotfix/security-patch
docs/api-reference

# ❌ Bad
new-feature
fix
update
```

---

## **🛠️ Development Tools**

### **Pre-commit Hooks**
The project uses Husky and lint-staged to ensure code quality:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "npm run type-check"
    ]
  }
}
```

### **ESLint Rules**
Key ESLint rules enforced:
- Security rules for vulnerability detection
- TypeScript best practices
- Import organization
- Code consistency

### **Prettier Configuration**
Consistent code formatting with:
- Single quotes
- Semicolons
- 2-space indentation
- 80 character line length

---

## **📋 Code Review Checklist**

### **Before Submitting PR**
- [ ] Code follows naming conventions
- [ ] All functions are properly documented
- [ ] Tests are written and passing
- [ ] No console.log statements in production code
- [ ] Input validation is implemented
- [ ] Error handling is proper
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed

### **Review Criteria**
- [ ] Code is readable and maintainable
- [ ] Logic is correct and efficient
- [ ] Edge cases are handled
- [ ] No security vulnerabilities
- [ ] Documentation is complete
- [ ] Tests cover the functionality

---

## **🚨 Common Violations**

### **Security Issues**
```typescript
// ❌ Bad - SQL injection risk
const query = `SELECT * FROM users WHERE name = '${userInput}'`;

// ❌ Bad - XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ❌ Bad - No input validation
const result = await prisma.user.findMany({
  where: { name: userInput }
});
```

### **Performance Issues**
```typescript
// ❌ Bad - N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { userId: user.id }
  });
}

// ❌ Bad - No caching
const expensiveResult = await expensiveOperation();
return expensiveResult;
```

---

## **📞 Getting Help**

- **Documentation:** Check existing docs first
- **Code Review:** Ask for reviews on complex changes
- **Security:** Consult security team for sensitive changes
- **Performance:** Profile before optimizing

---

**Remember: Good code is not just working code, but code that is secure, maintainable, and performant! 🚀**
