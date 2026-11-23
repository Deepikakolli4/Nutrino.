import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const mealTypes = ["All meals", "Breakfast", "Lunch", "Dinner", "Snacks"];

export default function FoodEntryFilters({
  fromDate,
  toDate,
  mealType,
  changeFromDate,
  changeToDate,
  changeMealType,
  setRange,
}) {
  const [mealDropdownOpen, setMealDropdownOpen] = useState(false);
  const mealDropdownRef = useRef(null);

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
      if (event.key === "Escape") setMealDropdownOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
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
  );
}
