# NextJS Forum

A **commercial-grade forum software** built with Next.js, styled to resemble classic vBulletin/phpBB forums. This application features a complete forum ecosystem with advanced administration, user management, and commercial-ready features.

## 🎯 Commercial Features

### **Core Forum Features**
- 🏠 **Forum Structure**: Categories, subjects, threads with full hierarchy
- 📝 **Rich Content**: Thread viewing with pagination and rich text posts
- 💬 **User Interaction**: Post reactions, thread subscriptions, user profiles
- 🔍 **Search & Discovery**: Advanced search functionality across all content
- 📱 **Responsive Design**: Mobile-first design that works on all devices

### **User Management System**
- 🔒 **Authentication**: Secure login/register with JWT tokens
- 👤 **User Profiles**: Avatars, signatures, bio, location, reputation system
- 👥 **User Groups**: Configurable user groups with granular permissions
- ⚖️ **Moderation**: User banning, warning system, activity tracking
- 📊 **Statistics**: Post counts, reputation points, join dates, last activity

### **Administration Panel**
- 🎛️ **Dashboard**: Real-time forum statistics and activity monitoring
- 👨‍💼 **User Management**: Ban/unban users, role management, bulk operations
- 📝 **Content Management**: Thread/post moderation, approval system
- 🎨 **Theme Customization**: Live theme editor with real-time preview
- ⚙️ **Settings Management**: Comprehensive forum configuration
- 📊 **Reporting System**: User reports, content moderation queue

### **Commercial-Ready Features**
- 🚀 **Installation Wizard**: Professional setup process like phpBB/vBulletin
- 💾 **Hybrid Storage**: JSON + Database for maximum flexibility
- 🔧 **Configuration Export/Import**: Easy forum migration and backup
- 📈 **Performance Optimized**: Caching, indexing, optimized queries
- 🔐 **Security**: Input validation, CSRF protection, rate limiting
- 🌐 **Multi-Database**: SQLite, PostgreSQL, MySQL support

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, CSS Modules
- **Backend**: Node.js API routes with comprehensive REST endpoints
- **Database**: PostgreSQL/MySQL/SQLite with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) with secure session management
- **Storage**: Hybrid JSON + Database approach for maximum flexibility
- **Containerization**: Docker & Docker Compose for easy deployment
- **Styling**: Custom vBulletin/phpBB-inspired theme with live customization
- **Performance**: Optimized queries, caching, and indexing

## 📋 Prerequisites

- **Node.js 18+** (LTS recommended)
- **Database**: PostgreSQL (recommended), MySQL, or SQLite
- **Docker & Docker Compose** (for easy PostgreSQL setup)
- **npm or yarn** package manager

## 🚀 Quick Start

### Option 1: Guided Installation (Recommended)

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/nextjs-forum.git
   cd nextjs-forum
   npm install
   ```

2. **Start Database (PostgreSQL)**
   ```bash
   docker-compose up -d postgres
   ```

3. **Run Installation Wizard**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000/install` and follow the setup wizard.

### Option 2: Manual Setup

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your settings:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/forum"
   JWT_SECRET="your-super-secret-jwt-key"
   USE_DATABASE_SETTINGS=true
   ```

2. **Database Setup**
   ```bash
   # Start PostgreSQL
   docker-compose up -d postgres

   # Setup database schema
   npx prisma db push

   # Seed with sample data
   npx prisma db seed
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Your Forum**
   - **Forum**: [http://localhost:3000](http://localhost:3000)
   - **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
   - **Login**: `admin@example.com` / `admin123`

## 🔧 Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run prisma:studio` - Open Prisma Studio for database management
- `npx prisma db seed` - Seed database with sample data
- `npx prisma db push` - Push schema changes to database

### Database Management

This project uses **Prisma ORM** with support for multiple databases:

**Schema Changes:**
1. Update the schema in `prisma/schema.prisma`
2. Push changes to database:
   ```bash
   npx prisma db push
   ```
3. Regenerate the Prisma Client:
   ```bash
   npx prisma generate
   ```

**Database Options:**
- **PostgreSQL** (recommended for production)
- **MySQL/MariaDB** (good alternative)
- **SQLite** (perfect for development)

### Hybrid Storage System

NextJS Forum uses a **hybrid storage approach**:

- **JSON Files**: Default settings and development configuration
- **Database**: User customizations and production settings
- **Automatic Fallback**: Graceful degradation when database unavailable

This ensures the forum works in any environment while providing commercial-grade scalability.

## 📁 Project Structure

```
nextjs-forum/
├── components/           # Reusable UI components
│   ├── admin/           # Admin panel components
│   ├── Layout.js        # Main layout wrapper
│   ├── Navigation.js    # Forum navigation
│   ├── Category.js      # Category display
│   └── ThemeProvider.js # Theme management
├── pages/               # Next.js pages and API routes
│   ├── api/            # Backend API endpoints
│   │   ├── admin/      # Admin management APIs
│   │   ├── auth/       # Authentication endpoints
│   │   ├── users/      # User management
│   │   └── install/    # Installation wizard APIs
│   ├── admin/          # Admin panel pages
│   ├── install/        # Installation wizard
│   ├── subjects/       # Forum subjects/categories
│   └── threads/        # Thread viewing
├── context/            # React context providers
│   └── AuthContext.js  # Authentication state
├── lib/                # Utility libraries
│   ├── prisma.js       # Database client
│   ├── auth.js         # Authentication helpers
│   └── settingsService.js # Hybrid settings management
├── prisma/             # Database schema and migrations
│   ├── schema.prisma   # Database schema
│   ├── seed.ts         # Database seeding
│   └── migrations/     # Database migrations
├── styles/             # Styling and themes
│   ├── globals.css     # Global styles
│   ├── Admin*.module.css # Admin panel styles
│   └── Install.module.css # Installation wizard styles
├── config/             # Configuration files
│   └── template-settings.json # Theme settings
├── docker-compose.yml  # Docker services
├── INSTALL.md          # Installation guide
└── README.md           # This documentation
```

## 🚀 Deployment

### Production Deployment

#### Docker (Recommended)
```bash
# Build and deploy with Docker
docker-compose up -d --build

# Or deploy individual services
docker-compose up -d postgres
docker-compose up -d app
```

#### Manual Deployment
```bash
# Build the application
npm run build

# Set production environment variables
export NODE_ENV=production
export DATABASE_URL="your-production-db-url"
export JWT_SECRET="your-production-secret"
export USE_DATABASE_SETTINGS=true

# Start production server
npm start
```

#### Platform-Specific Deployments

**Vercel:**
1. Connect your Git repository
2. Set environment variables in dashboard
3. Deploy automatically on push

**Railway/Render:**
1. Connect repository
2. Configure environment variables
3. Set build command: `npm run build`
4. Set start command: `npm start`

**VPS/Dedicated Server:**
1. Use PM2 for process management
2. Configure Nginx reverse proxy
3. Set up SSL certificates
4. Configure database backups

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/forum
JWT_SECRET=your-super-secure-secret-key
USE_DATABASE_SETTINGS=true
FORUM_INSTALLED=true
NEXTAUTH_URL=https://your-domain.com
```

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by classic vBulletin and phpBB forums
- Built with Next.js and modern web technologies
