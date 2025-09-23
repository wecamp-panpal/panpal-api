<header id="#header">
<p align="center" >
  <a name="header"></a>
  <img src="./public/bigLogo.svg" alt="Big Logo" />
</p>

<p  align="center" >
  A recipe sharing platform for food lovers and cooking enthusiasts.
</p>

<h1  align="center" >
  WeCamp Batch 8 - PanPal Frontend
</h1>
<p align="justify">
PanPal is a modern recipe sharing web application built with React, TypeScript, and Material-UI. This frontend application provides an intuitive interface for users to discover, create, and share delicious recipes with a vibrant cooking community. With features like user authentication, recipe management, advanced search and filtering, favorites system, step-by-step cooking instructions with images, and trending recipes, PanPal offers an engaging cooking experience for both beginners and professional chefs.
</p>
</header>

# PanPal API

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13.5-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-5.x-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Private-yellow.svg)]()

A robust and scalable REST API for PanPal - a modern recipe sharing platform that connects food enthusiasts worldwide.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Team](#team)

## Features

### Core Features

- **User Management**: Complete user registration, authentication, and profile management
- **Recipe Management**: Create, read, update, and delete recipes with detailed information
- **Recipe Categories**: Support for multiple recipe categories (Appetizer, Main Dish, Dessert, etc.)
- **Rating System**: Users can rate and review recipes with images
- **Comment System**: Interactive commenting on recipes
- **Favorite System**: Users can bookmark their favorite recipes
- **Image Upload**: Support for recipe and step images

### Technical Features

- **Authentication**: JWT-based authentication with Google OAuth integration
- **Caching**: Redis-based caching with in-memory fallback
- **Rate Limiting**: Multi-tier throttling (short/medium/long term)
- **Validation**: Comprehensive input validation using class-validator
- **Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Health Checks**: Application health monitoring endpoints
- **Error Handling**: Centralized error handling and logging
- **CORS**: Configurable Cross-Origin Resource Sharing
- **Compression**: Response compression for better performance

## Architecture

### Technology Stack

- **Framework**: NestJS (Node.js framework)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (with in-memory fallback)
- **Authentication**: JWT + Passport.js
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **File Upload**: Supabase integration
- **Containerization**: Docker & Docker Compose

### Project Structure

```
src/
├── base/                     # Base modules
│   ├── auth/                # Authentication module
│   └── image/               # Image upload module
├── core/                    # Core business modules
│   ├── user/               # User management
│   ├── recipe/             # Recipe management
│   ├── comment/            # Comment system
│   ├── rating/             # Rating system
│   └── favorite/           # Favorite system
├── common/                  # Shared utilities
│   ├── config/             # Configuration files
│   ├── middleware/         # Custom middleware
│   └── services/           # Shared services
└── main.ts                 # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 13.5 or higher
- Redis (optional, will fallback to in-memory cache)
- Docker & Docker Compose (for containerized deployment)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd panpal-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate deploy

   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000/api`
Swagger documentation will be available at `http://localhost:3000/docs`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/panpal_db"
DIRECT_URL="postgresql://user:password@localhost:5432/panpal_db"

# Server Configuration
API_SERVICE_PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"

# JWT Configuration
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

# Redis (Optional)
REDIS_URL="redis://localhost:6379"

# Cache Configuration
CACHE_TTL=300
CACHE_MAX_ITEMS=1000

# Rate Limiting
THROTTLE_SHORT_LIMIT=3
THROTTLE_MEDIUM_LIMIT=20
THROTTLE_LONG_LIMIT=100

# Supabase (for file uploads)
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-supabase-key"
SUPABASE_BUCKET="your-bucket-name"
```

## Database Schema

### Core Entities

#### User

- **id**: Unique identifier (UUID)
- **email**: User email (unique)
- **passwordHash**: Encrypted password
- **name**: User's display name
- **avatarUrl**: Profile picture URL
- **country**: User's country
- **role**: User role (default: "user")

#### Recipe

- **id**: Unique identifier (UUID)
- **title**: Recipe title
- **description**: Recipe description
- **cookingTime**: Estimated cooking time
- **category**: Recipe category (enum)
- **imageUrl**: Main recipe image
- **ratingAvg**: Average rating score
- **ratingCount**: Total number of ratings

#### Supporting Entities

- **Ingredient**: Recipe ingredients with quantities
- **Step**: Cooking steps with optional images
- **Rating**: User ratings with optional review images
- **Comment**: User comments on recipes
- **Favorite**: User's favorite recipes

### Database Relations

- Users can create multiple recipes
- Recipes have multiple ingredients and steps
- Users can rate, comment, and favorite recipes
- Soft delete support for ratings and comments

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Recipe Endpoints

- `GET /api/recipes` - Get all recipes (with pagination and filters)
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create new recipe (protected)
- `PUT /api/recipes/:id` - Update recipe (protected)
- `DELETE /api/recipes/:id` - Delete recipe (protected)

### User Endpoints

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (protected)

### Additional Endpoints

- Rating, Comment, and Favorite endpoints for each respective feature
- Image upload endpoints for recipe and step images
- Health check endpoint at `/api/health`

For complete API documentation, visit `/docs` when the server is running.

## Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start in debug mode

# Building
npm run build              # Build for production
npm run start:prod         # Start production build

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests
```

### Development Guidelines

1. **Code Style**: Follow the established ESLint and Prettier configurations
2. **Type Safety**: Maintain strict TypeScript typing
3. **Testing**: Write unit tests for new features
4. **Documentation**: Update API documentation for new endpoints
5. **Database**: Use Prisma migrations for schema changes

### Adding New Features

1. Create the module in the appropriate directory (`core/` or `base/`)
2. Implement the controller, service, and DTOs
3. Add proper validation and error handling
4. Write unit tests
5. Update the main `AppModule`
6. Document the new endpoints

## Testing

### Unit Tests

```bash
npm run test              # Run all unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Generate coverage report
```

### End-to-End Tests

```bash
npm run test:e2e          # Run E2E tests
```

### Test Structure

- Unit tests are located alongside source files (`.spec.ts`)
- E2E tests are in the `test/` directory
- Test configuration is in `jest.config.js`

## Deployment

### Docker Deployment

1. **Using Docker Compose** (Recommended)

   ```bash
   docker-compose up -d
   ```

2. **Building Docker Image**
   ```bash
   docker build -t panpal-api .
   docker run -p 3000:3000 panpal-api
   ```

### Production Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure production database
   - Set up Redis for caching
   - Configure proper CORS origins

2. **Database Setup**

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **Build and Start**
   ```bash
   npm run build
   npm run start:prod
   ```

### Health Monitoring

- Health check endpoint: `GET /api/health`
- Monitor application logs for errors
- Set up database connection monitoring
- Configure Redis connection monitoring

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Standards

- Follow TypeScript best practices
- Use meaningful variable and function names
- Write comprehensive tests
- Document new features
- Follow the established project structure

### Commit Guidelines

- Use conventional commit messages
- Include tests for new features
- Update documentation as needed

## Team

**WeCamp Batch 8 - Team PanPal**

| Name                     | GitHub                                                         |
| ------------------------ | -------------------------------------------------------------- |
| Hoàng Thị Minh Khuê      | [@htmkhue39](https://github.com/htmkhue39)                     |
| Trần Đồng Trúc Lam       | [@limelight-hub](https://github.com/limelight-hub)             |
| Võ Thị Hồng Minh         | [@vominh-source](https://github.com/vominh-source)             |
| Võ Lê Việt Tú            | [@voleviettu](https://github.com/voleviettu)                   |
| Hoàng Ngọc Quỳnh Anh     | [@quynhanhhoang572004](https://github.com/quynhanhhoang572004) |
| Phạm Ngọc Diễm (Advisor) | [@diem-github](https://github.com/diem-github)                 |
### Special Thanks

- **WeCamp Batch 8** - For providing the platform and mentorship
- **NestJS Community** - For the amazing framework and resources

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.

---

**Team PanPal** - Connecting food enthusiasts worldwide through the art of cooking.
