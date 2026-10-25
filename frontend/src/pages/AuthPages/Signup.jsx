import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Citrus, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import "./Signup.css";
import api from "../../api/axios";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  }
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Your passwords don't match.");
      return;
    }

    if (!form.acceptedTerms) {
      setError("Please accept the terms to create your account.");
      return;
    }

    try {
      await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      // Registration succeeded. Let the user sign in.
      navigate("/login", {
        replace: true,
        state: { message: "Account created successfully. Please sign in." },
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Registration failed. This email may already be registered.";

      setError(message);
    }
  }

  return (
    <main className="auth-page signup-page">
      <section
        className="auth-visual"
        style={{
          "--auth-background-image": "url('/background.jpg')",
        }}
      >
        <Link to="/dashboard" className="auth-brand">
          <span className="auth-brand-icon">
            <Citrus size={25} />
          </span>
          <span>
            Nourish<span className="auth-brand-dot">.</span>
          </span>
        </Link>

        <div className="auth-visual-copy">
          <span className="auth-kicker">A FRESH START</span>
          <h1>
            Your health.
            <br />
            Your <span>kind of progress.</span>
          </h1>
          <p>
            Build habits that fit your life. Track your meals, understand your
            nutrition, and celebrate every small win.
          </p>

          <div className="signup-benefits">
            <div>
              <Check size={17} /> Personalized nutrition targets
            </div>
            <div>
              <Check size={17} /> Simple meal and progress tracking
            </div>
            <div>
              <Check size={17} /> Insights to support your routine
            </div>
          </div>
        </div>

        <div className="auth-visual-footer">
          <span className="auth-status-dot" />
          Your journey starts with one step.
        </div>
      </section>

      <section className="auth-form-side signup-form-side">
        <div className="auth-form-container signup-form-container">
          <div className="auth-mobile-brand">
            <Citrus size={26} />
            <span>
              Nourish<span className="auth-brand-dot">.</span>
            </span>
          </div>

          <div className="auth-heading">
            <span className="auth-kicker">GET STARTED</span>
            <h2>
              Create your <span>account.</span>
            </h2>
            <p>Join Nourish and make room for healthier habits.</p>
          </div>

          <form className="auth-form signup-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Full name</span>
              <input
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>

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
              <span>Password</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  minLength={8}
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
              <span>Confirm password</span>
              <div className="auth-password-wrap">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
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

            <label className="signup-terms">
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={(event) =>
                  updateField("acceptedTerms", event.target.checked)
                }
              />
              <span>I agree to the terms of service and privacy policy.</span>
            </label>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="auth-submit">
              Create account <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <p className="auth-legal">
            Your nutrition journey is personal. Keep your account credentials
            private and secure.
          </p>
        </div>
      </section>
    </main>
  );
}
