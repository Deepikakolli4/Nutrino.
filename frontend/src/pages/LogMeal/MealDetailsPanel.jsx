import { CalendarDays, Clock, Utensils } from "lucide-react";

export default function MealDetailsPanel({ form, updateField }) {
  return (
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
  );
}
