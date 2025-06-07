# NextJS Forum

A modern forum application built with Next.js, styled to resemble classic vBulletin/phpBB forums. This application features categories, threads, posts, user profiles, and more.

## Features

- 🏠 Homepage with categories and subjects
- 📝 Thread viewing with pagination
- 💬 Rich text posts with basic formatting
- 👤 User profiles with avatars and signatures
- 🔍 Search functionality
- 🔒 User authentication (login/register)
- 📱 Responsive design

## Tech Stack

- **Frontend**: Next.js 14, React 18
- **Styling**: CSS Modules with custom vBulletin/phpBB theme
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nextjs-forum.git
   cd nextjs-forum
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database credentials and JWT secret.

3. **Start the development environment**
   ```bash
   # Start PostgreSQL and the app
   docker-compose up -d
   
   # Install dependencies
   npm install
   
   # Run database migrations
   npx prisma migrate dev
   
   # Start the development server
   npm run dev
   ```

4. **Open your browser**
   The application will be available at [http://localhost:3000](http://localhost:3000)

## Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run prisma:studio` - Open Prisma Studio for database management

### Database

This project uses Prisma as the ORM. To make changes to the database schema:

1. Update the schema in `prisma/schema.prisma`
2. Generate and apply migrations:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
3. Regenerate the Prisma Client:
   ```bash
   npx prisma generate
   ```

## Project Structure

```
nextjs-forum/
├── components/         # Reusable UI components
├── pages/             # Next.js pages and API routes
├── prisma/           # Prisma schema and migrations
├── public/           # Static files
├── styles/           # Global styles and CSS modules
├── .env.example      # Example environment variables
├── .gitignore        # Git ignore file
├── docker-compose.yml # Docker Compose configuration
├── Dockerfile        # Docker configuration
├── next.config.js    # Next.js configuration
├── package.json      # Project dependencies and scripts
└── README.md        # This file
```

## Deployment

### Docker (Recommended)

```bash
docker-compose up -d --build
```

### Vercel

1. Push your code to a Git repository
2. Import the repository on Vercel
3. Set up environment variables
4. Deploy!

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
