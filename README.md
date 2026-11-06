# Driveo API

Driveo is a REST API for vehicle rentals, categories, users, authentication, and bookings.

## Requirements

- Node.js 20 or newer
- MongoDB 7 or newer

## Setup

Install dependencies and create the environment file.

```bash
npm install
copy .env.example .env
```

Set `DATABASE_URL` and replace `JWT_SECRET` with a long random value before starting the application.

## Run

```bash
npm run dev
```

The API runs at `http://localhost:5555/api/v1` by default.

## API documentation

Swagger UI is available at `http://localhost:5555/api/v1/docs`. Protected endpoints accept a JWT bearer token through Swagger's **Authorize** dialog. Browser clients can also authenticate with the secure `jwt` cookie returned by the login endpoint.

Bookings use date-only values in `YYYY-MM-DD` format. The start and end dates define a rental period in whole days; times are not accepted. Vehicles and bookings reference city UUIDs. A different return city creates a one-way rental and uses the configured origin-to-destination route fee. When an administrator marks that booking as `COMPLETED`, the vehicle moves to the return city.

## Validation

```bash
npm run build
npm run lint
```
