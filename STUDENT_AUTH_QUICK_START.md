# 🎓 Student Authentication - Quick Reference Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Create Database Tables (1 minute)
1. Log in to Supabase dashboard
2. Go to SQL Editor
3. Copy all SQL from `sql_student_setup.sql`
4. Execute in Supabase SQL Editor

### Step 2: Set Student Passwords (2 minutes)
```bash
# Get a student's ID from students table first
curl -s http://localhost:3002/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"osama.eldrieny@gmail.com","password":"Al7amdulla@8206"}' \
  | jq '.sessionToken'

# Then set password for student (replace with actual token)
curl -X POST http://localhost:3002/api/admin/set-student-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token-from-above>" \
  -d '{
    "studentId": "1",
    "email": "student@example.com",
    "password": "Welcome123"
  }'
```

### Step 3: Test Student Login (2 minutes)
1. Open `http://localhost:3002/login.html`
2. Click "Student" tab
3. Enter email: `student@example.com`
4. Enter password: `Welcome123`
5. Click Login
6. See beautiful student dashboard! 🎉

---

## 📋 Student Dashboard Contents

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│    Welcome, Student Name                  Logout    │
│    Cohort: Cohort 1                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Email    │  │  Figma   │  │ Cohort   │          │
│  │student@  │  │ figma@   │  │ Cohort 1 │          │
│  │email.com │  │email.com │  │          │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Amount Paid        │ Remaining Balance       │  │
│  │ $250 / $500 (50%)  │ $250                   │  │
│  │ ████████░░░░░░░░░░ │                        │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📚 Course Resources                                │
│  ├─ Design System Documentation                     │
│  ├─ Figma Workspace                                │
│  └─ Project Guidelines                             │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🎬 Recorded Videos                                 │
│  ├─ Welcome to the Course                           │
│  ├─ Module 1: Foundations                          │
│  └─ Q&A Session                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 Key Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/login.html` | GET | Dual login page | None |
| `/api/student/login` | POST | Student login | None |
| `/api/student/verify` | POST | Verify session | Token |
| `/api/student/logout` | POST | Student logout | Token |
| `/api/admin/set-student-password` | POST | Set student password | Admin Token |
| `/student-dashboard.html` | GET | Student dashboard | Session Required |

---

## 💾 Database Tables

### `student_passwords`
Stores login credentials for students
```
- id: UUID
- student_id: TEXT (links to students table)
- email: TEXT
- password_hash: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### `student_sessions`
Manages active student sessions (24-hour expiration)
```
- id: UUID
- student_id: TEXT
- session_token: TEXT
- created_at: TIMESTAMP
- expires_at: TIMESTAMP
- is_active: BOOLEAN
```

---

## 🎯 How It Works

### Login Flow
```
1. Student enters email & password in login.html
2. POST request to /api/student/login
3. Server verifies credentials against student_passwords table
4. If valid, creates session token and returns to frontend
5. Frontend stores token in localStorage
6. Student redirected to student-dashboard.html
7. Dashboard fetches cohort resources and displays to student
```

### Dashboard Loading Flow
```
1. student-dashboard.html loads
2. Checks for student_session_token in localStorage
3. Fetches student info from localStorage
4. Loads cohort resources from /api/cohorts endpoint
5. Filters and displays only student's cohort resources
6. Shows payment progress, info cards, links, and videos
```

### Logout Flow
```
1. Student clicks Logout button
2. Sends POST to /api/student/logout with token
3. Server invalidates session in database
4. Frontend clears localStorage
5. Student redirected to login.html
```

---

## ✅ Checklist

- [ ] SQL tables created in Supabase
- [ ] Server running (`node server.js`)
- [ ] At least one student password set
- [ ] Student login tested
- [ ] Dashboard displays student info correctly
- [ ] Resources and videos visible
- [ ] Logout works

---

## 🎨 Customization Tips

### Change Dashboard Colors
Edit `student-dashboard.html` CSS:
```css
:root {
  --primary: #667eea;        /* Change main color */
  --primary-dark: #764ba2;   /* Change dark accent */
  --success: #10b981;         /* Change success color */
}
```

### Add Custom Info Card
Add to student-dashboard.html:
```html
<div class="info-card">
  <div class="info-card-icon"><i class="fas fa-star"></i></div>
  <div class="info-card-label">Custom Field</div>
  <div class="info-card-value" id="customField">Value</div>
</div>
```

Then in JavaScript:
```javascript
document.getElementById('customField').textContent = 'Your value';
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid email or password" | Check student_passwords table exists and password was set |
| 404 on student-dashboard.html | Verify file exists in project root |
| Resources not showing | Check cohort name matches exactly (case-sensitive) |
| Session expired | Session lasts 24 hours, user needs to login again |
| "No session token" | Student needs to login first |

---

## 📊 Example Data Setup

### Create Test Student (Supabase)
```sql
-- Add student to students table (if not exists)
INSERT INTO public.students (id, name, email, cohort, figma_email, total_amount, paid_amount, remaining)
VALUES ('100', 'Test Student', 'test@example.com', 'Cohort 1', 'test@figma.com', 500, 250, 250);

-- Set password via API (see Step 2 above)
-- OR via SQL (not recommended for production):
INSERT INTO public.student_passwords (student_id, email, password_hash)
VALUES ('100', 'test@example.com', 'TestPassword123');
```

### Test Login
```bash
curl -X POST http://localhost:3002/api/student/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123"}'
```

---

## 🚀 Production Checklist

- [ ] Enable HTTPS
- [ ] Add password hashing (bcrypt)
- [ ] Set up email notifications
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Use httpOnly cookies
- [ ] Set up monitoring/logging
- [ ] Test with real student data
- [ ] Deploy to production

---

## 📞 Need Help?

1. Check browser console for errors (F12)
2. Check server logs: `cat server.log`
3. Verify database tables exist in Supabase
4. Review error response from API
5. Check documentation files included

---

## 🎉 You're All Set!

Your students can now:
✅ Login with email and password
✅ View personalized dashboard
✅ Access their cohort's resources
✅ Watch recorded videos
✅ Check payment status
✅ Logout securely

Enjoy! 🚀
