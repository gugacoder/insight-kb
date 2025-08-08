# STATE.md

System Signatures

## Module: [module-name]

### API Endpoints
```yaml
# HTTP endpoints exposed by this module
- method: GET
  path: /api/[resource]
  returns: {[response structure]}
  
- method: POST
  path: /api/[resource]
  accepts: {[request structure]}
  returns: {[response structure]}
```

### Data Models
```yaml
# Core data structures managed by this module
[ModelName]:
  - [field]: [type]
  - [field]: [type]
  relations:
    - [relation_type]: [OtherModel]

[AnotherModel]:
  - [field]: [type]
```

### Public Interfaces
```yaml
# Functions/services exposed to other modules
- [interfaceName]:
    purpose: [what it does]
    accepts: [input types]
    returns: [output type]
    
- [anotherInterface]:
    purpose: [what it does]
    accepts: [input types]
    returns: [output type]
```

### Business Rules
```yaml
# Core business logic and constraints
- [Rule description, e.g., "Users must have unique emails"]
- [Constraint, e.g., "Orders cannot exceed $10,000"]
- [Validation, e.g., "Phone numbers must be validated"]
```

### External Dependencies
```yaml
# External services or libraries this module uses
- [dependency]: [version/requirement]
- [service]: [connection details]
```

---

## Module: [another-module-name]

### API Endpoints
```yaml
# HTTP endpoints exposed by this module
- method: [HTTP_METHOD]
  path: /api/[resource_path]
  accepts: {[request structure]}
  returns: {[response structure]}
```

### Data Models
```yaml
# Core data structures managed by this module
[ModelName]:
  - [field]: [type]
  relations:
    - [relation_type]: [OtherModel]
```

### Public Interfaces
```yaml
# Functions/services exposed to other modules
- [interfaceName]:
    purpose: [what it does]
    accepts: [input types]
    returns: [output type]
```

### Business Rules
```yaml
# Core business logic and constraints
- [Business rule or constraint]
```

### External Dependencies
```yaml
# External services or libraries this module uses
- [dependency]: [version/requirement]
```

---

## System-Wide Configuration

### Environment Requirements
```yaml
- runtime: [e.g., Node.js 20+]
- database: [e.g., PostgreSQL 14+]
- cache: [e.g., Redis 7+]
```

### Global Business Rules
```yaml
# Rules that apply across modules
- [System-wide constraint]
- [Global validation rule]
- [Cross-cutting concern]
```

### Integration Points
```yaml
# How modules connect to each other
[module-a] → [module-b]:
  - interface: [interface name]
  - contract: [what is exchanged]
  
[module-b] → [module-c]:
  - interface: [interface name]
  - contract: [what is exchanged]
```

---

## Example (filled):

```markdown
# STATE.md - System Signatures

Generated: 2024-01-15 10:30:00
Modules: 2

## Module: Authentication

### API Endpoints
```yaml
- method: POST
  path: /api/auth/login
  accepts: {email: string, password: string}
  returns: {token: string, user: object}
  
- method: POST
  path: /api/auth/logout
  returns: {success: boolean}
  
- method: GET
  path: /api/auth/verify
  returns: {valid: boolean, user: object}
```

### Data Models
```yaml
User:
  - id: uuid
  - email: string
  - passwordHash: string
  - createdAt: timestamp
  relations:
    - hasMany: Session

Session:
  - token: string
  - userId: uuid
  - expiresAt: timestamp
  - refreshToken: string
```

### Public Interfaces
```yaml
- validateToken:
    purpose: Verify if token is valid
    accepts: token (string)
    returns: boolean
    
- getCurrentUser:
    purpose: Get user from token
    accepts: token (string)
    returns: User object or null
    
- refreshSession:
    purpose: Refresh expired token
    accepts: refreshToken (string)
    returns: {token: string, refreshToken: string}
```

### Business Rules
```yaml
- Tokens expire after 24 hours
- Refresh tokens valid for 7 days
- Email must be unique per user
- Password must be hashed with bcrypt
- Failed login attempts locked after 5 tries
```

### External Dependencies
```yaml
- bcrypt: ^5.0.0
- jsonwebtoken: ^9.0.0
- express-rate-limit: ^6.0.0
```

---

## Module: UserManagement

### API Endpoints
```yaml
- method: GET
  path: /api/users/:id
  returns: {user: object}
  
- method: PUT
  path: /api/users/:id
  accepts: {name: string, email: string}
  returns: {user: object}
  
- method: DELETE
  path: /api/users/:id
  returns: {success: boolean}
```

### Data Models
```yaml
UserProfile:
  - userId: uuid
  - name: string
  - avatar: string
  - preferences: json
  relations:
    - belongsTo: User
```

### Public Interfaces
```yaml
- getUserProfile:
    purpose: Get complete user profile
    accepts: userId (uuid)
    returns: UserProfile object
    
- updateUserPreferences:
    purpose: Update user preferences
    accepts: userId (uuid), preferences (object)
    returns: boolean
```

### Business Rules
```yaml
- Users can only update their own profile
- Avatar must be under 5MB
- Name must be 2-100 characters
```

### External Dependencies
```yaml
- sharp: ^0.31.0 (image processing)
- validator: ^13.0.0
```

---

## System-Wide Configuration

### Environment Requirements
```yaml
- runtime: Node.js 20+
- database: PostgreSQL 14+
- cache: Redis 7+
```

### Global Business Rules
```yaml
- All API responses must include correlation ID
- All dates in UTC
- All monetary values in cents
- Rate limit: 100 requests per minute per IP
```

### Integration Points
```yaml
Authentication → UserManagement:
  - interface: getCurrentUser
  - contract: Provides user context for profile access
  
UserManagement → Authentication:
  - interface: validateToken
  - contract: Verifies user identity before profile changes
```