import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Utensils,
  Clock,
  CalendarDays,
  Flame,
  CheckCircle2,
  X,
  Save,
  Sparkles,
} from "lucide-react";
import api from "../../api/axios";

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
        vitamins: result.vitamins ?? {},
        minerals: result.minerals ?? {},
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
      fiber: 0,
      sugar: 0,
      vitamins: {},
      minerals: {},
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
      {/* <button
        type="button"
        className="log-back-button"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft size={17} />
        Back to dashboard
      </button> */}

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

      {saved && (
        <div className="log-success-message" role="status">
          <CheckCircle2 size={20} />
          <div>
            <strong>Meal details validated!</strong>
            <span>
              This is a frontend preview. Your meal has not been saved to the
              database yet.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSaved(false)}
            aria-label="Dismiss message"
          >
            <X size={18} />
          </button>
        </div>
      )}
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
          <section className="log-panel log-photo-panel">
            <div className="log-panel-heading">
              <div>
                <span className="log-step-label">STEP 01</span>
                <h2>Add your food photo</h2>
              </div>
              <Camera size={20} />
            </div>

            <p className="log-panel-description">
              Add a photo to keep a visual record of your meal.
            </p>
            {analyzing && (
              <p className="log-ai-status" role="status">
                <Sparkles size={16} />
                Gemini AI is analyzing your image...
              </p>
            )}

            {isEstimate && !analyzing && (
              <p className="log-ai-status">
                <Sparkles size={16} />
                AI-generated estimates — review before saving.
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="log-file-input"
              onChange={handlePhoto}
            />

            {photo ? (
              <div className="log-photo-preview">
                <img src={photo.preview} alt="Selected meal" />

                <button
                  type="button"
                  className="log-remove-photo"
                  onClick={removePhoto}
                  aria-label="Remove photo"
                >
                  <X size={18} />
                </button>

                <div className="log-photo-filename">
                  <CheckCircle2 size={16} />
                  <span>{photo.file.name}</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="log-upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="log-upload-icon">
                  <ImagePlus size={27} />
                </div>
                <strong>Drop your food photo here</strong>
                <span>or click to browse your files</span>
                <span className="log-upload-limit">
                  PNG, JPG or WEBP · Max 5 MB
                </span>
              </button>
            )}

            <div className="log-ai-note">
              <Sparkles size={17} />
              <span>
                AI-powered food analysis can be connected here to estimate
                calories and macros from your photo.
              </span>
            </div>
          </section>

          <section className="log-panel log-details-panel">
            <div className="log-panel-heading">
              <div>
                <span className="log-step-label">STEP 02</span>
                <h2>Meal details</h2>
              </div>
              <Utensils size={20} />
            </div>

            <div className="log-form-grid">
              <label className="log-field log-field-full">
                <span>Food name *</span>
                <input
                  name="foodName"
                  value={form.foodName}
                  onChange={updateField}
                  placeholder="e.g. Avocado toast"
                  required
                />
              </label>

              <label className="log-field">
                <span>Meal type *</span>
                <select
                  name="mealType"
                  value={form.mealType}
                  onChange={updateField}
                  required
                >
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Dinner</option>
                  <option>Snacks</option>
                </select>
              </label>

              <label className="log-field">
                <span>Serving size *</span>
                <input
                  name="servingSize"
                  value={form.servingSize}
                  onChange={updateField}
                  placeholder="e.g. 1 bowl"
                  required
                />
              </label>

              <label className="log-field">
                <span>
                  <CalendarDays size={14} /> Date *
                </span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="log-field">
                <span>
                  <Clock size={14} /> Time *
                </span>
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={updateField}
                  required
                />
              </label>
            </div>
          </section>

          <section className="log-panel log-nutrition-panel">
            <div className="log-panel-heading">
              <div>
                <span className="log-step-label">STEP 03</span>
                <h2>Nutrition information</h2>
              </div>
              <Flame size={20} />
            </div>

            <p className="log-panel-description">
              Enter the nutrition values for your selected serving.
            </p>

            <div className="log-nutrition-grid">
              <label className="log-nutrition-field calories">
                <span>Calories</span>
                <div>
                  <input
                    type="number"
                    name="calories"
                    min="0"
                    step="1"
                    value={form.calories}
                    onChange={updateField}
                    placeholder="0"
                    required
                  />
                  <span>kcal</span>
                </div>
              </label>

              <label className="log-nutrition-field protein">
                <span>Protein</span>
                <div>
                  <input
                    type="number"
                    name="protein"
                    min="0"
                    step="0.1"
                    value={form.protein}
                    onChange={updateField}
                    placeholder="0"
                    required
                  />
                  <span>g</span>
                </div>
              </label>

              <label className="log-nutrition-field carbs">
                <span>Carbohydrates</span>
                <div>
                  <input
                    type="number"
                    name="carbs"
                    min="0"
                    step="0.1"
                    value={form.carbs}
                    onChange={updateField}
                    placeholder="0"
                    required
                  />
                  <span>g</span>
                </div>
              </label>

              <label className="log-nutrition-field fat">
                <span>Fat</span>
                <div>
                  <input
                    type="number"
                    name="fat"
                    min="0"
                    step="0.1"
                    value={form.fat}
                    onChange={updateField}
                    placeholder="0"
                    required
                  />
                  <span>g</span>
                </div>
              </label>
            </div>

            <label className="log-field log-notes-field">
              <span>Notes (optional)</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={updateField}
                placeholder="Add ingredients, portion details or anything else..."
                rows={3}
              />
            </label>
          </section>
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
