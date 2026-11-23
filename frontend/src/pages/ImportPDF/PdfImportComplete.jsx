import { CheckCircle2, Upload } from "lucide-react";

export default function PdfImportComplete({ startOver }) {
  return (
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
  );
}
