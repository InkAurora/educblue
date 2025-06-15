# API Documentation Maintenance Instructions

## CRITICAL: Always Update API Documentation

**⚠️ MANDATORY REQUIREMENT: Whenever you make ANY changes to the API (routes, controllers, models, request/response formats), you MUST update the API.md file accordingly.**

## When to Update API Documentation

Update the `API.md` file whenever you:

### 1. Route Changes

- Add new endpoints
- Modify existing endpoint URLs
- Change HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Add or remove route parameters
- Modify middleware requirements (auth, role restrictions)

### 2. Request/Response Changes

- Add, remove, or modify request body fields
- Change request validation rules
- Modify response data structure
- Add new error responses or status codes
- Change success response format

### 3. Authentication & Authorization Changes

- Modify authentication requirements
- Change role-based access controls
- Update JWT token handling
- Modify middleware behavior

### 4. Model Changes

- Add new fields to User, Course, Progress models
- Modify field validation rules
- Change data types or constraints
- Add new models that affect API responses

### 5. Business Logic Changes

- Modify endpoint behavior
- Change error handling
- Update data processing logic
- Modify enrollment or payment flows

## Documentation Update Process

### Step 1: Identify Changes

Before making any API changes, identify:

- Which endpoints are affected
- What request/response formats will change
- Which user roles are impacted
- What new errors might occur

### Step 2: Update Documentation Sections

Update the relevant sections in `API.md`:

- **Endpoint descriptions** - Update method, URL, and description
- **Request examples** - Update JSON request body examples
- **Response examples** - Update JSON response examples with correct structure
- **Error responses** - Add new error codes and messages
- **Authentication requirements** - Update role requirements
- **Table of Contents** - Add new endpoints or sections

### Step 3: Validation Checklist

Before finalizing changes, verify:

- [ ] All new endpoints are documented
- [ ] Request body examples match actual validation rules
- [ ] Response examples match actual controller responses
- [ ] Error responses include all possible status codes
- [ ] Authentication requirements are clearly specified
- [ ] Role-based permissions are documented
- [ ] Examples use realistic data

### Step 4: Testing Alignment

Ensure documentation matches actual API behavior:

- [ ] Test request examples work with actual endpoints
- [ ] Response examples match actual API responses
- [ ] Error scenarios are accurately documented
- [ ] Authentication flows work as documented

## Documentation Standards

### Request Examples

- Use realistic sample data
- Include all required fields
- Show optional fields when relevant
- Use consistent naming conventions

### Response Examples

- Show complete response structure
- Include all relevant fields from models
- Use realistic ObjectIds and data
- Show nested objects properly formatted

### Error Documentation

- List all possible HTTP status codes
- Provide clear error messages
- Include validation error examples
- Document authentication/authorization errors

### Code Examples

```json
// Good example - complete and realistic
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}

// Bad example - incomplete or unrealistic
{
  "email": "test",
  "password": "123"
}
```

## Common Documentation Mistakes to Avoid

### ❌ Don't Do This:

- Skip updating docs when making "small" changes
- Use incomplete request/response examples
- Forget to document new error cases
- Leave outdated information in the docs
- Miss authentication requirement changes

### ✅ Do This:

- Update docs immediately when making API changes
- Provide complete, realistic examples
- Document all possible responses and errors
- Keep authentication requirements current
- Test examples against actual API

## File Structure Reference

```
API.md
├── Base URL & Authentication Info
├── Table of Contents
├── Authentication Endpoints
│   ├── Register User
│   ├── Login User
│   ├── Refresh Token
│   └── Logout User
├── User Management Endpoints
│   ├── Get Current User Profile
│   ├── Update Current User Profile
│   ├── Get All Users (Admin)
│   ├── Update User (Admin)
│   └── Delete User (Admin)
├── Course Management Endpoints
│   ├── Get All Courses
│   ├── Get Course by ID
│   ├── Create Course
│   ├── Update Course
│   ├── Publish Course
│   ├── Section Management
│   └── Content Management
├── Enrollment Endpoints
├── Progress Tracking Endpoints
├── Payment Endpoints
├── Analytics Endpoints
├── Setup Endpoints
├── Error Codes Reference
├── Authentication Flow
├── Content Types Supported
├── User Roles and Permissions
└── Development Notes
```

## Quick Update Template

When adding a new endpoint, use this template:

````markdown
### [Endpoint Name]

**[METHOD]** `/path/to/endpoint`
**Authentication Required** ([Role Requirements])

[Brief description of what the endpoint does]

**Request Body:**

```json
{
  "field1": "example value",
  "field2": 123
}
```
````

**Response ([Status Code]):**

```json
{
  "message": "Success message",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "field": "value"
  }
}
```

**Error Responses:**

- `400`: Bad request description
- `401`: Authentication required
- `403`: Access denied
- `404`: Resource not found
- `500`: Server error

```

## Automation Reminders

### Pre-Commit Checklist
Before committing API changes:
- [ ] API.md is updated with all changes
- [ ] All new endpoints are documented
- [ ] Request/response examples are tested
- [ ] Error responses are complete
- [ ] Authentication requirements are correct

### Code Review Checklist
When reviewing API changes:
- [ ] Check if API.md was updated
- [ ] Verify documentation matches code changes
- [ ] Test provided examples
- [ ] Ensure no documentation is outdated

## Contact for Questions

If you're unsure about how to document a specific change:
1. Check existing similar endpoints in the documentation
2. Follow the established patterns and formats
3. When in doubt, provide more detail rather than less
4. Test your examples against the actual API

---

**Remember: Good API documentation is as important as good code. Keep it current, accurate, and helpful!**

*Last updated: June 14, 2025*
```
