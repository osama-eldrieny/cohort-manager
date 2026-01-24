# Cohort Manager - Course Dashboard

A modern, feature-rich student management dashboard built with Node.js, Express, SQLite, and Chart.js. Track students, manage cohorts, monitor revenue, and view comprehensive analytics—all in one beautiful interface.

## 🎯 Features

### Core Management
- **Student Management**: Add, edit, delete, and search students
- **Multi-Cohort Support**: Manage 5 separate cohorts (Cohort 0, 1-Cradis, 1-Zomra, 2, 3)
- **Status Tracking**: Waiting list, Can't reach, Next Cohort, Standby, and active cohort statuses
- **Financial Tracking**: Total amount, paid amount, pending payments with privacy toggle
- **Contact Information**: Email, WhatsApp (clickable links), LinkedIn profiles, Location, Language

### Dashboard & Analytics
- **Overview Page**: 
  - Quick stats cards with revenue privacy controls
  - Cohort summaries with student counts and rev
  - Status Distribution, Revenue Status, and Student Location charts
  - Analytics section: Revenue by Cohort, Students by Cohort, Language Distribution, Payment Status

- **Students Page**: Complete student directory with search and multi-select status filtering

- **Cohort Pages**: Detailed cohort views with onboarding progress tracking (Cohort 2 & 3)

- **Status Pages**: Quick views of students by status

### Advanced Features
- **Onboarding Checklist**: Track 7-item checklist for active cohorts with progress percentage
- **Revenue Privacy**: Eye toggle icons to hide financial data
- **Multi-Select Filtering**: Filter students by multiple statuses simultaneously
- **Real-time Search**: Instant search across student names and emails
- **Data Export/Import**: Backup and restore student data as JSON

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cohort-manager.git
cd cohort-manager

# Instaldependencies
npm install

# Start the server
npm start
```

The dashboard will be available at `http://localhost:3002`

## 📋 Configuration

### Database
- **Type**: SQLite3
- **File**: `students.db`
- **Migration**: Automatic migration from `students.json` on first run

### API Endpoints

```
GET    /api/students          - Load all students
POST   /api/students          - Save students
DELETE /api/students/:id      - Delete student by ID
GET    /api/export            - Export all students as JSON
GET    /api/health            - Health check endpoint
```

## 🎨 User Interface

### Pages
1. **Overview**: Dashboard with stats, charts, and analytics
2. **Students**: Full student directory with filters
3. **Cohort 0-3**: Cohort-specific 
## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or highernrollment
5. **Can't Reach**: Students unable to contact
6. **Next Cohort**: Students for upcoming cohort
7. **Standby**: Students on standby status
8. **Settings**: Data management and export/import

## 📊 Data Structure

### Student Onpm start
```

Th
{
  id: "unique-id",
  name: "Student Name",
  email: "student@example.com",
  whatsapp: "+1234567890",
  linkedin: "https://linkedin.com/in/username",
  location: "Country",
  language: "English/Arabic",
  cohort: "Cohort 2",
  status: "Current Cohort",
  totalAmount: 1000,
  paidAmount: 500,
  remaining: 500,
  note: "Additional notes",
  paymentMethod: "Stripe/Instapay"
}
```

## 🔧 Development

### Project Structure
```
cohort-manager/
├── index.html              # Main HTML interface
├── app.js                  # Frontend JavaScript
├── server.js               # Express server
├── database.js             # SQLite database handler
├── style.css               # Styling
├── package.json            # Dependencies
└── README.md               # This file
```

### Key Technologies
- **Frontend**: HTML5, CSS3, Vanilla JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Database**: SQLite3 with atomic transactions
- **Charts**: Chart.js
- **Icons**: Font Awesomeess": "^4.18.2",
  "sqlite3": "^5.1.6",
  "body-parser": "^1.20.2",
  "cors": "^2.8.5"
}
```

## 🌐 Deployment

### Vercel (Recommended - Full Stack)
```bash
npm install -g vercel
vercel --prod
```

### Heroku
```bash
heroku create cohort-manager
git push heroku main
```

### GitHub Pages + Vercel Serverless (Backend)
Deploy frontend to GitHub Pages and backend to Vercel Functions.

## 🔐 Security Notes

- Data stored securely in SQLite database
- No authentication required (designed for internal team use)
- Revenue data can be hidden with privacy toggles
- All student data remains local
- Recommend using HTTPS if deployed to production

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3002 is in use
lsof -i :3002
```

### Database errors
```bash
# Reset database (WARNING: deletes all data)
rm students.db
npm start
```

## 📝 Usage Tips

### Bulk Oper- **Database**: SQLite3 with atoment data
2. Edit the JSON file
3. Use Import to upload the modified data

### Filtering
- **Students Page**: Multi-select status filter + text search
- **Cohort Pages**: Individual cohort view with search
- **Status Pages**: Quick filter by single status

## 🤝 Contributing

Contributions welcome! Submit issues and pull requests.

## 📄 License

MIT License - free for personal or commercial use.

## 📧 Support

For issues or questions, open an issue on GitHub.

---

**Version**: 2.0 | **Last Updated**: January 24, 2026
