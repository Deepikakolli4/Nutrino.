import { Camera, CheckCircle2, ImagePlus, Sparkles, X } from "lucide-react";

export default function MealPhotoPanel({
  analyzing,
  isEstimate,
  photo,
  fileInputRef,
  handlePhoto,
  removePhoto,
}) {
  return (
    <section className="log-panel log-photo-panel">
      <div className="log-panel-heading">
        <div>
          <span className="log-step-label">STEP 01</span>
          <h2>Add your food photo</h2>
        </div>
        <Camera size={20} />
      </div>

      <p className="log-panel-description">
        Add a photo to keep a visual record of your meal.
      </p>
      {analyzing && (
        <p className="log-ai-status" role="status">
          <Sparkles size={16} />
          Gemini AI is analyzing your image...
        </p>
      )}

      {isEstimate && !analyzing && (
        <p className="log-ai-status">
          <Sparkles size={16} />
          AI-generated estimates — review before saving.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="log-file-input"
        onChange={handlePhoto}
      />

      {photo ? (
        <div className="log-photo-preview">
          <img src={photo.preview} alt="Selected meal" />

          <button
            type="button"
            className="log-remove-photo"
            onClick={removePhoto}
            aria-label="Remove photo"
          >
            <X size={18} />
          </button>

          <div className="log-photo-filename">
            <CheckCircle2 size={16} />
            <span>{photo.file.name}</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="log-upload-zone"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="log-upload-icon">
            <ImagePlus size={27} />
          </div>
          <strong>Drop your food photo here</strong>
          <span>or click to browse your files</span>
          <span className="log-upload-limit">
            PNG, JPG or WEBP · Max 5 MB
          </span>
        </button>
      )}

      <div className="log-ai-note">
        <Sparkles size={17} />
        <span>
AI-powered food analysis can estimate nutrition values from your photo.
          Review the results and add micronutrients when available.
        </span>
      </div>
    </section>
  );
}
