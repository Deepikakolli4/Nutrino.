import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Utensils, X } from "lucide-react";
import api from "../../api/axios";
import MealPhotoPanel from "./MealPhotoPanel";
import MealDetailsPanel from "./MealDetailsPanel";
import MealNutritionPanel from "./MealNutritionPanel";

export default function LogMeal() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isEstimate, setIsEstimate] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    foodName: "",
    mealType: "Breakfast",
    servingSize: "1 serving",
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    sugar: "",
    vitamins: {},
    minerals: {},
    notes: "",
  });

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSaved(false);
  }

  function updateNutrientMap(type, key, value) {
    setForm((previous) => ({
      ...previous,
      [type]: {
        ...previous[type],
        [key]: value,
      },
    }));
    setSaved(false);
  }

  function normalizeNutrientMap(values) {
    if (!values || typeof values !== "object" || Array.isArray(values)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(values)
        .filter(([, value]) =>
          typeof value === "number" ||
          (typeof value === "string" && value.trim() !== ""),
        )
        .map(([key, value]) => [key, Number(value)])
        .filter(([, value]) => Number.isFinite(value) && value >= 0),
    );
  }

  async function analyzeFoodImage(file) {
    const data = new FormData();
    data.append("image", file);

    setAnalyzing(true);
    setNotice("Analyzing your food image with Gemini AI...");

    try {
      const response = await api.post("/nutrition/extract", data, {
        headers: {
          "Content-Type": undefined,
        },
      });

      // Your Gemini service returns JSON as a string.
      const result =
        typeof response.data === "string"
          ? JSON.parse(response.data)
          : response.data;

      const getNumber = (value) =>
        value == null || value === "" ? "" : Number(value);

      setForm((previous) => ({
        ...previous,
        foodName: result.foodName ?? previous.foodName,
        servingSize: [
          result.quantity ?? 1,
          result.quantityUnit ?? "serving",
        ].join(" "),
        calories: getNumber(result.calories),
        protein: getNumber(result.protein),
        carbs: getNumber(result.carbs),
        fat: getNumber(result.fat),
        fiber: getNumber(result.fiber),
        sugar: getNumber(result.sugar),
        vitamins: normalizeNutrientMap(result.vitamins),
        minerals: normalizeNutrientMap(result.minerals),
        notes: [result.servingDescription, result.notes]
          .filter(Boolean)
          .join("\n"),
      }));

      setIsEstimate(Boolean(result.isEstimate));
      setNotice(
        "Analysis complete. Please review the estimated nutrition values before saving.",
      );
    } catch (error) {
      console.error("Nutrition extraction failed:", error);

      setNotice(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Could not analyze the image. You can enter the nutrition values manually.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice("Please choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setPhoto({
      file,
      preview: URL.createObjectURL(file),
    });

    setSaved(false);
    setIsEstimate(false);

    await analyzeFoodImage(file);
  }
  function removePhoto() {
    if (photo?.preview) {
      URL.revokeObjectURL(photo.preview);
    }

    setPhoto(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");

    if (!form.foodName.trim()) {
      setNotice("Please enter a food name.");
      return;
    }

    const quantityMatch = form.servingSize
      .trim()
      .match(/^(\d+(?:\.\d+)?)\s*(.*)$/);

    if (!quantityMatch) {
      setNotice(
        "Enter serving size as a number and unit, such as 1 serving or 150 grams.",
      );
      return;
    }

    const quantity = Number(quantityMatch[1]);
    const quantityUnit = quantityMatch[2].trim() || "serving";

    const payload = {
      foodName: form.foodName.trim(),
      mealType: form.mealType.toUpperCase(),
      quantity,
      quantityUnit,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      fiber: Number(form.fiber) || 0,
      sugar: Number(form.sugar) || 0,
      vitamins: normalizeNutrientMap(form.vitamins),
      minerals: normalizeNutrientMap(form.minerals),
      entryDate: form.date,
      imageUrl: null,
    };

    setLoading(true);

    try {
      const response = await api.post("/food-entries", payload);

      setNotice("Meal saved successfully!");
      setSaved(true);

      // Reset form after successful save
      setForm({
        foodName: "",
        mealType: "Breakfast",
        servingSize: "1 serving",
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        fiber: "",
        sugar: "",
        vitamins: {},
        minerals: {},
        notes: "",
      });

      // Clear the selected photo
      if (photo?.preview) {
        URL.revokeObjectURL(photo.preview);
      }

      setPhoto(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      console.log("Saved food entry:", response.data);
    } catch (error) {
      setNotice(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Unable to save your meal. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="log-meal-page">

      <header className="log-page-header">
        <div>
          <p className="log-eyebrow">YOUR FOOD JOURNAL</p>
          <h1>
            Log a <span>Meal.</span>
          </h1>
          <p className="log-page-subtitle">
            Nourish your body, one meal at a time.
          </p>
        </div>

        <div className="log-header-icon">
          <Utensils size={25} />
        </div>
      </header>
      {notice && (
        <div className="log-notice" role="status">
          {notice}
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form className="log-meal-form" onSubmit={handleSubmit}>
        <div className="log-meal-layout">
          <MealPhotoPanel
            analyzing={analyzing}
            isEstimate={isEstimate}
            photo={photo}
            fileInputRef={fileInputRef}
            handlePhoto={handlePhoto}
            removePhoto={removePhoto}
          />
          <MealDetailsPanel form={form} updateField={updateField} />
          <MealNutritionPanel
            form={form}
            updateField={updateField}
            updateNutrientMap={updateNutrientMap}
          />
        </div>

        <footer className="log-form-footer">
          <p>Fields marked * are required.</p>

          <div>
            <button
              type="button"
              className="log-cancel-button"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>

            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save meal"}
            </button>
          </div>
        </footer>
      </form>
    </main>
  );
}
