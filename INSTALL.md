# NextJS Forum Installation Guide

Welcome to NextJS Forum! This guide will help you install and set up your new forum software.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Database (SQLite, PostgreSQL, or MySQL)

### Installation Methods

#### Method 1: Guided Installation (Recommended)

1. **Download and Extract**
   ```bash
   # Download the latest release
   wget https://github.com/your-repo/nextjs-forum/releases/latest/download/nextjs-forum.zip
   unzip nextjs-forum.zip
   cd nextjs-forum
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Installation Wizard**
   ```bash
   npm run dev
   ```

4. **Open Your Browser**
   Navigate to `http://localhost:3000/install` and follow the guided setup wizard.

#### Method 2: Manual Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-repo/nextjs-forum.git
   cd nextjs-forum
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your settings:
   ```env
   DATABASE_URL="file:./dev.db"  # For SQLite
   # DATABASE_URL="postgresql://user:password@localhost:5432/forum"  # For PostgreSQL
   # DATABASE_URL="mysql://user:password@localhost:3306/forum"  # For MySQL
   
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Optional: Force database usage in development
   USE_DATABASE_SETTINGS=true
   ```

4. **Set Up Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Create Admin User**
   ```bash
   npm run create-admin
   ```

6. **Start the Forum**
   ```bash
   npm run dev
   ```

## 📋 Installation Wizard Steps

The guided installation wizard will walk you through:

### Step 1: Database Configuration
- Choose your database type (SQLite recommended for beginners)
- Configure connection settings
- Test database connectivity

### Step 2: Administrator Account
- Create your admin username and password
- Set admin email address
- Configure initial permissions

### Step 3: Site Configuration
- Set your forum name and description
- Configure contact information
- Choose timezone and locale settings

### Step 4: Forum Structure
- Create default categories and forums
- Set up initial forum structure
- Configure default permissions

### Step 5: Complete Installation
- Review all settings
- Finalize installation
- Access your new forum

## 🗄️ Database Options

### SQLite (Recommended for Small Sites)
- **Pros**: No setup required, perfect for development and small forums
- **Cons**: Not suitable for high-traffic sites
- **Setup**: Automatic, no configuration needed

### PostgreSQL (Recommended for Production)
- **Pros**: Excellent performance, full-featured, great for large forums
- **Cons**: Requires separate database server
- **Setup**: Install PostgreSQL and create a database

### MySQL/MariaDB
- **Pros**: Widely supported, good performance
- **Cons**: Requires separate database server
- **Setup**: Install MySQL/MariaDB and create a database

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `NEXTAUTH_SECRET` | Secret for authentication | Required |
| `NEXTAUTH_URL` | Base URL of your forum | `http://localhost:3000` |
| `USE_DATABASE_SETTINGS` | Use database for settings storage | `false` |
| `FORUM_INSTALLED` | Mark forum as installed | `false` |

### Storage Options

NextJS Forum uses a hybrid storage approach:

- **Development**: Settings stored in JSON files (`config/template-settings.json`)
- **Production**: Settings stored in database for better performance and reliability

## 🚀 Production Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Set Environment Variables
```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
USE_DATABASE_SETTINGS=true
FORUM_INSTALLED=true
```

### 3. Deploy
Deploy to your preferred hosting platform:
- **Vercel**: `vercel deploy`
- **Netlify**: Connect your repository
- **Docker**: Use the included Dockerfile
- **VPS**: Use PM2 or similar process manager

## 🔒 Security Considerations

### Production Checklist
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Set secure `NEXTAUTH_SECRET`
- [ ] Configure proper file permissions
- [ ] Enable database backups
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Review admin permissions

### Recommended Security Headers
Add these to your web server configuration:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 🆘 Troubleshooting

### Common Issues

**Installation wizard not loading**
- Check that port 3000 is available
- Ensure all dependencies are installed
- Check console for JavaScript errors

**Database connection errors**
- Verify database credentials
- Ensure database server is running
- Check firewall settings

**Permission errors**
- Ensure write permissions for `config/` directory
- Check file ownership and permissions
- Verify database user has necessary privileges

**Theme/styling issues**
- Clear browser cache
- Check for CSS compilation errors
- Verify theme settings are saved correctly

### Getting Help

- **Documentation**: Check the full documentation at `/docs`
- **Community**: Join our community forum
- **Issues**: Report bugs on GitHub
- **Support**: Contact support for commercial licenses

## 📚 Next Steps

After installation:

1. **Customize Your Forum**
   - Visit Admin Panel → Templates & Styling
   - Upload your logo and customize colors
   - Configure forum categories and permissions

2. **Set Up Email**
   - Configure SMTP settings for notifications
   - Test email delivery
   - Set up email templates

3. **Configure Permissions**
   - Set up user groups and permissions
   - Configure moderation settings
   - Set posting restrictions

4. **Optimize Performance**
   - Enable caching
   - Configure CDN for static assets
   - Set up database optimization

5. **Backup Strategy**
   - Set up automated database backups
   - Configure file backup system
   - Test restore procedures
