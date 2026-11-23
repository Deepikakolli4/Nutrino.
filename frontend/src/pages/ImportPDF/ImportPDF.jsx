import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  previewPdfFoodEntries,
  importPdfFoodEntries,
} from "../../api/pdfFoodImport";
import PdfFileSelection from "./PdfFileSelection";
import PdfEntryReview from "./PdfEntryReview";
import PdfImportComplete from "./PdfImportComplete";
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
      console.log("PDF Import Response:", response);

window.dispatchEvent(new Event("foodEntriesUpdated"));

      const importedCount = Number(response.importedCount);

      if (!Number.isFinite(importedCount) || importedCount !== entries.length) {
  throw new Error(
    "The server did not confirm that all entries were imported. Check your food entries before retrying."
  );
}

// Notify Food Entries page
window.dispatchEvent(new Event("foodEntriesUpdated"));

setStage("complete");
setEntries([]);
setEditingIndex(null);

// Notify the Food Entries page to reload its data.
window.dispatchEvent(new Event("foodEntriesUpdated"));

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

      {stage === "select" && (
        <PdfFileSelection
          file={file}
          inputRef={inputRef}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          handleDrop={handleDrop}
          removeFile={removeFile}
          handlePreview={handlePreview}
          loading={loading}
        />
      )}

      {stage === "review" && (
        <PdfEntryReview
          entries={entries}
          mealTypes={MEAL_TYPES}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          updateEntry={updateEntry}
          removeEntry={removeEntry}
          startOver={startOver}
          handleImport={handleImport}
          saving={saving}
          loading={loading}
        />
      )}

      {stage === "complete" && <PdfImportComplete startOver={startOver} />}

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
