
import api from "./axios";

function getErrorMessage(error) {
  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

// GET /api/food-entries
export async function getFoodEntries({
  startDate,
  endDate,
  mealType,
  page = 0,
  size = 10,
} = {}) {
  try {
    const params = {
      page,
      size,
    };

    // Apply date filtering only when BOTH dates are selected.
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }

    if (mealType && mealType !== "All meals") {
      params.mealType =
        mealType === "Snacks" ? "SNACKS" : mealType.toUpperCase();
    }

    const response = await api.get("/food-entries", { params });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// POST /api/food-entries
export async function createFoodEntry(foodEntry) {
  try {
    const response = await api.post("/food-entries", foodEntry);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// PUT /api/food-entries/{id}
export async function updateFoodEntry(id, foodEntry) {
  try {
    const response = await api.put(
      `/food-entries/${encodeURIComponent(id)}`,
      foodEntry
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// DELETE /api/food-entries/{id}
export async function deleteFoodEntry(id) {
  try {
    await api.delete(`/food-entries/${encodeURIComponent(id)}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
