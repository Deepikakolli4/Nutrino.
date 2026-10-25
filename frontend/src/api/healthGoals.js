
import api from "./axios";

function getErrorMessage(error) {
  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    "Something went wrong with your health goals. Please try again."
  );
}

export async function getHealthGoals() {
  try {
    const response = await api.get("/health-goals");
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    const apiError = new Error(message);
    apiError.status = error.response?.status;
    throw apiError;
  }
}

export async function createHealthGoals(goals) {
  try {
    const response = await api.post("/health-goals", goals);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    const apiError = new Error(message);
    apiError.status = error.response?.status;
    throw apiError;
  }
}

export async function updateHealthGoals(goals) {
  try {
    const response = await api.put("/health-goals", goals);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    const apiError = new Error(message);
    apiError.status = error.response?.status;
    throw apiError;
  }
}

export async function deleteHealthGoals() {
  try {
    const response = await api.delete("/health-goals");
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    const apiError = new Error(message);
    apiError.status = error.response?.status;
    throw apiError;
  }
}
