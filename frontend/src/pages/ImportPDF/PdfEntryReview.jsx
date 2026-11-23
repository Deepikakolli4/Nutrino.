import { CheckCircle2, LoaderCircle, Pencil, Trash2, Upload, X } from "lucide-react";

export default function PdfEntryReview({
  entries,
  mealTypes,
  editingIndex,
  setEditingIndex,
  updateEntry,
  removeEntry,
  startOver,
  handleImport,
  saving,
  loading,
}) {
  return (
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
                      {mealTypes.map((type) => (
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
  );
}
