# Copilot Integration for EducBlue API Documentation

## How to Use These Instructions with GitHub Copilot

### 1. **Copilot Instructions File**

The `.copilot-instructions.md` file contains specific instructions for Copilot to help maintain API documentation consistency.

### 2. **How Copilot Will Help You**

When you're working on API-related files, Copilot will:

- **Remind you** to update `../API.md` when you modify routes
- **Suggest** proper documentation format for new endpoints
- **Generate** realistic request/response examples
- **Include** proper error handling documentation
- **Follow** the established patterns in your existing API.md

### 3. **Activating Copilot Instructions**

#### Method 1: Using .copilot-instructions.md (Recommended)

✅ **Already created** - Copilot will automatically read the `.copilot-instructions.md` file in your project root.

#### Method 2: VS Code Settings

1. Open VS Code settings (`Ctrl+,`)
2. Search for "copilot"
3. Enable the following:
   - `github.copilot.enable`
   - `editor.inlineSuggest.enabled`

#### Method 3: Chat with Copilot

You can also tell Copilot directly:

```
@workspace Remember to always update ../API.md when I make changes to routes, controllers, or models. Follow the documentation standards in API_DOCUMENTATION_INSTRUCTIONS.md
```

### 4. **How to Work with Copilot for API Changes**

#### When Adding New Endpoints:

1. Write your route code
2. Copilot will suggest adding documentation comments
3. Copilot will remind you to update API.md
4. Ask Copilot: "Generate API documentation for this new endpoint"

#### When Modifying Existing Endpoints:

1. Make your code changes
2. Copilot will suggest updating related documentation
3. Ask Copilot: "Update the API documentation for this changed endpoint"

### 5. **Useful Copilot Prompts**

```bash
# Generate documentation for new endpoint
"Generate API.md documentation for this new route with request/response examples"

# Update existing documentation
"Update the API documentation for this modified endpoint"

# Check documentation completeness
"Review if this endpoint is properly documented in API.md"

# Generate realistic examples
"Create realistic request/response examples for this endpoint"

# Check authentication requirements
"What authentication and role requirements should be documented for this endpoint?"
```

### 6. **Example Workflow with Copilot**

#### Step 1: Add New Route

```javascript
// You write:
router.post(
  '/courses/:id/sections',
  auth,
  restrictTo('instructor', 'admin'),
  addSection
);

// Copilot suggests:
// TODO: Document this endpoint in ../API.md under Course Management > Add Section to Course
```

#### Step 2: Ask Copilot for Documentation

```
Prompt: "Generate API.md documentation for the POST /courses/:id/sections endpoint"

Copilot will generate:
- Proper markdown formatting
- Realistic request/response examples
- Appropriate error responses
- Authentication requirements
```

#### Step 3: Copilot Helps with Examples

```javascript
// Copilot will suggest realistic data like:
{
  "title": "Advanced Topics",
  "description": "Advanced course content",
  "order": 1
}
```

### 7. **VS Code Extensions to Install**

Enhance your experience with these extensions:

- **GitHub Copilot** - AI code completion
- **GitHub Copilot Chat** - AI-powered chat assistance
- **Markdown All in One** - Better markdown editing
- **REST Client** - Test your API endpoints

### 8. **Testing Integration**

To verify Copilot is working with your instructions:

1. Open any route file (e.g., `routes/courses.js`)
2. Start typing a new route
3. Copilot should suggest documentation comments
4. Try asking: "Help me document this endpoint in API.md"

### 9. **Troubleshooting**

If Copilot isn't following the instructions:

1. **Restart VS Code** - Sometimes Copilot needs a restart to pick up new instructions
2. **Check file location** - Ensure `.copilot-instructions.md` is in the project root
3. **Use explicit prompts** - Reference the instruction file directly:
   ```
   "Following the guidelines in .copilot-instructions.md, help me document this endpoint"
   ```

### 10. **Best Practices**

- **Be specific** in your Copilot prompts
- **Reference existing documentation** patterns
- **Ask for both success and error examples**
- **Verify generated documentation** matches your actual API behavior
- **Use consistent formatting** as shown in existing API.md

---

**Pro Tip**: The more you use these patterns, the better Copilot becomes at understanding your project's documentation style!

_Updated: June 14, 2025_
