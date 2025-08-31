# PackTrack Pro 🧳

**Professional Travel Inventory Management System with User Accounts**

PackTrack Pro is a full-stack web application that helps travelers organize and track their packing inventory across multiple containers and trips. With user accounts, your data is stored securely in the cloud and accessible from any device.

![PackTrack Pro](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)
![SQLite](https://img.shields.io/badge/database-SQLite-blue.svg)

## ✨ Features

### 🔐 **User Authentication**
- Secure account registration and login
- Password hashing with bcrypt
- Session-based authentication
- Rate limiting for security

### 📦 **Inventory Management**
- Add items individually or in bulk
- Organize items by boxes/containers
- Categorize items (Clothing, Electronics, Personal Care, etc.)
- Add descriptions and notes
- Real-time search across all fields
- Advanced filtering and sorting

### 🔍 **Smart Search**
- Search by item name, box, category, or description
- Highlighted search results
- Category-based filtering
- Instant search as you type

### 📊 **Analytics & Export**
- Real-time stats (total items, boxes)
- Export data as JSON or CSV
- Import data from backups
- Print-friendly list format

### 🛠️ **Bulk Operations**
- Add multiple items at once
- Select and delete multiple items
- Bulk import from files
- Clear all data with confirmation

### 📱 **Responsive Design**
- Works on desktop, tablet, and mobile
- Touch-friendly interface
- Professional UI with animations
- Dark/light theme support

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

### Installation

1. **Clone or download** the project files to your computer

2. **Open terminal/command prompt** and navigate to the project folder:
   ```bash
   cd path/to/packtrack-pro
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Easy Setup** (recommended):
   ```bash
   npm run setup
   ```
   This will automatically initialize the database and start the server.

   **OR Manual Setup**:
   ```bash
   npm run init    # Initialize database
   npm start       # Start server
   ```

5. **Open your web browser** and go to:
   ```
   http://localhost:3000
   ```

6. **Verify everything works** (optional):
   ```bash
   npm run test    # Run comprehensive tests
   ```

That's it! 🎉 Your PackTrack Pro server is now running.

## 📖 Usage Guide

### Getting Started
1. **Create an Account**: Click "Create one here" on the login page
2. **Fill in your details**: Name, email, and secure password
3. **Start Adding Items**: Use the "Add Items" tab to add your first item

### Demo Account
For testing purposes, you can use:
- **Email**: `demo@packtrack.com`
- **Password**: `demo123`

### Adding Items
- **Single Item**: Fill out the form and click "Add Item"
- **Bulk Add**: Use "Bulk Add" to add multiple items to one box
- **Categories**: Choose from predefined categories or leave as "Uncategorized"

### Finding Items
- **Search Tab**: Type any keyword to find items instantly
- **Filters**: Use category and box filters to narrow results
- **Manage Tab**: View all items with sorting and bulk selection

### Exporting Data
- **JSON**: Full backup with all data fields
- **CSV**: Spreadsheet-friendly format
- **Print**: Physical list for travel

## 🛠️ Development

### Running in Development Mode
```bash
npm run dev
```
This uses `nodemon` to automatically restart the server when files change.

### Project Structure
```
packtrack-pro/
├── index.html          # Main frontend file
├── styles.css          # All CSS styling
├── script.js           # Frontend JavaScript
├── server.js           # Express server and API
├── init-db.js          # Database initialization
├── package.json        # Node.js dependencies
├── README.md           # This file
└── packtrack.db        # SQLite database (created after first run)
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

#### Items Management
- `GET /api/items` - Get user's items
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/bulk` - Bulk create items
- `DELETE /api/items/bulk` - Bulk delete items

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Session Management**: Secure cookie-based sessions
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **CSRF Protection**: Session-based security
- **Helmet.js**: Security headers

## 🌐 Deployment

### Environment Variables
For production deployment, set these environment variables:

```bash
NODE_ENV=production
SESSION_SECRET=your-super-secure-random-string
PORT=3000
```

### Recommended Hosting Platforms
- **Railway** - Easy Node.js hosting
- **Heroku** - Popular cloud platform
- **DigitalOcean** - Virtual private servers
- **AWS/Google Cloud** - Enterprise solutions

### Database Backups
The SQLite database file (`packtrack.db`) contains all your data. For production:
1. Regular automated backups of this file
2. Consider upgrading to PostgreSQL for larger scale
3. Implement database migrations for schema changes

## 🐛 Troubleshooting

### Common Issues

**Cannot connect to server**
- Make sure Node.js is installed: `node --version`
- Check if port 3000 is already in use
- Run `npm install` to ensure dependencies are installed

**Database errors**
- Delete `packtrack.db` and run `npm run init` again
- Check file permissions in the project directory

**Login/Registration not working**
- Clear browser cookies and try again
- Check browser console for JavaScript errors
- Ensure server is running without errors

**Items not saving**
- Check browser network tab for API errors
- Verify you're logged in (refresh the page)
- Check server logs for database errors

### Getting Help
1. Check the browser console for errors (F12)
2. Look at server logs in terminal
3. Try the demo account to verify functionality
4. Clear browser cache and cookies

## 📝 Changelog

### Version 2.0.0
- ✅ Added user authentication system
- ✅ Cloud-based data storage with SQLite
- ✅ RESTful API with Express.js
- ✅ Session management and security
- ✅ Professional UI redesign
- ✅ Bulk operations and import/export
- ✅ Mobile-responsive design

### Version 1.0.0
- ✅ Local storage-based inventory
- ✅ Basic item management
- ✅ Search and filter functionality
- ✅ Export capabilities

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

This is an open-source project! Feel free to:
- Report bugs or suggest features
- Improve the code or documentation
- Add new functionality
- Share with other travelers

---

**Happy Packing!** 🎒✈️

*PackTrack Pro - Never lose track of your travel essentials again.*