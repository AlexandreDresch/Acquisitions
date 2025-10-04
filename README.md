# Acquisitions API - Proof of Concept (PoC)

A modern, secure, and scalable Node.js API built with **TypeScript**, designed as a Proof of Concept for an acquisition and deal management platform. It features robust authentication, role-based access control, and comprehensive security measures using a cutting-edge, developer-first security stack.

---

## 🚀 Tech Stack

This project is built on a high-performance, developer-friendly stack:

| Technology                          | Purpose                                                                                                                                    |
| :---------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **Node.js** & **Express.js**        | High-performance JavaScript runtime and minimal, flexible web application framework.                                                       |
| **TypeScript**                      | Provides full type safety throughout the application for reliability.                                                                      |
| **Neon Postgres** & **Drizzle ORM** | Fully managed, serverless PostgreSQL database paired with a lightweight, TypeScript-first ORM for type-safe queries and schema migrations. |
| **Arcjet**                          | A developer-first security layer for real-time **bot protection**, **rate limiting**, and defense against common attacks.                  |
| **Zod**                             | TypeScript schema validation library ensuring runtime type safety and data integrity for all API inputs.                                   |
| **Docker**                          | Containerization for consistent development, testing, and production environments.                                                         |

---

## ✨ Features

### 🔐 Security & Authentication

- **JWT-based Authentication**: Secure signup, signin, and signout workflows with JSON Web Tokens.
- **Role-Based Access Control (RBAC)**: Implemented admin and user roles with permission middleware for secure operations.
- **Arcjet Integration**: Bot protection, configurable rate limiting, and real-time security shielding.
- **Request Validation**: Comprehensive API input validation using **Zod** schemas to ensure data integrity.

### 🎯 Acquisition & Deal Management

- **Listing Management**: CRUD operations for creating, browsing, and managing product/service listings.
- **Deal Workflow**: Complete deal lifecycle from initial offer submission to final completion.
- **Offer Management**: Functionality to make offers, and for sellers to accept, reject, or track offers.
- **Real-time Messaging**: Built-in communication threads between buyers and sellers within a deal.
- **Deal Status Tracking**: Monitor deal progress with multiple status states (`pending`, `accepted`, `completed`, `rejected`, `cancelled`).

### 🗄️ Database & Data Management

- **PostgreSQL Integration**: Robust data layer with managed schema changes via **Drizzle ORM migrations**.
- **User Management**: Complete **CRUD** operations for user accounts, enabling easy administration.

### 🛠️ Development Experience

- **TypeScript**: Full type safety throughout the application.
- **Hot Reload**: Development server automatically restarts on file changes for rapid iteration.
- **ESLint + Prettier**: Enforced code linting and formatting rules for cleaner, consistent code.
- **Structured Logging**: **Winston**-based logging throughout the application for better monitoring and debugging.

### 🧪 Testing & Quality

- **Jest Testing Framework**: Full framework for unit, integration, and HTTP endpoint testing with **SuperTest**.
- **Code Coverage**: Comprehensive test coverage reports.
- **Health Monitoring**: System health check endpoints.

### 🐳 Deployment & Operations

- **Docker Support**: Full containerization for development and production.
- **Environment Management**: Consistent configuration across environments.
- **Scalable Architecture**: Designed for cloud-native deployment.

---

## 📦 Installation

### Prerequisites

- **Node.js** (version 18+)
- **PostgreSQL** database (or an external provider like Neon Postgres)
- **Docker** (optional, for containerized development/deployment)

### Local Development

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/AlexandreDresch/Acquisitions.git
    cd acquisitions
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    ```bash
    cp .env.EXAMPLE .env
    ```

    Edit the newly created `.env` file with your configuration.

4.  **Run database migrations:**
    First, generate the migration files from your schema, then apply them.

    ```bash
    npm run db:generate
    npm run db:migrate
    ```

5.  **Start the development server (with hot reload):**
    ```bash
    npm run dev
    ```

### Docker Development

You can run the entire environment inside a containerized setup:

```bash
# Start development environment (builds image and runs container)
npm run dev:docker

# Production build with Docker
npm run prod:docker
```

## 🎯 Available Scripts

| Command                | Description                                                     |
| :--------------------- | :-------------------------------------------------------------- |
| `npm start`            | Start the **production** server.                                |
| `npm run dev`          | Start the **development** server with hot reload (**nodemon**). |
| `npm run build`        | Compile TypeScript to JavaScript.                               |
| `npm test`             | Run all tests with **Jest** and report coverage.                |
| `npm run lint`         | Run **ESLint** to check for code quality issues.                |
| `npm run lint:fix`     | Fix **ESLint** issues automatically.                            |
| `npm run format`       | Format code using **Prettier**.                                 |
| `npm run format:check` | Check code formatting without applying changes.                 |
| `npm run db:generate`  | Generate **Drizzle ORM** database migrations.                   |
| `npm run db:migrate`   | Apply database migrations to the connected database.            |
| `npm run db:studio`    | Open **Drizzle Studio** for visual database browsing.           |

---

## 🔐 API Endpoints

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint        | Description                      | Access        |
| :----- | :-------------- | :------------------------------- | :------------ |
| `POST` | `/auth/signup`  | User registration.               | Public        |
| `POST` | `/auth/signin`  | User login (returns JWT cookie). | Public        |
| `POST` | `/auth/signout` | User logout.                     | Authenticated |

### Users

| Method   | Endpoint     | Description              | Access        |
| :------- | :----------- | :----------------------- | :------------ |
| `GET`    | `/users`     | Get a list of all users. | Admin Only    |
| `GET`    | `/users/:id` | Get user by ID.          | Authenticated |
| `PUT`    | `/users/:id` | Update user details.     | Authenticated |
| `DELETE` | `/users/:id` | Delete user account.     | Authenticated |

### Acquisition & Deal Management

#### Listings

| Method   | Endpoint              | Description                          | Access        |
| :------- | :-------------------- | :----------------------------------- | :------------ |
| `POST`   | `/deals/listings`     | Create a new listing.                | Authenticated |
| `GET`    | `/deals/listings`     | Get all listings (supports filters). | Public        |
| `GET`    | `/deals/listings/my`  | Get current user's listings.         | Authenticated |
| `GET`    | `/deals/listings/:id` | Get specific listing details.        | Public        |
| `PUT`    | `/deals/listings/:id` | Update an existing listing.          | Owner Only    |
| `DELETE` | `/deals/listings/:id` | Delete an existing listing.          | Owner Only    |

#### Deals

| Method  | Endpoint                    | Description                            | Access           |
| :------ | :-------------------------- | :------------------------------------- | :--------------- |
| `POST`  | `/deals/deals`              | Create a new deal/offer on a listing.  | Authenticated    |
| `GET`   | `/deals/deals`              | Get user's deals (as buyer or seller). | Authenticated    |
| `GET`   | `/deals/deals/:id`          | Get specific deal details.             | Participant Only |
| `PUT`   | `/deals/deals/:id`          | General update (e.g., status change).  | Participant Only |
| `PATCH` | `/deals/deals/:id/accept`   | Accept a pending deal/offer.           | Seller Only      |
| `PATCH` | `/deals/deals/:id/complete` | Mark deal as completed.                | Seller Only      |

#### Deal Messages

| Method | Endpoint                    | Description                        | Access           |
| :----- | :-------------------------- | :--------------------------------- | :--------------- |
| `POST` | `/deals/deals/:id/messages` | Send message in deal conversation. | Participant Only |
| `GET`  | `/deals/deals/:id/messages` | Get deal conversation history.     | Participant Only |

### Health

| Method | Endpoint  | Description                   | Access |
| :----- | :-------- | :---------------------------- | :----- |
| `GET`  | `/health` | System health check endpoint. | Public |

---

## 🎯 Deal Workflow

The acquisition system follows a structured workflow:

1.  **Listing Creation** → Sellers create listings with details and pricing.
2.  **Offer Submission** → Buyers submit offers on active listings.
3.  **Deal Negotiation** → Parties communicate via built-in messaging.
4.  **Deal Acceptance** → Seller accepts one offer (automatically rejects others).
5.  **Deal Completion** → Seller marks the deal as completed.
6.  **Status Tracking** → Real-time status updates throughout the process.

### Deal Status Flow

```text
pending → accepted → completed
    ↓
 rejected
    ↓
cancelled
```

## 🛡️ Security Features

* **Rate Limiting** - Configurable limits based on user roles, enforced by **Arcjet**.
* **Bot Detection** - **Arcjet**-powered bot protection shielding your API.
* **Input Validation** - **Zod** schema validation for all request bodies and parameters.
* **JWT Tokens** - Secure authentication with HTTP-only cookies.
* **CORS & Helmet** - Security headers and cross-origin protection.
* **Password Hashing** - **bcryptjs** for secure password storage.
* **Deal Authorization** - Strict ownership and participation checks for all deal operations.

---

## 🧪 Testing

The project uses **Jest** for testing, including unit, service, and integration tests for HTTP endpoints using **SuperTest**.

```bash
# Run all tests and generate a coverage report
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests for a specific file
npm test -- tests/unit/services/auth.service.test.ts
```

---

## 📊 Code Quality

Code quality is enforced using ESLint and Prettier.

```bash
# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
| :--- | :--- |
| **Database Connection** | Ensure PostgreSQL is running, check `DATABASE_URL` in `.env`, and run `npm run db:migrate`. |
| **JWT Errors** | Verify `JWT_SECRET` is set in environment variables and check token expiration settings. |
| **Arcjet Configuration** | Ensure `ARCJET_KEY` is set in `.env` and verify network connectivity to Arcjet services. |
| **Deal Authorization** | Check middleware to ensure users can only access their own deals/listings and verify role permissions for sensitive operations. |