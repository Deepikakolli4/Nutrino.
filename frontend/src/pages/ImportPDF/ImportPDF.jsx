import { useRef, useState } from "react";
import {
  FileUp,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import {
  previewPdfFoodEntries,
  importPdfFoodEntries,
} from "../../api/pdfFoodImport";
import "./ImportPDF.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const EMPTY_ENTRY = {
  foodName: "",
  quantity: 1,
  quantityUnit: "serving",
  mealType: "Breakfast",
  entryDate: new Date().toLocaleDateString("en-CA"),
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
};

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"];

function normalizeEntry(entry, index) {
  return {
    ...EMPTY_ENTRY,
    ...entry,
    id: entry.id || `pdf-row-${index}-${Date.now()}`,
    foodName: entry.foodName ?? "",
    quantity: entry.quantity ?? 1,
    quantityUnit: entry.quantityUnit || "serving",
    mealType:
      MEAL_TYPES.find(
        (type) =>
          type.toLowerCase() === String(entry.mealType || "").toLowerCase(),
      ) || "Breakfast",
    entryDate:
      typeof entry.entryDate === "string"
        ? entry.entryDate.slice(0, 10)
        : EMPTY_ENTRY.entryDate,
    calories: entry.calories ?? 0,
    protein: entry.protein ?? 0,
    carbs: entry.carbs ?? 0,
    fat: entry.fat ?? 0,
    fiber: entry.fiber ?? 0,
    sugar: entry.sugar ?? 0,
  };
}

function validateEntry(entry) {
  if (!entry.foodName.trim()) {
    return "Food name is required.";
  }

  if (!entry.quantityUnit.trim()) {
    return "Quantity unit is required.";
  }

  if (!entry.entryDate || !/^\d{4}-\d{2}-\d{2}$/.test(entry.entryDate)) {
    return "Enter a valid entry date.";
  }

  if (!MEAL_TYPES.includes(entry.mealType)) {
    return "Select a valid meal type.";
  }

  const quantity = Number(entry.quantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return "Quantity must be greater than zero.";
  }

  const numericFields = [
    "calories",
    "protein",
    "carbs",
    "fat",
    "fiber",
    "sugar",
  ];

  for (const field of numericFields) {
    const value = Number(entry[field]);

    if (!Number.isFinite(value) || value < 0) {
      return `${field} must be a valid non-negative number.`;
    }
  }

  return "";
}

function toImportPayload(entry) {
  return {
    foodName: entry.foodName.trim(),
    quantity: Number(entry.quantity),
    quantityUnit: entry.quantityUnit.trim(),
    mealType: entry.mealType,
    entryDate: entry.entryDate,
    calories: Number(entry.calories),
    protein: Number(entry.protein),
    carbs: Number(entry.carbs),
    fat: Number(entry.fat),
    fiber: Number(entry.fiber),
    sugar: Number(entry.sugar),
  };
}

export default function ImportPDF() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [stage, setStage] = useState("select");
  const [editingIndex, setEditingIndex] = useState(null);

  function showStatus(message, type = "error") {
    setStatus(message);
    setStatusType(type);
  }

  function validateFile(selectedFile) {
    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      showStatus("Please choose a PDF file.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      showStatus("PDF size must not exceed 10 MB.");
      return;
    }

    if (selectedFile.size === 0) {
      showStatus("The selected PDF is empty.");
      return;
    }

    setFile(selectedFile);
    setEntries([]);
    setStage("select");
    setEditingIndex(null);
    setStatus("");
    setStatusType("");
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    validateFile(event.dataTransfer.files?.[0]);
  }

  function removeFile() {
    if (loading || saving) return;

    setFile(null);
    setEntries([]);
    setStage("select");
    setEditingIndex(null);
    setStatus("");
    setStatusType("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handlePreview() {
    if (!file || loading || saving) return;

    setLoading(true);
    setStatus("");
    setStatusType("");

    try {
      const response = await previewPdfFoodEntries(file);
      const parsedEntries = Array.isArray(response.entries)
        ? response.entries
        : [];

      if (parsedEntries.length === 0) {
        showStatus("No food entries were found in this PDF.");
        return;
      }

      if (parsedEntries.length > 500) {
        showStatus(
          "This PDF contains more than 500 entries. Please split it into smaller files.",
        );
        return;
      }

      setEntries(parsedEntries.map(normalizeEntry));
      setStage("review");
      setEditingIndex(null);
      showStatus(
        `${parsedEntries.length} entries parsed. Review them before importing.`,
        "info",
      );
    } catch (error) {
      showStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  function updateEntry(index, field, value) {
    setEntries((previous) =>
      previous.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
    setStatus("");
    setStatusType("");
  }

  function removeEntry(index) {
    setEntries((previous) =>
      previous.filter((_, currentIndex) => currentIndex !== index),
    );

    setEditingIndex(null);
    setStatus("");
    setStatusType("");
  }

  async function handleImport() {
    if (!entries.length || saving || loading) return;

    for (let index = 0; index < entries.length; index += 1) {
      const validationError = validateEntry(entries[index]);

      if (validationError) {
        setEditingIndex(index);
        showStatus(`Row ${index + 1}: ${validationError}`);
        return;
      }
    }

    setSaving(true);
    setStatus("");
    setStatusType("");

    try {
      const payload = entries.map(toImportPayload);
      const response = await importPdfFoodEntries(payload);

      const importedCount = Number(response.importedCount);

      if (!Number.isFinite(importedCount) || importedCount !== entries.length) {
        throw new Error(
          "The server did not confirm that all entries were imported. Check your food entries before retrying.",
        );
      }

      setStage("complete");
      setEntries([]);
      setEditingIndex(null);

      showStatus(
        response.message ||
          `${importedCount} food entries imported successfully.`,
        "success",
      );
    } catch (error) {
      showStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  function startOver() {
    setFile(null);
    setEntries([]);
    setStage("select");
    setEditingIndex(null);
    setStatus("");
    setStatusType("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <main className="import-pdf-page">
      <header className="import-pdf-header">
        <p className="import-pdf-eyebrow">BULK IMPORT</p>

        <h1>
          Import a <span>Food Diary.</span>
        </h1>

        <p className="import-pdf-subtitle">
          Upload a PDF export with a table of meals. We'll parse it so you can
          review and edit entries before importing.
        </p>
      </header>

      <input
        ref={inputRef}
        className="import-pdf-hidden-input"
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => validateFile(event.target.files?.[0])}
      />

      {stage === "complete" ? (
        <section className="import-pdf-complete">
          <span className="import-pdf-complete-icon">
            <CheckCircle2 size={34} />
          </span>
          <h2>Import complete</h2>
          <p>Your food diary entries have been saved.</p>
          <button
            type="button"
            className="import-pdf-import-button"
            onClick={startOver}
          >
            <Upload size={18} />
            Import another PDF
          </button>
        </section>
      ) : (
        <>
          {stage === "select" && !file && (
            <button
              type="button"
              className={`import-pdf-dropzone ${isDragging ? "dragging" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <span className="import-pdf-icon">
                <FileUp size={42} strokeWidth={2.1} />
              </span>

              <strong>Drop your PDF here or click to browse</strong>

              <span className="import-pdf-hint">
                Tabular food diary · PDF up to 10 MB
              </span>
            </button>
          )}

          {file && stage === "select" && (
            <section className="import-pdf-file-card">
              <div className="import-pdf-file-info">
                <span className="import-pdf-file-icon">
                  <FileText size={25} />
                </span>

                <div className="import-pdf-file-text">
                  <strong>{file.name}</strong>
                  <span>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · PDF document
                  </span>
                </div>

                <button
                  type="button"
                  className="import-pdf-remove"
                  aria-label="Remove selected PDF"
                  onClick={removeFile}
                  disabled={loading}
                >
                  <X size={19} />
                </button>
              </div>

              <button
                type="button"
                className="import-pdf-import-button"
                onClick={handlePreview}
                disabled={loading}
              >
                {loading ? (
                  <LoaderCircle size={18} className="import-pdf-spinner" />
                ) : (
                  <FileUp size={18} />
                )}
                {loading ? "Parsing PDF..." : "Review entries"}
              </button>
            </section>
          )}

          {stage === "review" && (
            <section className="import-pdf-review">
              <div className="import-pdf-review-header">
                <div>
                  <p className="import-pdf-eyebrow">REVIEW</p>
                  <h2>Food entries</h2>
                  <p>
                    {entries.length} entries ready to import. Check dates, meal
                    types, quantities, and nutrition values.
                  </p>
                </div>

                <button
                  type="button"
                  className="import-pdf-remove"
                  aria-label="Start over"
                  onClick={startOver}
                  disabled={saving}
                >
                  <X size={19} />
                </button>
              </div>

              <div className="import-pdf-table-wrap">
                <table className="import-pdf-table">
                  <thead>
                    <tr>
                      <th>Food</th>
                      <th>Date</th>
                      <th>Meal</th>
                      <th>Qty</th>
                      <th>Calories</th>
                      <th>Protein</th>
                      <th>Carbs</th>
                      <th>Fat</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td>
                          {editingIndex === index ? (
                            <input
                              className="import-pdf-cell-input"
                              value={entry.foodName}
                              onChange={(event) =>
                                updateEntry(
                                  index,
                                  "foodName",
                                  event.target.value,
                                )
                              }
                              aria-label={`Food name for row ${index + 1}`}
                            />
                          ) : (
                            <strong>{entry.foodName || "Unnamed food"}</strong>
                          )}

                          {editingIndex === index && (
                            <div className="import-pdf-edit-extra">
                              <label>
                                Unit
                                <input
                                  className="import-pdf-cell-input"
                                  value={entry.quantityUnit}
                                  onChange={(event) =>
                                    updateEntry(
                                      index,
                                      "quantityUnit",
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>

                              <label>
                                Fiber (g)
                                <input
                                  className="import-pdf-cell-input"
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={entry.fiber}
                                  onChange={(event) =>
                                    updateEntry(
                                      index,
                                      "fiber",
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>

                              <label>
                                Sugar (g)
                                <input
                                  className="import-pdf-cell-input"
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={entry.sugar}
                                  onChange={(event) =>
                                    updateEntry(
                                      index,
                                      "sugar",
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>
                            </div>
                          )}
                        </td>

                        <td>
                          {editingIndex === index ? (
                            <input
                              className="import-pdf-cell-input"
                              type="date"
                              value={entry.entryDate}
                              onChange={(event) =>
                                updateEntry(
                                  index,
                                  "entryDate",
                                  event.target.value,
                                )
                              }
                            />
                          ) : (
                            entry.entryDate
                          )}
                        </td>

                        <td>
                          {editingIndex === index ? (
                            <select
                              className="import-pdf-cell-input"
                              value={entry.mealType}
                              onChange={(event) =>
                                updateEntry(
                                  index,
                                  "mealType",
                                  event.target.value,
                                )
                              }
                            >
                              {MEAL_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          ) : (
                            entry.mealType
                          )}
                        </td>

                        <td>
                          {editingIndex === index ? (
                            <div className="import-pdf-quantity-edit">
                              <input
                                className="import-pdf-cell-input"
                                type="number"
                                min="0.01"
                                step="any"
                                value={entry.quantity}
                                onChange={(event) =>
                                  updateEntry(
                                    index,
                                    "quantity",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                          ) : (
                            `${entry.quantity} ${entry.quantityUnit}`
                          )}
                        </td>

                        {["calories", "protein", "carbs", "fat"].map(
                          (field) => (
                            <td key={field}>
                              {editingIndex === index ? (
                                <input
                                  className="import-pdf-cell-input"
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={entry[field]}
                                  onChange={(event) =>
                                    updateEntry(
                                      index,
                                      field,
                                      event.target.value,
                                    )
                                  }
                                  aria-label={`${field} for ${entry.foodName}`}
                                />
                              ) : (
                                entry[field]
                              )}
                            </td>
                          ),
                        )}

                        <td>
                          <div className="import-pdf-row-actions">
                            <button
                              type="button"
                              className="import-pdf-row-action"
                              aria-label={
                                editingIndex === index
                                  ? "Finish editing row"
                                  : "Edit row"
                              }
                              title={
                                editingIndex === index
                                  ? "Finish editing"
                                  : "Edit entry"
                              }
                              onClick={() =>
                                setEditingIndex(
                                  editingIndex === index ? null : index,
                                )
                              }
                              disabled={saving}
                            >
                              {editingIndex === index ? (
                                <CheckCircle2 size={17} />
                              ) : (
                                <Pencil size={17} />
                              )}
                            </button>

                            <button
                              type="button"
                              className="import-pdf-row-action danger"
                              aria-label={`Remove ${entry.foodName}`}
                              title="Remove entry"
                              onClick={() => removeEntry(index)}
                              disabled={saving}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="import-pdf-review-footer">
                <span>{entries.length} entries selected</span>

                <button
                  type="button"
                  className="import-pdf-import-button"
                  onClick={handleImport}
                  disabled={saving || loading || entries.length === 0}
                >
                  {saving ? (
                    <LoaderCircle size={18} className="import-pdf-spinner" />
                  ) : (
                    <Upload size={18} />
                  )}
                  {saving
                    ? "Importing entries..."
                    : `Import ${entries.length} entries`}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {status && (
        <p
          className={`import-pdf-status ${statusType}`}
          role={statusType === "error" ? "alert" : "status"}
        >
          {statusType === "success" || statusType === "info" ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertCircle size={17} />
          )}
          {status}
        </p>
      )}
    </main>
  );
}
