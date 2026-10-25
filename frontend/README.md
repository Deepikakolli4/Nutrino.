# Nourish — Frontend

Nourish is a nutrition and food-tracking application designed to help users monitor their daily food intake, understand nutritional information, manage health goals, and get AI-powered nutrition guidance.

This repository contains the frontend application built with React.

## Features

- **Dashboard:** View daily calorie intake, macronutrients, seven-day calorie average, and food-entry statistics.
- **Food Logging:** Record meals and track nutritional information.
- **Food Entries:** View and manage logged food entries.
- **Nutrition Reports:** Review nutritional summaries and reports.
- **Health Goals:** Access health-goal management features.
- **AI Nutrition Coach:** Interact with the nutrition coach through the AI Coach page.
- **PDF Import:** Access the PDF food-import feature.
- **Authentication:** Login, registration, and forgot-password pages.
- **Responsive UI:** Reusable components and styling for the application interface.

## Tech Stack

- **Frontend:** React.js, JavaScript, JSX, CSS
- **Routing:** React Router DOM
- **HTTP Requests:** Axios
- **Icons:** Lucide React
- **Backend Integration:** REST APIs
- **Backend:** Spring Boot
- **Database:** MongoDB Atlas

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── axios.js
│   │   ├── aiCoach.js
│   │   ├── foodEntries.js
│   │   ├── healthGoals.js
│   │   ├── pdfFoodImport.js
│   │   └── nutritionReports.js
│   ├── components/
│   │   └── layout/
│   │       └── AppLayout.jsx
│   ├── pages/
│   │   ├── AICoach/
│   │   ├── AuthPages/
│   │   ├── DashBoard/
│   │   ├── FoodEntries/
│   │   ├── HealthGoals/
│   │   ├── ImportPDF/
│   │   ├── LogMeal/
│   │   └── Reports/
│   ├── App.jsx
│   └── index.js
├── package.json
└── README.md
```

*The API files and component names above reflect the intended structure; verify that each file exists in your current project.*

## Getting Started

### Prerequisites

- Node.js and npm
- The Nourish backend running locally or at an accessible API URL

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <repository-folder>/frontend
```

Replace the placeholders with your repository URL and project directory.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the backend API

The frontend uses Axios to communicate with the backend.

Check `src/api/axios.js` and configure the API base URL to match your running Spring Boot backend. For example, if your backend runs on port `8080`, the base URL may be:

```javascript
baseURL: "http://localhost:8080/api"
```

Use your actual backend URL and keep authentication headers configured as required by your application.

### 4. Start the frontend

For a Create React App project:

```bash
npm start
```

If your `package.json` uses a different development script, run the corresponding command instead.

Open the local URL shown in your terminal.

## Application Routes

| Route | Description |
|---|---|
| `/login` | User login |
| `/signup` | User registration |
| `/forgot-password` | Password recovery |
| `/dashboard` | Nutrition dashboard |
| `/log-meal` | Meal logging |
| `/food-entries` | Food-entry management |
| `/nutrition-reports` | Nutrition reports |
| `/health-goals` | Health goals |
| `/ai-coach` | AI nutrition coach |
| `/import-pdf` | PDF food import |

Protected application routes require a valid `nourish_token` in local storage, according to the current route guard.

## Backend Integration

The frontend communicates with the Spring Boot backend through REST API requests.

The dashboard uses the food-entry API to retrieve today's entries and entries from the last seven calendar days. The displayed calorie and macronutrient totals are calculated from the returned food-entry data.

Ensure that the backend is running, the API URL is correct, authentication is valid, and the backend permits requests from the frontend origin.

## Development

1. Start the backend.
2. Start the frontend.
3. Log in to access protected pages.
4. Add food entries and verify that the dashboard reflects the saved data.
5. Test the AI Coach, reports, health goals, and PDF import pages individually.

## Future Improvements

- Configure daily calorie and macronutrient targets.
- Improve dashboard visualizations and nutrition insights.
- Add stronger loading, empty-state, and error handling.
- Improve automated testing and accessibility.
- Document deployment and production environment configuration.

## License

Add the project's license information here if the repository is distributed publicly.
