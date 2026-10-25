# Nourish — Personal Calorie Tracker

CalTrac is a backend application for tracking meals, monitoring daily nutrition, setting health goals, and reviewing nutrition reports. It integrates Google Gemini for AI-assisted nutrition extraction from images and conversational nutrition assistance.

## Features

- **Authentication:** User registration and login with password hashing and JWT-based authentication.
- **Food entries:** Create, retrieve, update, and delete meal entries.
- **Filtering and pagination:** Retrieve entries by date, meal type, or date range with pagination.
- **Health goals:** Set daily calorie, protein, carbohydrate, and fat targets, plus weight goals.
- **Nutrition reports:** Daily and weekly summaries, macro totals, micronutrient summaries, and goal comparisons.
- **AI nutrition extraction:** Upload a food photo or nutrition-label image to extract or estimate nutrition values for review.
- **PDF food diary import:** Preview food entries extracted from a PDF and import validated entries.
- **AI chat:** Ask nutrition questions, retrieve goal/intake information, request weekly summaries, check goal progress, and preview meal details before submitting them for saving.
- **Multi-user data isolation:** Protected operations use the authenticated user's ID.

> Nutrition estimates from food images or descriptions may be inaccurate. Review values before saving them. CalTrac is not a substitute for professional medical advice.

## Technology stack

- Java 22
- Spring Boot 3.5.16
- Spring Web and Spring Security
- JWT authentication
- Spring Data MongoDB and MongoDB Atlas
- Google Gemini API (`com.google.genai`)
- Apache PDFBox
- Maven
- Postman for API testing

## Prerequisites

- JDK 22
- Maven (or Maven Wrapper if included in the repository)
- MongoDB Atlas cluster or another compatible MongoDB deployment
- Google Gemini API key

## Configuration

The relevant `src/main/resources/application.properties` settings are:

```properties
spring.application.name=CalTrac
spring.data.mongodb.uri=${MONGODB_URI}
spring.data.mongodb.database=calorie_tracker

jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION:86400000}

gemini.api.key=${GEMINI_API_KEY}
gemini.api.model=gemini-3.8-flash

spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=6MB
```

Set these environment variables in your IDE run configuration or shell:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection URI. Keep credentials private. |
| `JWT_SECRET` | Secret used by the application to sign JWTs. Use a strong, random secret. |
| `JWT_EXPIRATION` | Token lifetime in milliseconds; defaults to `86400000` (24 hours). |
| `GEMINI_API_KEY` | Google Gemini API key. |

In IntelliJ IDEA, configure them under **Run → Edit Configurations → Environment variables**. Never publish real values in README files, screenshots, source code, or Git commits.

## Run locally

1. Clone the repository and open the project directory.
2. Configure the environment variables above.
3. Ensure MongoDB Atlas permits connections from your development IP address and the connection URI is valid.
4. From the project root, run:

   ```bash
   mvn clean test
   ```

5. Start the application:

   ```bash
   mvn spring-boot:run
   ```

   Alternatively, run the `CaltracApplication` main class from your IDE.

6. The API is available at `http://localhost:8080`.

If the repository includes Maven Wrapper scripts, use `mvnw.cmd` on Windows or `./mvnw` on macOS/Linux instead of an installed Maven command.

## Authentication

Register or log in to obtain a JWT. For protected endpoints, send the token in this header:

```http
Authorization: Bearer <JWT_TOKEN>
```

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Log in and obtain a token |

Use the request fields expected by the current authentication controller.

## API reference

All routes below are relative to `http://localhost:8080`. Protected endpoints require a valid bearer token unless otherwise stated.

### Food entries

Base path: `/api/food-entries`

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/food-entries` | Create a food entry |
| `GET` | `/api/food-entries` | List entries with pagination and optional filters |
| `PUT` | `/api/food-entries/{id}` | Update an entry owned by the authenticated user |
| `DELETE` | `/api/food-entries/{id}` | Delete an entry owned by the authenticated user |

Supported list query parameters include:

- `page` — zero-based page index
- `size` — page size
- `date` — date in `YYYY-MM-DD` format
- `mealType` — meal category
- `startDate` and `endDate` — inclusive date range

Example:

```http
GET /api/food-entries?page=0&size=10&startDate=2026-10-20&endDate=2026-10-24&mealType=Breakfast
```

A food entry can include food name, meal type, quantity and unit, calories, macronutrients, fiber, sugar, vitamins, minerals, entry date, and optional image URL. Use the field names accepted by the `FoodEntry` model.

### Health goals

Base path: `/api/health-goals`

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/health-goals` | Create goals for the authenticated user |
| `GET` | `/api/health-goals` | Retrieve the user's goals |
| `PUT` | `/api/health-goals` | Update the user's goals |

The goal model includes daily calorie, protein, carbohydrate, and fat targets, current weight, and target weight. The application validates goal values and prevents creating a second goal record for the same user.

### Nutrition reports

Base path: `/api/nutrition-reports`

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/nutrition-reports/daily?date=YYYY-MM-DD` | Daily nutrition report |
| `GET` | `/api/nutrition-reports/weekly?startDate=YYYY-MM-DD` | Weekly nutrition report |

The reporting implementation includes nutrition totals and goal comparisons. Check the current controller/service response fields when integrating a client.

### AI nutrition extraction

| Method | Endpoint | Content type | Purpose |
|---|---|---|---|
| `POST` | `/api/nutrition/extract` | `multipart/form-data` | Analyze a food photo or nutrition-label image |

Send the image as a multipart field named `image`. The endpoint accepts JPEG, PNG, and WebP images, with a maximum upload size of 5 MB. The result is for review; this endpoint does not automatically create a food entry.

### PDF food diary import

| Method | Endpoint | Content type | Purpose |
|---|---|---|---|
| `POST` | `/api/food-import/pdf/preview` | `multipart/form-data` | Parse a PDF and preview recognized entries |
| `POST` | `/api/food-import/pdf/import` | `application/json` | Import a validated list of food entries |

For preview, send the PDF in the multipart field named `file`. The import endpoint accepts a JSON array, validates the entries, assigns the authenticated user's ID, and saves them. The current implementation does not deduplicate repeated imports, so review the preview before importing.

### AI chat

| Method | Endpoint | Content type | Purpose |
|---|---|---|---|
| `POST` | `/api/chat` | `application/json` | Ask nutrition questions or request supported chat assistance |
| `POST` | `/api/chat/confirm-meal` | `application/json` | Submit meal details for validation and saving |

Example chat request:

```json
{
  "message": "How many calories have I eaten today?"
}
```

Example meal-log request:

```json
{
  "message": "I ate two boiled eggs for breakfast today"
}
```

When Gemini recognizes a meal-log request and returns sufficient details, the chat endpoint responds with a preview and `requiresConfirmation: true`. A client can submit the reviewed values to `/api/chat/confirm-meal`.

**Confirmation security note:** The current confirmation endpoint validates submitted values and assigns the authenticated user's ID, but it does not verify that the submitted values match a server-stored pending preview. Do not describe this as server-verified confirmation until a pending-meal record or signed confirmation token is implemented.

Some chat requests are routed using keyword checks. Test different phrasings and inspect responses before relying on natural-language handling for every request.

## Testing with Postman

1. Start the backend and confirm that it connects to MongoDB.
2. Register a user through `/api/auth/register`.
3. Log in through `/api/auth/login` and copy the returned JWT.
4. For protected requests, select **Authorization → Bearer Token** and paste the JWT.
5. Test food-entry create/list/update/delete operations.
6. Test health-goal creation, retrieval, and update.
7. Test daily and weekly reports against known entries.
8. Upload an image to `/api/nutrition/extract` using form-data field `image`.
9. Upload a sample PDF to `/api/food-import/pdf/preview`, review the entries, and then test import.
10. Test chat questions, meal previews, and meal confirmation.
11. Verify that requests without a token are rejected and one user cannot access another user's data.

## Data and privacy

- Keep `MONGODB_URI`, `GEMINI_API_KEY`, and `JWT_SECRET` out of source control.
- Use a strong, random JWT secret; never use a short test value outside local experimentation.
- Restrict MongoDB network access and use a database account with only the permissions required.
- Avoid logging credentials, bearer tokens, or sensitive user data.
- Review AI-generated nutrition values before saving them.

## Current scope and limitations

- This repository documents the backend REST API; a frontend can be developed separately.
- Image-based nutrition values may be estimates and can vary with image quality, portion size, and food preparation.
- PDF parsing depends on the structure and text extraction quality of the input PDF.
- Re-importing the same PDF may create duplicate entries.
- Chat confirmation needs server-side binding between a preview and its confirmation for stronger confirmation guarantees.
- Run automated tests and manually verify API flows before deployment.

## Suggested improvements

- Add automated unit and integration tests for controllers, services, repositories, and security.
- Implement server-side pending-meal confirmation with expiry and user binding.
- Add duplicate detection or import idempotency for PDF imports.
- Add API documentation with OpenAPI/Swagger.
- Add deployment instructions and environment-specific configuration.
- Add rate limiting and request timeouts for AI endpoints.

## License

Add the license appropriate for this repository before distributing it or accepting external contributions.
