# 🏠 Green University Hostel Service Hub

![Project Banner](https://via.placeholder.com/1200x400?text=Green+University+Hostel+Service+Hub)

A complete **hostel management and service automation platform** designed for Green University hostel operations. The system digitizes student management, meal tracking, fee calculation, attendance monitoring, complaints, leave applications, and administrative activities through a modern web-based interface.

Built with **React, Vite, TypeScript, Tailwind CSS, and Supabase**, this project provides a secure, scalable, and user-friendly solution for managing university hostel services efficiently.

---

## 🌟 Project Overview

Traditional hostel management systems often depend on manual records, paper-based applications, and disconnected communication channels. 

**Green University Hostel Service Hub** solves these problems by providing a centralized platform where:

- Students can manage hostel-related activities digitally
- Administrators can monitor and control hostel operations
- Employees can manage assigned tasks efficiently
- Financial and meal records are maintained automatically
- Notifications and updates are delivered instantly

---

# 🚀 Key Features

## 🔐 Secure Authentication & Role Management

- Secure user login system
- Database-based authentication verification
- Prevents unauthorized/demo account access
- Role-based access control:
  - 👨‍🎓 Student
  - 👨‍💼 Admin
  - 👷 Employee
- Protected dashboard access based on user permissions

---

# 👨‍🎓 Student Features

### 📊 Student Dashboard

Students can view:

- Personal profile information
- Hostel room details
- Current meal status
- Monthly fees
- Payment history
- Notifications

---

### 🍛 Meal Management

- Daily meal tracking
- Meal cancellation system
- Automatic meal charge calculation
- Monthly meal summary
- Meal history tracking

---

### 📝 Leave Application

Students can:

- Submit leave requests
- View application status
- Track approval/rejection updates

---

### 📢 Complaint Management

Students can:

- Submit hostel complaints
- Track complaint status
- Receive updates from administration

---

### 💳 Fee Management

Students can check:

- Monthly hostel fees
- Meal charges
- Paid amount
- Due amount
- Payment history
- Last payment information

---

# 👨‍💼 Admin Features

Administrators can:

- Manage students
- Manage employees
- Control hostel information
- Approve/reject leave requests
- Handle complaints
- Manage payments
- Monitor hostel activities
- Generate reports

---

# 👷 Employee Features

Employees can:

- View assigned tasks
- Update service status
- Manage hostel operations
- Report issues

---

# 🔔 Notification System

- Real-time notification support
- Important announcements
- Leave updates
- Complaint updates
- Hostel service alerts

---

# 🛠️ Technology Stack

## Frontend

| Technology | Purpose |
|------------|---------|
| React 19 | User Interface |
| Vite | Development & Build Tool |
| TypeScript | Type Safety |
| Tailwind CSS | UI Styling |
| Lucide Icons | Interface Icons |

---

## Backend & Database

| Technology | Purpose |
|------------|---------|
| Supabase | Backend Platform |
| PostgreSQL | Database |
| Supabase Authentication | User Authentication |
| Row Level Security (RLS) | Database Protection |

---

# 🏗️ System Architecture

```
User
 |
 |
React Frontend
 |
 |
Supabase API
 |
 |
PostgreSQL Database
 |
 |
Authentication + Security Rules
```

---

# 📁 Project Structure

```
green-university-hostel-service-hub/

│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── constants.ts
│   └── App.tsx
│
├── public/
│
├── supabase/
│   └── supabase-setup.sql
│
├── .env.example
├── package.json
├── vite.config.ts
└── README.md
```

---

# ⚙️ Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/sheikh-17/green-university-hostel-service-hub.git
```

Move into project directory:

```bash
cd green-university-hostel-service-hub
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url

VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 4. Setup Database

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run:

```
supabase-setup.sql
```

This will create:

- Users table
- Hostel information tables
- Meal management tables
- Payment tables
- Complaint tables
- Leave application tables
- Required database relationships

---

## 5. Start Development Server

```bash
npm run dev
```

Application will run on:

```
http://localhost:5173
```

---

# 🔒 Security Implementation

The system includes:

✅ Database-based authentication  
✅ Role-based authorization  
✅ Protected routes  
✅ Supabase Row Level Security (RLS)  
✅ Environment variable protection  
✅ Input validation  
✅ Restricted dashboard access  

Users cannot access the system without valid database credentials.

---

# 📸 Screenshots

(Add screenshots here)

Example:

```
/screenshots

├── login.png
├── student-dashboard.png
├── admin-dashboard.png
├── meal-management.png
└── payment-history.png
```

---

# 🌐 Deployment

Frontend deployment:

- Netlify / Vercel

Backend:

- Supabase Cloud

Production environment requires:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

---

# 📌 Future Improvements

Planned features:

- Online payment gateway integration
- Mobile application version
- AI-based hostel analytics
- QR-based meal verification
- Advanced reporting dashboard
- Email and SMS notifications
- Automated attendance tracking

---

# 🤝 Contribution

Contributions are welcome.

Steps:

1. Fork this repository
2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push branch

```bash
git push origin feature-name
```

5. Create Pull Request

---

# 👨‍💻 Developer

**Rasel Sheikh**

Computer Science & Engineering  
Green University of Bangladesh

GitHub:
https://github.com/sheikh-17

---

# 📄 License

This project is licensed under the MIT License.

---

⭐ If you find this project useful, consider giving it a star!