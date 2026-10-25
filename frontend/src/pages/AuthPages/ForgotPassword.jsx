import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Citrus, Eye, EyeOff } from "lucide-react";
import api from "../../api/axios";
import "./Login.css";

export default function ForgotPassword() {
  const [form, setForm] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (form.newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        email: form.email.trim(),
        newPassword: form.newPassword,
      });

      setMessage(response.data?.message || "Password updated successfully.");

      setForm({
        email: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section
        className="auth-visual"
        style={{
          backgroundImage:
            "linear-gradient(rgba(5,13,9,.35),rgba(5,13,9,.75)),url('/background.jpg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <Link to="/login" className="auth-brand">
          <span className="auth-brand-icon">
            <Citrus size={25} />
          </span>
          <span>
            Nourish<span className="auth-brand-dot">.</span>
          </span>
        </Link>

        <div className="auth-visual-copy">
          <span className="auth-kicker">ACCOUNT RECOVERY</span>
          <h1>
            A fresh start.
            <br />
            <span>A new password.</span>
          </h1>
          <p>Update your credentials and get back to your wellness journey.</p>
        </div>

        <div className="auth-visual-footer">
          <span className="auth-status-dot" />A little better, every day.
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-mobile-brand">
            <Citrus size={26} />
            <span>
              Nourish<span className="auth-brand-dot">.</span>
            </span>
          </div>

          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 28,
              color: "#a4b0a2",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>

          <div className="auth-heading">
            <span className="auth-kicker">RESET PASSWORD</span>
            <h2>
              Set a new <span>password.</span>
            </h2>
            <p>Enter your registered email and choose a new password.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
              />
            </label>

            <label className="auth-field">
              <span>New password</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  value={form.newPassword}
                  onChange={(event) =>
                    updateField("newPassword", event.target.value)
                  }
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="auth-field">
              <span>Confirm new password</span>
              <div className="auth-password-wrap">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {message && (
              <p className="auth-success" role="status">
                {message}{" "}
                <Link to="/login" style={{ color: "#b4f34a" }}>
                  Sign in
                </Link>
              </p>
            )}

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>

          <p className="auth-switch">
            Remembered your password? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
