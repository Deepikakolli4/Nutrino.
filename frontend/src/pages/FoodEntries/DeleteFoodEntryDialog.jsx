import { AlertTriangle, X } from "lucide-react";

export default function DeleteFoodEntryDialog({
  deleteTarget,
  deleteError,
  isDeleting,
  closeDeleteDialog,
  handleDelete,
}) {
  return (
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
          disabled={isDeleting}
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
            disabled={isDeleting}
            onClick={closeDeleteDialog}
          >
            Cancel
          </button>

          <button
            type="button"
            className="food-confirm-delete-button"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Deleting..." : "Delete entry"}
          </button>
        </div>
      </section>
    </div>
  );
}
