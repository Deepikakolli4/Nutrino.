import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Citrus, Eye, EyeOff, ArrowRight } from "lucide-react";
import "./Login.css";
import api from "../../api/axios";
import backgroundImage from "../../assets/background.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const successMessage = location.state?.message;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      // Support common JWT response formats.
      const data = response.data;
      const token =
        typeof data === "string"
          ? data
          : (data?.token ?? data?.jwt ?? data?.accessToken);

      if (!token) {
        setError(
          "Login succeeded, but the JWT was not found in the server response.",
        );
        return;
      }

      localStorage.setItem("nourish_token", token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Login failed. Please check your email and password.";

      setError(message);
    }
  }

  return (
    <main className="auth-page">
      <section
        className="auth-visual"
        style={{
          "--auth-background-image": `url("${backgroundImage}")`,
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
          <span className="auth-kicker">YOUR JOURNEY, YOUR PACE</span>
          <h1>
            Eat well.
            <br />
            Feel <span>your best.</span>
          </h1>
          <p>
            Small choices, consistent habits, and a healthier relationship with
            food. Let's make every meal count.
          </p>
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

          <div className="auth-heading">
            <span className="auth-kicker">WELCOME BACK</span>
            <h2>
              Sign in to <span>Nourish.</span>
            </h2>
            <p>Pick up where your wellness journey left off.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            <div className="auth-form-options">
              {/* <label className="auth-remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label> */}
              <Link
                to="/forgot-password"
                className="auth-text-button"
                style={{ textDecoration: "none" }}
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="auth-submit">
              Sign in <ArrowRight size={18} />
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>

          <p className="auth-legal">
            By continuing, you agree to use Nourish responsibly and protect your
            account credentials.
          </p>
        </div>
      </section>
    </main>
  );
}
