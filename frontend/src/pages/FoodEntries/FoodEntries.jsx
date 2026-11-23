import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { getFoodEntries, deleteFoodEntry } from "../../api/foodEntries";
import "./FoodEntries.css";
import FoodEntryFilters from "./FoodEntryFilters";
import FoodEntryResults from "./FoodEntryResults";
import DeleteFoodEntryDialog from "./DeleteFoodEntryDialog";

function dateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function displayMealType(mealType) {
  const normalized = String(mealType || "")
    .trim()
    .toUpperCase();

  const mealTypes = {
    BREAKFAST: "Breakfast",
    LUNCH: "Lunch",
    DINNER: "Dinner",
    SNACK: "Snacks",
    SNACKS: "Snacks",
  };

  return mealTypes[normalized] || mealType || "Other";
}

export default function FoodEntries() {
  const navigate = useNavigate();

  const today = dateString(new Date());
  const sevenDaysAgo = dateString(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  );

  const [entries, setEntries] = useState([]);
  const [fromDate, setFromDate] = useState(sevenDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [mealType, setMealType] = useState("All meals");

  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(0);

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Delete confirmation modal state.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && deletingId === null) {
        setDeleteTarget(null);
        setDeleteError("");
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [deletingId]);

  // Fetch entries from Spring Boot when filters or pagination change.
  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      setLoading(true);
      setError("");

      try {
        const result = await getFoodEntries({
          startDate: fromDate,
          endDate: toDate,
          mealType,
          page,
          size: Number(pageSize) || 10,
        });

        if (cancelled) return;

        setEntries(
          (result.content || []).map((entry) => ({
            ...entry,
            meal: displayMealType(entry.mealType),
            food: entry.foodName || "Unnamed food",
            serving: `${entry.quantity ?? 1} ${
              entry.quantityUnit || "serving"
            }`,
            date: entry.entryDate,
            calories: Number(entry.calories) || 0,
            protein: Number(entry.protein) || 0,
            carbs: Number(entry.carbs) || 0,
            fat: Number(entry.fat) || 0,
          })),
        );

        setTotalElements(result.totalElements ?? 0);
        setTotalPages(result.totalPages ?? 0);
      } catch (err) {
        if (!cancelled) {
          setEntries([]);
          setTotalElements(0);
          setTotalPages(0);
          setError(err.message || "Unable to load food entries.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEntries();

    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate, mealType, page, pageSize, refreshKey]);


  useEffect(() => {
  const handleFoodEntriesUpdated = () => {
    console.log("Food entries update event received");
    setRefreshKey((prev) => prev + 1);
  };

  window.addEventListener("foodEntriesUpdated", handleFoodEntriesUpdated);

  return () => {
    window.removeEventListener(
      "foodEntriesUpdated",
      handleFoodEntriesUpdated
    );
  };
}, []);

// Refresh food entries when a PDF import completes.
useEffect(() => {
  function handleFoodEntriesUpdated() {
    setRefreshKey((previous) => previous + 1);
  }

  window.addEventListener(
    "foodEntriesUpdated",
    handleFoodEntriesUpdated,
  );

  return () => {
    window.removeEventListener(
      "foodEntriesUpdated",
      handleFoodEntriesUpdated,
    );
  };
}, []);

  function setRange(days) {
    const end = new Date();
    const start = new Date();

    start.setDate(start.getDate() - (days - 1));

    setFromDate(dateString(start));
    setToDate(dateString(end));
    setPage(0);
  }

  function changeFromDate(value) {
    setFromDate(value);
    setPage(0);
  }

  function changeToDate(value) {
    setToDate(value);
    setPage(0);
  }

  function changeMealType(value) {
    setMealType(value);
    setPage(0);
  }

  // Open the custom confirmation modal.
  function openDeleteDialog(entry) {
    setNotice("");
    setDeleteError("");
    setDeleteTarget(entry);
  }

  function closeDeleteDialog() {
    if (deletingId !== null) return;

    setDeleteTarget(null);
    setDeleteError("");
  }

  // Delete only after the user confirms in the modal.
  async function handleDelete() {
    if (!deleteTarget || deletingId !== null) return;

    const entryToDelete = deleteTarget;

    setDeletingId(entryToDelete.id);
    setDeleteError("");
    setNotice("");
    setError("");

    try {
      await deleteFoodEntry(entryToDelete.id);

      setDeleteTarget(null);
      setDeleteError("");
      setNotice(`"${entryToDelete.food}" was deleted successfully.`);

      // Return to the previous page if its last entry was deleted.
      if (entries.length === 1 && page > 0) {
        setPage((previous) => previous - 1);
      } else {
        setRefreshKey((previous) => previous + 1);
      }
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to delete this entry. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function resetFilters() {
    setRange(30);
    setMealType("All meals");
    setPage(0);
  }

  return (
    <main className="food-entries-page">
      <header className="food-entries-header">
        <div>
          <p className="food-entries-eyebrow">HISTORY</p>

          <h1>
            Food<span> Entries.</span>
          </h1>

          <p className="food-entries-subtitle">
            Every meal you've logged, filterable by time range and meal type.
          </p>
        </div>

        <button
          type="button"
          className="food-add-button"
          onClick={() => navigate("/log-meal")}
        >
          <Plus size={18} />
          Add entry
        </button>
      </header>

      <FoodEntryFilters
        fromDate={fromDate}
        toDate={toDate}
        mealType={mealType}
        changeFromDate={changeFromDate}
        changeToDate={changeToDate}
        changeMealType={changeMealType}
        setRange={setRange}
      />

      <FoodEntryResults
        entries={entries}
        loading={loading}
        error={error}
        notice={notice}
        page={page}
        pageSize={pageSize}
        totalElements={totalElements}
        totalPages={totalPages}
        deletingId={deletingId}
        setPage={setPage}
        setPageSize={setPageSize}
        dismissNotice={() => setNotice("")}
        retry={() => setRefreshKey((value) => value + 1)}
        resetFilters={resetFilters}
        openDeleteDialog={openDeleteDialog}
      />

      {deleteTarget && (
        <DeleteFoodEntryDialog
          deleteTarget={deleteTarget}
          deleteError={deleteError}
          isDeleting={deletingId !== null}
          closeDeleteDialog={closeDeleteDialog}
          handleDelete={handleDelete}
        />
      )}
    </main>
  );
}
