import { ArrowUp, LoaderCircle } from "lucide-react";

export default function CoachComposer({ input, setInput, loading, disabled, handleSubmit }) {
  return (
    <form className="ai-coach-composer" onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Message your coach..."
        aria-label="Message your coach"
        maxLength={4000}
        disabled={disabled}
      />

      <button
        type="submit"
        className="ai-coach-send"
        aria-label="Send message"
        disabled={!input.trim() || disabled}
      >
        {loading ? (
          <LoaderCircle size={21} className="ai-coach-spinner" />
        ) : (
          <ArrowUp size={21} />
        )}
      </button>
    </form>
  );
}
