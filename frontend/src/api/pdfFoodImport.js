
import api from "./axios";

function getErrorMessage(error) {
  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    "PDF import failed. Please try again."
  );
}

export async function previewPdfFoodEntries(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post(
      "/food-import/pdf/preview",
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function importPdfFoodEntries(entries) {
  try {
    const response = await api.post(
      "/food-import/pdf/import",
      entries
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
