import { FileText, FileUp, LoaderCircle, X } from "lucide-react";

export default function PdfFileSelection({
  file,
  inputRef,
  isDragging,
  setIsDragging,
  handleDrop,
  removeFile,
  handlePreview,
  loading,
}) {
  if (!file) {
    return (
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
    );
  }

  return (
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
  );
}
