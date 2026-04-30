# Quiz App Backend

This is the RESTful API for the Quiz Application, built with Node.js, Express, and MongoDB.

## Features
- Category management (Create, Read, Update, Delete)
- Question management with bulk upload support
- Authentication using JWT
- Image upload support via Multer
- Data seeding functionality

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript
- **Auth**: JSON Web Tokens (JWT) & BcryptJS

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or on Atlas)

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Configure your environment variables in `.env`.

### Scripts
- `npm run dev`: Start development server with `tsx watch`
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Start the production server
- `npm run seed`: Seed the database with initial categories and icons

## API Endpoints
- `/api/auth`: Authentication routes
- `/api/categories`: Category management
- `/api/questions`: Question management
- `/api/uploads`: File upload handling
