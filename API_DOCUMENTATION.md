# API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require a header:
---

## Auth

### POST /auth/login
Authenticate and receive a JWT.

**Body:**
```json
{ "email": "admin@ems.com", "password": "Admin@123" }
```

**Response `200`:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "uuid",
    "employeeCode": "EMP001",
    "name": "Super Admin",
    "email": "admin@ems.com",
    "role": "SUPER_ADMIN",
    "...": "..."
  }
}
```

**Errors:** `400` missing fields · `401` invalid credentials · `403` account inactive

### POST /auth/logout
Stateless endpoint (client deletes the token). Returns `200 { "message": "Logged out successfully" }`.

---

## Employees

All routes below require authentication.

### GET /employees
List employees with search, filter, sort, pagination. **Requires:** Super Admin or HR Manager.

**Query params:** `search`, `department`, `role`, `status`, `sortBy`, `order` (`asc`/`desc`), `page`, `limit`

**Response `200`:**
```json
{ "data": [ /* employee objects */ ], "pagination": { "total": 2, "page": 1, "limit": 10, "totalPages": 1 } }
```

### GET /employees/:id
Get one employee. Employees can only fetch their own record (`403` otherwise).

### POST /employees
Create an employee. **Requires:** Super Admin or HR Manager. HR cannot assign `SUPER_ADMIN` role (`403`).

**Body:**
```json
{
  "employeeCode": "EMP003", "name": "Jane Smith", "email": "jane@ems.com",
  "phone": "9876543210", "password": "Pass@123", "department": "Engineering",
  "designation": "Software Engineer", "salary": 50000, "joiningDate": "2026-01-15",
  "role": "EMPLOYEE"
}
```

### PUT /employees/:id
Update an employee. Super Admin/HR can edit all fields; Employees can edit only `phone` and `profileImageUrl` on their own profile.

### DELETE /employees/:id
Soft-delete an employee (`isDeleted: true`). **Requires:** Super Admin only.

### GET /employees/:id/reportees
List an employee's direct reports.

### PATCH /employees/:id/manager
Reassign an employee's manager. **Requires:** Super Admin or HR Manager. Rejects assignments that would create a circular reporting chain (`400`).

**Body:** `{ "managerId": "uuid-or-null" }`

---

## Organization

### GET /organization/tree
Returns the full company hierarchy as a nested tree, rooted at employees with no manager.

**Response `200`:**
```json
{
  "tree": [
    {
      "id": "uuid", "name": "Super Admin", "designation": "Super Admin",
      "department": "Administration", "role": "SUPER_ADMIN", "status": "ACTIVE",
      "directReports": [ /* nested recursively */ ]
    }
  ]
}
```

---

## Dashboard

### GET /dashboard/stats
Returns company-wide counts.

**Response `200`:**
```json
{
  "totalEmployees": 2, "activeEmployees": 2, "inactiveEmployees": 0,
  "departmentCount": 2,
  "departmentBreakdown": [ { "department": "Engineering", "count": 1 } ]
}
```

---

## Error Format

All errors follow:
```json
{ "message": "Human-readable error description" }
```
Validation errors additionally include:
```json
{ "message": "Validation failed", "errors": { "fieldErrors": { "email": ["Invalid email address"] } } }
```