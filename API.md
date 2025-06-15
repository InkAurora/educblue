# EducBlue API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using Bearer tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Response Format

All responses are in JSON format. Error responses include a `message` field describing the error.

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Management Endpoints](#user-management-endpoints)
3. [Course Management Endpoints](#course-management-endpoints)
4. [Enrollment Endpoints](#enrollment-endpoints)
5. [Progress Tracking Endpoints](#progress-tracking-endpoints)
6. [Payment Endpoints](#payment-endpoints)
7. [Analytics Endpoints](#analytics-endpoints)
8. [Setup Endpoints](#setup-endpoints)

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Register a new user account (students only).

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response (201):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400`: Email and password are required
- `400`: User already exists
- `403`: Cannot register with specified role
- `500`: Server error

---

### Login User

**POST** `/auth/login`

Authenticate user and receive access tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400`: Invalid credentials
- `500`: Server error

---

### Refresh Token

**POST** `/auth/refresh`

Get a new access token using a refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `401`: Refresh token is required
- `401`: Invalid refresh token
- `500`: Server error

---

### Logout User

**POST** `/auth/logout`
**Authentication Required**

Log out user and invalidate refresh token.

**Request Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**

```json
{
  "message": "Logged out"
}
```

**Error Responses:**

- `400`: Refresh token is required
- `401`: Unauthorized
- `500`: Server error

---

## User Management Endpoints

### Get Current User Profile

**GET** `/users/me`
**Authentication Required**

Get the profile of the currently logged-in user.

**Response (200):**

```json
{
  "email": "user@example.com",
  "role": "student",
  "fullName": "John Doe",
  "bio": "Student bio here",
  "phoneNumber": "+1234567890",
  "enrolledCourses": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "JavaScript Fundamentals"
    }
  ]
}
```

**Error Responses:**

- `401`: Authentication required
- `404`: User not found
- `500`: Server error

---

### Update Current User Profile

**PUT** `/users/me`
**Authentication Required**

Update the profile of the currently logged-in user.

**Request Body:**

```json
{
  "fullName": "John Updated Doe",
  "bio": "Updated bio information",
  "phoneNumber": "+1987654321"
}
```

**Response (200):**

```json
{
  "message": "User updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Updated Doe",
    "role": "student",
    "bio": "Updated bio information",
    "phoneNumber": "+1987654321",
    "enrolledCourses": []
  }
}
```

**Error Responses:**

- `400`: No valid fields provided for update
- `401`: Authentication required
- `404`: User not found
- `500`: Server error

---

### Get All Users (Admin Only)

**GET** `/users`
**Authentication Required** (Admin Only)

Get a list of all users in the system.

**Response (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user1@example.com",
    "fullName": "John Doe",
    "role": "student",
    "enrolledCourses": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Course Title"
      }
    ]
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "email": "instructor@example.com",
    "fullName": "Jane Smith",
    "role": "instructor",
    "enrolledCourses": []
  }
]
```

**Error Responses:**

- `401`: Authentication required
- `403`: Access denied. Admin permissions required
- `500`: Server error

---

### Update User (Admin Only)

**PUT** `/users/:id`
**Authentication Required** (Admin Only)

Update a specific user's information.

**Request Body:**

```json
{
  "role": "instructor",
  "enrolledCourses": ["507f1f77bcf86cd799439012"]
}
```

**Response (200):**

```json
{
  "message": "User updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "instructor",
    "enrolledCourses": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Course Title"
      }
    ]
  }
}
```

**Error Responses:**

- `400`: Invalid user ID format
- `400`: Invalid role. Must be one of: student, instructor, admin
- `400`: No valid fields provided for update
- `401`: Authentication required
- `403`: Access denied. Admin permissions required
- `403`: Admin accounts cannot be demoted
- `404`: User not found
- `500`: Server error

---

### Delete User (Admin Only)

**DELETE** `/users/:id`
**Authentication Required** (Admin Only)

Delete a specific user from the system.

**Response (200):**

```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**

- `400`: Invalid user ID format
- `401`: Authentication required
- `403`: Access denied. Admin permissions required
- `403`: Admin accounts cannot be deleted
- `404`: User not found
- `500`: Server error

---

## Course Management Endpoints

### Get All Courses

**GET** `/courses`

Get a list of all published courses.

**Response (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "JavaScript Fundamentals",
    "description": "Learn the basics of JavaScript programming",
    "markdownDescription": "# Course Overview\n\nThis course covers...",
    "price": 99.99,
    "instructor": "Jane Smith",
    "duration": 40,
    "status": "published",
    "sections": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Introduction",
        "description": "Getting started with JavaScript",
        "order": 0,
        "content": [
          {
            "_id": "507f1f77bcf86cd799439013",
            "title": "Welcome Video",
            "type": "video",
            "videoUrl": "https://example.com/video1.mp4"
          }
        ]
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

**Error Responses:**

- `500`: Server error

---

### Get Course by ID

**GET** `/courses/:id`

Get detailed information about a specific course.

**Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "JavaScript Fundamentals",
  "description": "Learn the basics of JavaScript programming",
  "markdownDescription": "# Course Overview\n\nThis course covers...",
  "price": 99.99,
  "instructor": "Jane Smith",
  "duration": 40,
  "status": "published",
  "sections": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Introduction",
      "description": "Getting started with JavaScript",
      "order": 0,
      "content": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "title": "Welcome Video",
          "type": "video",
          "videoUrl": "https://example.com/video1.mp4"
        },
        {
          "_id": "507f1f77bcf86cd799439014",
          "title": "Quiz 1",
          "type": "multipleChoice",
          "question": "What is JavaScript?",
          "options": [
            "A programming language",
            "A markup language",
            "A database",
            "A web server"
          ],
          "correctOption": 0
        }
      ]
    }
  ],
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- `404`: Course not found
- `500`: Server error

---

### Create Course

**POST** `/courses`
**Authentication Required** (Instructor/Admin Only)

Create a new course.

**Request Body:**

```json
{
  "title": "React Fundamentals",
  "description": "Learn React from scratch",
  "markdownDescription": "# React Course\n\nThis course will teach you React basics...",
  "price": 149.99,
  "duration": 60,
  "sections": [
    {
      "title": "Introduction to React",
      "description": "Getting started with React",
      "order": 0,
      "content": [
        {
          "title": "What is React?",
          "type": "video",
          "videoUrl": "https://example.com/react-intro.mp4"
        },
        {
          "title": "React Basics",
          "type": "markdown",
          "content": "# React Basics\n\nReact is a JavaScript library..."
        },
        {
          "title": "Knowledge Check",
          "type": "multipleChoice",
          "question": "What is React primarily used for?",
          "options": [
            "Building user interfaces",
            "Database management",
            "Server configuration",
            "File processing"
          ],
          "correctOption": 0
        }
      ]
    }
  ]
}
```

**Response (201):**

```json
{
  "message": "Course created successfully (in draft mode)",
  "courseId": "507f1f77bcf86cd799439015",
  "course": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "React Fundamentals",
    "description": "Learn React from scratch",
    "markdownDescription": "# React Course\n\nThis course will teach you React basics...",
    "price": 149.99,
    "instructor": "Jane Smith",
    "duration": 60,
    "status": "draft",
    "sections": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "title": "Introduction to React",
        "description": "Getting started with React",
        "order": 0,
        "content": [
          {
            "_id": "507f1f77bcf86cd799439017",
            "title": "What is React?",
            "type": "video",
            "videoUrl": "https://example.com/react-intro.mp4"
          }
        ]
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `400`: Validation errors for sections/content
- `401`: Authentication required
- `403`: Access denied
- `404`: User not found
- `500`: Server error

---

### Update Course

**PUT** `/courses/:id`
**Authentication Required** (Instructor/Admin Only)

Update an existing course.

**Request Body:**

```json
{
  "title": "Advanced React Fundamentals",
  "description": "Updated course description",
  "price": 179.99
}
```

**Response (200):**

```json
{
  "message": "Course updated successfully",
  "course": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Advanced React Fundamentals",
    "description": "Updated course description",
    "price": 179.99,
    "instructor": "Jane Smith",
    "status": "draft"
  }
}
```

**Error Responses:**

- `400`: Invalid course ID format
- `401`: Authentication required
- `403`: Access denied
- `404`: Course not found
- `500`: Server error

---

### Publish Course

**PATCH** `/courses/:id/publish`
**Authentication Required** (Instructor/Admin Only)

Publish a course (change status from draft to published).

**Response (200):**

```json
{
  "message": "Course published successfully",
  "course": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "React Fundamentals",
    "status": "published"
  }
}
```

**Error Responses:**

- `400`: Course is already published
- `400`: Course must have at least one section with content to be published
- `401`: Authentication required
- `403`: Access denied
- `404`: Course not found
- `500`: Server error

---

### Get Course Sections

**GET** `/courses/:id/sections`
**Authentication Required**

Get sections of a course (without detailed content).

**Response (200):**

```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "title": "Introduction",
    "description": "Getting started with JavaScript",
    "order": 0,
    "content": [
      {
        "id": "507f1f77bcf86cd799439013",
        "title": "Welcome Video",
        "type": "video",
        "order": 0
      }
    ]
  }
]
```

**Error Responses:**

- `401`: Authentication required
- `403`: Not enrolled in this course
- `404`: Course not found
- `500`: Server error

---

### Get Section Contents

**GET** `/courses/:id/sections/:sectionId`
**Authentication Required**

Get detailed contents of a specific section.

**Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Introduction",
  "description": "Getting started with JavaScript",
  "order": 0,
  "content": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Welcome Video",
      "type": "video",
      "videoUrl": "https://example.com/video1.mp4"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Course Materials",
      "type": "markdown",
      "content": "# Welcome to the Course\n\nIn this section..."
    }
  ]
}
```

**Error Responses:**

- `401`: Authentication required
- `403`: Not enrolled in this course
- `404`: Course not found
- `404`: Section not found
- `500`: Server error

---

### Get Course Content by ID

**GET** `/courses/:id/sections/:sectionId/content/:contentId`
**Authentication Required**

Get a specific content item within a section.

**Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "title": "Welcome Video",
  "type": "video",
  "videoUrl": "https://example.com/video1.mp4"
}
```

**Error Responses:**

- `401`: Authentication required
- `403`: Not enrolled in this course
- `404`: Course not found
- `404`: Section not found
- `404`: Content not found
- `500`: Server error

---

### Add Section to Course

**POST** `/courses/:id/sections`
**Authentication Required** (Instructor/Admin Only)

Add a new section to a course.

**Request Body:**

```json
{
  "title": "Advanced Topics",
  "description": "Advanced course content",
  "order": 1
}
```

**Response (201):**

```json
{
  "message": "Section added successfully",
  "section": {
    "_id": "507f1f77bcf86cd799439018",
    "title": "Advanced Topics",
    "description": "Advanced course content",
    "order": 1,
    "content": []
  }
}
```

**Error Responses:**

- `400`: Validation errors
- `401`: Authentication required
- `403`: Access denied
- `404`: Course not found
- `500`: Server error

---

### Update Section

**PUT** `/courses/:id/sections/:sectionId`
**Authentication Required** (Instructor/Admin Only)

Update a specific section.

**Request Body:**

```json
{
  "title": "Updated Section Title",
  "description": "Updated description"
}
```

**Response (200):**

```json
{
  "message": "Section updated successfully",
  "section": {
    "_id": "507f1f77bcf86cd799439018",
    "title": "Updated Section Title",
    "description": "Updated description",
    "order": 1
  }
}
```

**Error Responses:**

- `400`: Validation errors
- `401`: Authentication required
- `403`: Access denied
- `404`: Course not found
- `404`: Section not found
- `500`: Server error

---

### Delete Section

**DELETE** `/courses/:id/sections/:sectionId`
**Authentication Required** (Instructor/Admin Only)

Delete a section from a course.

**Response (200):**

```json
{
  "message": "Section deleted successfully"
}
```

**Error Responses:**

- `401`: Authentication required
- `403`: Access denied
- `404`: Course not found
- `404`: Section not found
- `500`: Server error

---

### Add Content to Section

**POST** `/courses/:id/sections/:sectionId/content`
**Authentication Required** (Instructor/Admin Only)

Add content to a specific section.

**Request Body:**

```json
{
  "title": "New Lesson Video",
  "type": "video",
  "videoUrl": "https://example.com/new-lesson.mp4",
  "order": 1
}
```

**Response (201):**

```json
{
  "message": "Content added successfully",
  "content": {
    "_id": "507f1f77bcf86cd799439019",
    "title": "New Lesson Video",
    "type": "video",
    "videoUrl": "https://example.com/new-lesson.mp4",
    "order": 1
  }
}
```

**Error Responses:**

- `400`: Validation errors
- `401`: Authentication required
- `403`: Access denied
- `404`: Course not found
- `404`: Section not found
- `500`: Server error

---

### Update Content in Section

**PUT** `/courses/:id/sections/:sectionId/content/:contentId`
**Authentication Required** (Instructor/Admin Only)

Update specific content within a section.

**Request Body:**

```json
{
  "title": "Updated Lesson Title",
  "videoUrl": "https://example.com/updated-video.mp4"
}
```

**Response (200):**

```json
{
  "message": "Content updated successfully",
  "content": {
    "_id": "507f1f77bcf86cd799439019",
    "title": "Updated Lesson Title",
    "type": "video",
    "videoUrl": "https://example.com/updated-video.mp4"
  }
}
```

**Error Responses:**

- `400`: Validation errors
- `401`: Authentication required
- `403`: Access denied
- `404`: Course not found
- `404`: Section not found
- `404`: Content not found
- `500`: Server error

---

### Delete Content from Section

**DELETE** `/courses/:id/sections/:sectionId/content/:contentId`
**Authentication Required** (Instructor/Admin Only)

Delete specific content from a section.

**Response (200):**

```json
{
  "message": "Content deleted successfully"
}
```

**Error Responses:**

- `401`: Authentication required
- `403`: Access denied
- `404`: Course not found
- `404`: Section not found
- `404`: Content not found
- `500`: Server error

---

### Get Course Analytics

**GET** `/courses/:id/analytics`
**Authentication Required** (Instructor/Admin Only)

Get analytics data for a specific course.

**Response (200):**

```json
{
  "courseId": "507f1f77bcf86cd799439011",
  "enrollmentCount": 25,
  "completionRate": 78.5,
  "averageProgress": 65.2,
  "revenueGenerated": 2497.75,
  "enrollmentTrend": [
    { "date": "2025-01-01", "enrollments": 5 },
    { "date": "2025-01-02", "enrollments": 3 }
  ],
  "progressDistribution": {
    "0-25%": 2,
    "26-50%": 5,
    "51-75%": 8,
    "76-100%": 10
  }
}
```

**Error Responses:**

- `401`: Authentication required
- `403`: Access denied
- `404`: Course not found
- `500`: Server error

---

## Enrollment Endpoints

### Enroll in Course

**POST** `/enroll`
**Authentication Required**

Enroll in a course after successful payment.

**Request Body:**

```json
{
  "courseId": "507f1f77bcf86cd799439011",
  "sessionId": "cs_test_1234567890abcdef"
}
```

**Response (200):**

```json
{
  "message": "Successfully enrolled in the course"
}
```

**Error Responses:**

- `400`: Course ID and session ID are required
- `400`: Payment not completed
- `400`: Already enrolled in this course
- `401`: Authentication required
- `404`: Course not found
- `404`: User not found
- `500`: Server error during enrollment process

---

## Progress Tracking Endpoints

### Get Course Progress

**GET** `/progress/:courseId`
**Authentication Required**

Get progress information for a specific course.

**Response (200):**

```json
{
  "progressRecords": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "userId": "507f1f77bcf86cd799439001",
      "courseId": "507f1f77bcf86cd799439011",
      "sectionId": "507f1f77bcf86cd799439012",
      "contentId": "507f1f77bcf86cd799439013",
      "completed": true,
      "completionPercentage": 100,
      "answer": 0,
      "timestamp": "2025-01-01T10:30:00.000Z"
    }
  ],
  "progressPercentage": 85.5
}
```

**Error Responses:**

- `400`: Invalid course ID format
- `401`: Authentication required
- `403`: Access denied. User must be enrolled or be the instructor
- `404`: Course not found
- `404`: User not found
- `500`: Server error

---

### Update Progress

**POST** `/progress/:courseId/:sectionId/:contentId`
**Authentication Required**

Update progress for a specific content item.

**Request Body:**

```json
{
  "completed": true,
  "answer": 2,
  "completionPercentage": 100
}
```

**Response (200):**

```json
{
  "message": "Progress updated successfully",
  "progress": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "507f1f77bcf86cd799439001",
    "courseId": "507f1f77bcf86cd799439011",
    "sectionId": "507f1f77bcf86cd799439012",
    "contentId": "507f1f77bcf86cd799439013",
    "completed": true,
    "completionPercentage": 100,
    "answer": 2,
    "timestamp": "2025-01-01T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400`: Invalid course ID format
- `400`: Invalid section ID format
- `400`: Invalid content ID format
- `401`: Authentication required
- `403`: Access denied. User must be enrolled in this course
- `404`: Course not found
- `404`: Section not found
- `404`: Content not found
- `500`: Server error

---

## Payment Endpoints

### Create Checkout Session

**POST** `/stripe/checkout`
**Authentication Required**

Create a Stripe checkout session for course payment.

**Request Body:**

```json
{
  "courseId": "507f1f77bcf86cd799439011"
}
```

**Response (200):**

```json
{
  "sessionId": "cs_test_1234567890abcdef",
  "url": "https://checkout.stripe.com/pay/cs_test_1234567890abcdef"
}
```

**Error Responses:**

- `400`: Course ID is required
- `401`: Authentication required
- `404`: Course not found
- `500`: Server error during checkout process

---

## Analytics Endpoints

### Get Global Analytics (Admin Only)

**GET** `/analytics`
**Authentication Required** (Admin Only)

Get global platform analytics.

**Response (200):**

```json
{
  "users": {
    "total": 150,
    "byRole": {
      "student": 120,
      "instructor": 25,
      "admin": 5
    }
  },
  "courses": {
    "total": 45,
    "published": 38,
    "draft": 7
  },
  "engagement": {
    "averageCompletionRate": 72.5,
    "totalProgressEntries": 2850
  }
}
```

**Error Responses:**

- `401`: Authentication required
- `403`: Access denied. Admin permissions required
- `500`: Server error

---

### Get User Analytics (Admin Only)

**GET** `/analytics/users`
**Authentication Required** (Admin Only)

Get user activity analytics.

**Response (200):**

```json
{
  "userGrowth": [
    { "date": "2025-01-01", "newUsers": 15 },
    { "date": "2025-01-02", "newUsers": 8 }
  ],
  "completionStats": {
    "averageCompletionRate": 68.2,
    "totalCompletions": 425,
    "activeUsers": 85
  },
  "roleDistribution": {
    "student": 120,
    "instructor": 25,
    "admin": 5
  }
}
```

**Error Responses:**

- `401`: Authentication required
- `403`: Access denied. Admin permissions required
- `500`: Server error

---

### Get Financial Analytics (Admin Only)

**GET** `/analytics/financial`
**Authentication Required** (Admin Only)

Get financial analytics data.

**Response (200):**

```json
{
  "totalRevenue": 25750.0,
  "monthlyRevenue": [
    { "month": "2025-01", "revenue": 8500.0 },
    { "month": "2025-02", "revenue": 12250.0 }
  ],
  "courseRevenue": [
    {
      "courseId": "507f1f77bcf86cd799439011",
      "title": "JavaScript Fundamentals",
      "revenue": 4995.0,
      "enrollments": 50
    }
  ],
  "averageRevenuePerUser": 171.67
}
```

**Error Responses:**

- `401`: Authentication required
- `403`: Access denied. Admin permissions required
- `500`: Server error

---

## Setup Endpoints

### Setup Admin Account

**POST** `/setup-admin`

One-time setup endpoint to promote a user to admin role.

**Request Body:**

```json
{
  "email": "admin@example.com",
  "secretKey": "your-secret-key"
}
```

**Response (200):**

```json
{
  "message": "User promoted to admin successfully",
  "user": {
    "id": "507f1f77bcf86cd799439001",
    "email": "admin@example.com",
    "fullName": "Admin User",
    "role": "admin"
  }
}
```

**Error Responses:**

- `400`: Email and secretKey are required
- `403`: Invalid secret key
- `404`: User not found with this email
- `500`: Server error

---

## Error Codes Reference

### HTTP Status Codes Used

- **200**: Success
- **201**: Created successfully
- **400**: Bad Request (validation errors, missing required fields)
- **401**: Unauthorized (authentication required, invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource doesn't exist)
- **500**: Internal Server Error

### Common Error Response Format

```json
{
  "message": "Error description here"
}
```

---

## Authentication Flow

1. **Register/Login**: Get `accessToken` and `refreshToken`
2. **Use Access Token**: Include in `Authorization: Bearer <token>` header
3. **Token Expiry**: Use `/auth/refresh` with `refreshToken` to get new access token
4. **Logout**: Call `/auth/logout` to invalidate refresh token

---

## Content Types Supported

### Course Content Types:

- **video**: Video content with `videoUrl`
- **markdown**: Text content with markdown formatting
- **multipleChoice**: Quiz questions with 4 options and correct answer
- **quiz**: General quiz content
- **document**: Document/file content

### Multiple Choice Question Format:

```json
{
  "type": "multipleChoice",
  "question": "What is JavaScript?",
  "options": [
    "A programming language",
    "A markup language",
    "A database",
    "A web server"
  ],
  "correctOption": 0
}
```

---

## User Roles and Permissions

### Student

- Register/login/logout
- View courses
- Enroll in courses (after payment)
- Track progress
- Update own profile

### Instructor

- All student permissions
- Create and manage courses
- View course analytics
- Publish courses

### Admin

- All instructor permissions
- Manage all users
- View global analytics
- Access financial data
- Delete users/courses

---

## Rate Limiting and Security

- JWT tokens expire after 1 hour (access tokens)
- Refresh tokens have longer expiry
- Password hashing with bcrypt
- CORS enabled for frontend origins
- Input validation on all endpoints
- Role-based access control

---

## Development Notes

- Base URL for development: `http://localhost:5000/api`
- MongoDB used for data storage
- Stripe integration for payments
- Environment variables required for Stripe keys and JWT secrets
- Test mode available for all payment operations

---

_Last updated: June 14, 2025_
