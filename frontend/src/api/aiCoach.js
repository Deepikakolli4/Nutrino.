
import api from "./axios";

export async function sendCoachMessage(message) {
  try {
    const response = await api.post("/chat", {
      message: message.trim(),
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
        error.response?.data?.message ||
        "Unable to reach Nourish AI. Please try again."
    );
  }
}

export async function confirmCoachMeal(meal) {
  try {
    const response = await api.post("/chat/confirm-meal", meal);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
        error.response?.data?.message ||
        "Unable to save the meal. Please try again."
    );
  }
}
