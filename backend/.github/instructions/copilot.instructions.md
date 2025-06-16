---
applyTo: '**'
---

# Copilot Instructions for EducBlue Project

## API Documentation Maintenance

**CRITICAL**: Always update `../API.md` (Do not create a new file if you can't find it. Instead try to access it via absolute path) when making ANY API changes (routes, controllers, models, request/response formats).

### Key Rules:

1. **Before** making API changes, check what documentation sections will be affected
2. **After** making API changes, immediately update the corresponding sections in `../API.md`
3. **Always** include realistic request/response examples
4. **Always** document all possible error responses with status codes
5. **Always** specify authentication requirements and role permissions

### When to Update API.md:

- New endpoints or route changes
- Request/response format modifications
- Authentication/authorization changes
- Model field additions or modifications
- Error handling updates

### Documentation Standards:

- Use realistic sample data in examples
- Include complete JSON structures
- Document all HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Specify role requirements (Student, Instructor, Admin)
- Show both success and error response examples

### Quick Template for New Endpoints:

````markdown
### [Endpoint Name]

**[METHOD]** `/path/to/endpoint`
**Authentication Required** ([Role Requirements])

[Description]

**Request Body:**

```json
{
  "field": "realistic_value"
}
```
````

**Response (200):**

```json
{
  "message": "Success",
  "data": { ... }
}
```

**Error Responses:**

- `400`: Validation error
- `401`: Authentication required
- `403`: Access denied
- `404`: Resource not found
- `500`: Server error

```

### File Locations:
- API Documentation: `../API.md`
- Instructions: `./API_DOCUMENTATION_INSTRUCTIONS.md`
- Routes: `./routes/*.js`
- Controllers: `./controllers/**/*.js`
- Models: `./models/*.js`
```
