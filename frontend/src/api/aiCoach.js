
import api from "./axios";
function getApiError(error, fallbackMessage) {
  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    fallbackMessage
  );
}

// Fetch persisted chat history from MongoDB
export async function getCoachHistory() {
  try {
    const response = await api.get("/chat/history");

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw new Error(
      getApiError(error, "Unable to load chat history.")
    );
  }
}

// Send a message to Nourish AI
export async function sendCoachMessage(message) {
  try {
    const response = await api.post("/chat", {
      message: message.trim(),
    });

    return response.data;
  } catch (error) {
    throw new Error(
      getApiError(error, "Nourish AI couldn't respond.")
    );
  }
}

export async function confirmCoachMeal(meals) {
  try {
    const response = await api.post("/chat/confirm-meal", {
      meals,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      getApiError(error, "Unable to save the food entries.")
    );
  }
}
