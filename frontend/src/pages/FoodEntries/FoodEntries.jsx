import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Utensils,
  RefreshCw,
  X,
  AlertTriangle,
} from "lucide-react";

import { getFoodEntries, deleteFoodEntry } from "../../api/foodEntries";
import "./FoodEntries.css";

function dateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function formatTime(entry) {
  if (entry.createdAt) {
    const date = new Date(entry.createdAt);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  return "—";
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

const mealIcons = {
  Breakfast: Coffee,
  Lunch: Sun,
  Dinner: Moon,
  Snacks: Cookie,
};

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

  const [mealDropdownOpen, setMealDropdownOpen] = useState(false);
  const mealDropdownRef = useRef(null);

  const mealTypes = ["All meals", "Breakfast", "Lunch", "Dinner", "Snacks"];

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

  // Close the meal dropdown when clicking outside or pressing Escape.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        mealDropdownRef.current &&
        !mealDropdownRef.current.contains(event.target)
      ) {
        setMealDropdownOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMealDropdownOpen(false);

        if (deletingId === null) {
          setDeleteTarget(null);
          setDeleteError("");
        }
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
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

  const pageCalories = useMemo(
    () => entries.reduce((total, entry) => total + entry.calories, 0),
    [entries],
  );

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

  const currentPage = page + 1;

  const firstItem = totalElements === 0 ? 0 : page * Number(pageSize) + 1;

  const lastItem = Math.min((page + 1) * Number(pageSize), totalElements);

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

      <section className="food-filter-panel">
        <label className="food-filter-field">
          <span>From</span>
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(event) => changeFromDate(event.target.value)}
          />
        </label>

        <label className="food-filter-field">
          <span>To</span>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(event) => changeToDate(event.target.value)}
          />
        </label>

        <div className="food-filter-field meal-type-filter">
          <span className="food-filter-label">Meal type</span>

          <div className="food-meal-dropdown" ref={mealDropdownRef}>
            <button
              type="button"
              className={`food-meal-dropdown-trigger ${
                mealDropdownOpen ? "is-open" : ""
              }`}
              onClick={() => setMealDropdownOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={mealDropdownOpen}
            >
              <span>{mealType}</span>

              <ChevronDown
                size={17}
                className={mealDropdownOpen ? "chevron-open" : ""}
              />
            </button>

            {mealDropdownOpen && (
              <div
                className="food-meal-dropdown-menu"
                role="listbox"
                aria-label="Meal type"
              >
                {mealTypes.map((type) => (
                  <button
                    type="button"
                    key={type}
                    role="option"
                    aria-selected={mealType === type}
                    className={`food-meal-dropdown-option ${
                      mealType === type ? "selected" : ""
                    }`}
                    onClick={() => {
                      changeMealType(type);
                      setMealDropdownOpen(false);
                    }}
                  >
                    <span>{type}</span>

                    {mealType === type && (
                      <span className="food-meal-check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="food-date-shortcuts">
          <button type="button" onClick={() => setRange(7)}>
            Last 7 days
          </button>

          <button type="button" onClick={() => setRange(30)}>
            Last 30 days
          </button>
        </div>
      </section>

      <section className="food-results-panel">
        <div className="food-results-heading">
          <h2>Results</h2>

          <label className="food-rows-control">
            <span>Rows</span>

            <input
              className="food-rows-input"
              type="number"
              min="1"
              max="100"
              step="1"
              value={pageSize}
              aria-label="Number of food entries per page"
              onChange={(event) => {
                const value = event.target.value;

                if (value === "") {
                  setPageSize("");
                  return;
                }

                const number = Number(value);

                if (number >= 1 && number <= 100) {
                  setPageSize(value);
                  setPage(0);
                }
              }}
              onBlur={() => {
                const number = Number(pageSize);

                if (!pageSize || number < 1) {
                  setPageSize("10");
                } else if (number > 100) {
                  setPageSize("100");
                }

                setPage(0);
              }}
            />
          </label>
        </div>

        {notice && (
          <div className="food-delete-success" role="status">
            <span>{notice}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="food-api-error" role="alert">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        <div className="food-table-scroll">
          <table className="food-entries-table">
            <thead>
              <tr>
                <th>FOOD</th>
                <th>MEAL</th>
                <th>WHEN</th>
                <th className="numeric-column">KCAL</th>
                <th className="macro-protein">P</th>
                <th className="macro-carbs">C</th>
                <th className="macro-fat">F</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="food-empty-state">
                    Loading your food entries...
                  </td>
                </tr>
              ) : entries.length > 0 ? (
                entries.map((entry) => {
                  const MealIcon = mealIcons[entry.meal] || Utensils;

                  return (
                    <tr key={entry.id}>
                      <td className="food-name-cell">
                        <strong>{entry.food}</strong>
                        <span>{entry.serving} · Logged</span>
                      </td>

                      <td>
                        <span
                          className={`food-meal-badge ${entry.meal.toLowerCase()}`}
                        >
                          <MealIcon size={15} />
                          {entry.meal}
                        </span>
                      </td>

                      <td className="food-when-cell">
                        {formatDate(entry.date)}, {formatTime(entry)}
                      </td>

                      <td className="numeric-column food-kcal-cell">
                        {entry.calories.toLocaleString()}
                      </td>

                      <td>{entry.protein}g</td>
                      <td>{entry.carbs}g</td>
                      <td>{entry.fat}g</td>

                      <td className="food-action-cell">
                        <button
                          type="button"
                          className="food-delete-button"
                          aria-label={`Delete ${entry.food}`}
                          title={`Delete ${entry.food}`}
                          disabled={deletingId === entry.id}
                          onClick={() => openDeleteDialog(entry)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="food-empty-state">
                    {error
                      ? "Food entries could not be loaded."
                      : "No food entries found for these filters."}

                    {!error && (
                      <button type="button" onClick={resetFilters}>
                        Reset filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="food-table-footer">
          <span>This page: {pageCalories.toLocaleString()} kcal</span>

          <div className="food-pagination">
            <span>
              Showing {loading ? 0 : firstItem}–{loading ? 0 : lastItem} of{" "}
              {totalElements}
            </span>

            <div className="food-page-buttons">
              <button
                type="button"
                aria-label="Previous page"
                disabled={loading || page <= 0}
                onClick={() => setPage((previous) => Math.max(0, previous - 1))}
              >
                <ChevronLeft size={18} />
              </button>

              <span className="food-page-number-wrap">
                <button
                  type="button"
                  className="current"
                  aria-current="page"
                  disabled={totalPages === 0}
                >
                  {totalPages === 0 ? 0 : currentPage}
                </button>
              </span>

              <span>of {totalPages}</span>

              <button
                type="button"
                aria-label="Next page"
                disabled={loading || totalPages === 0 || page >= totalPages - 1}
                onClick={() =>
                  setPage((previous) => Math.min(totalPages - 1, previous + 1))
                }
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Custom delete confirmation modal */}
      {deleteTarget && (
        <div
          className="food-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteDialog();
            }
          }}
        >
          <section
            className="food-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="food-delete-title"
            aria-describedby="food-delete-description"
          >
            <div className="food-delete-icon">
              <AlertTriangle size={24} />
            </div>

            <button
              type="button"
              className="food-modal-close"
              aria-label="Close confirmation"
              disabled={deletingId !== null}
              onClick={closeDeleteDialog}
            >
              <X size={19} />
            </button>

            <h2 id="food-delete-title">Delete food entry?</h2>

            <p id="food-delete-description">
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.food}</strong>? This action cannot be
              undone.
            </p>

            {deleteError && (
              <div className="food-delete-error" role="alert">
                {deleteError}
              </div>
            )}

            <div className="food-modal-actions">
              <button
                type="button"
                className="food-cancel-button"
                disabled={deletingId !== null}
                onClick={closeDeleteDialog}
              >
                Cancel
              </button>

              <button
                type="button"
                className="food-confirm-delete-button"
                disabled={deletingId !== null}
                onClick={handleDelete}
              >
                {deletingId !== null ? "Deleting..." : "Delete entry"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
