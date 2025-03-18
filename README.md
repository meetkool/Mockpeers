# SaaS Starter with Nextauth, Razorpay, Prisma, and PostgreSQL

This is a starter template for Next.js projects with built-in authentication, Razorpay integration, Prisma ORM, and PostgreSQL (via Docker).

## Features

- Next.js 13+ with App Router
- NextAuth for authentication
- Razorpay integration for payments
- Prisma ORM for database management
- PostgreSQL database (containerized with Docker)
- Tailwind CSS for styling
- TypeScript support

## Prerequisites

- Node.js 14+ and npm
- Docker and Docker Compose

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   ```

2. Install dependencies:
   ```bash
   cd your-repo-name
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your details.

4. Start the PostgreSQL database:
   ```bash
   docker-compose up -d
   ```
5. Make .env file same as example env file, if usind docker for database kepp the DATABASE_URL same as example

6. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```
prisma 
   1. For safe schema updates: ` npm run db:update`
   2. To backup database: `npm run db:backup`
   3. To restore database: `npm run db:restore`
   4. To deploy migrations: ` npm run db:full-deploy`

## License

This project is open source and available under the [MIT License](LICENSE).





Based on the provided files, here are the main API and page routes in the application:

API Routes:
1. Authentication Related:
- `/api/auth/[...nextauth]` - NextAuth authentication handling
- `/api/auth/register` - User registration
- `/api/auth/verify-phone/send` - Send phone verification code
- `/api/auth/verify-phone/verify` - Verify phone code

2. Admin Related:
- `/api/admin/schedule/bulk` - Bulk schedule creation for admins
- `/api/users` - User management (admin only)

3. Schedule/Meeting Related:
- `/api/schedule` - CRUD operations for schedules
- `/api/schedule/available` - Get available schedules
- `/api/schedule/book` - Book a schedule
- `/api/schedule/join` - Join a scheduled meeting
- `/api/schedule/status-update` - Update schedule statuses
- `/api/meetings/[id]` - Get meeting details
- `/api/meetings/[id]/start` - Start a meeting
- `/api/meetings/[id]/end` - End a meeting

4. User Related:
- `/api/user/profession` - User profession management
- `/api/order` - Payment order creation
- `/api/verify` - Payment verification

Page Routes:
1. Public Pages:
- `/` - Home page
- `/login` - Login page
- `/get-started` - Getting started page

2. Admin Pages:
- `/admin` - Admin dashboard
- `/admin/login` - Admin login
- `/admin/users` - User management
- `/admin/interviews` - Interview management
- `/admin/schedule` - Schedule management
- `/admin/analytics` - Analytics
- `/admin/feedback` - Feedback management
- `/admin/settings` - Admin settings

3. User Dashboard:
- `/dashboard` - User dashboard
- `/dashboard/interviews` - User interviews
- `/dashboard/instructions` - Instructions
- `/dashboard/profile` - User profile


```mermaid
graph TD
    A[User Logs In] --> B{Phone Verified?}
    B -->|Yes| C[Access Dashboard]
    B -->|No| D[Redirect to Verify Phone Page]
    D --> E[Enter Phone Number]
    E --> F[Send Verification Code]
    F --> G[Enter Verification Code]
    G --> H{Code Valid?}
    H -->|Yes| I[Update User as Verified]
    I --> C
    H -->|No| G
```