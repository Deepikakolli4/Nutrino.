import { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Moon,
  RefreshCw,
  Sun,
  Trash2,
  Utensils,
  X,
} from "lucide-react";

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

const mealIcons = {
  Breakfast: Coffee,
  Lunch: Sun,
  Dinner: Moon,
  Snacks: Cookie,
};

export default function FoodEntryResults({
  entries,
  loading,
  error,
  notice,
  page,
  pageSize,
  totalElements,
  totalPages,
  deletingId,
  setPage,
  setPageSize,
  dismissNotice,
  retry,
  resetFilters,
  openDeleteDialog,
}) {
  const pageCalories = useMemo(
    () => entries.reduce((total, entry) => total + entry.calories, 0),
    [entries],
  );
  const currentPage = page + 1;

  const firstItem = totalElements === 0 ? 0 : page * Number(pageSize) + 1;

  const lastItem = Math.min((page + 1) * Number(pageSize), totalElements);

  return (
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
            onClick={dismissNotice}
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
            onClick={retry}
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
  );
}
