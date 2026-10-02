import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { api } from "../../api/api";
import { isValidPassword, PASSWORD_REQUIREMENTS } from "../../utils/passwordPolicy";
import "./Login.css";

function PasswordRequirements({ password }) {
  return (
    <ul aria-label="Password requirements" className="password-requirements">
      {PASSWORD_REQUIREMENTS.map(({ label, test }) => {
        const valid = test(password);
        return (
          <li className={valid ? "valid" : ""} key={label}>
            <Check aria-hidden="true" size={14} />
            {label}
          </li>
        );
      })}
    </ul>
  );
}

function Login({
  adminExists,
  onAuthenticated,
  onClose,
}) {
  const [mode, setMode] = useState(adminExists ? "login" : "register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSubmitting, onClose]);

  function changeMode(nextMode) {
    setError("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setMode(nextMode);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        if (!isValidPassword(password)) {
          throw new Error("Password does not meet the requirements.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const user = await api.registerAdmin({
          username,
          email,
          password,
        });
        await onAuthenticated(user);
      } else if (mode === "login") {
        await api.login({ username, password }).then(onAuthenticated);
      }
    } catch (submitError) {
      if (submitError.code === "ADMIN_ALREADY_EXISTS") {
        changeMode("login");
      }
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = {
    register: "Create Admin Account",
    login: "Admin Login",
  }[mode];

  return (
    <div
      className="auth-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        aria-labelledby="auth-modal-title"
        aria-modal="true"
        className="auth-modal"
        role="dialog"
      >
        <button
          aria-label="Close"
          className="auth-modal-close"
          disabled={isSubmitting}
          onClick={onClose}
          type="button"
        >
          <X size={19} />
        </button>
        <img alt="" className="login-logo" src="/bdps-logo.png" />
        <p className="login-eyebrow">BIKE DOCTOR PIT STOP</p>
        <h2 id="auth-modal-title">{title}</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label htmlFor="admin-username">Username</label>
              <input
                autoComplete="username"
                autoFocus
                id="admin-username"
                maxLength={64}
                onChange={(event) => setUsername(event.target.value)}
                required
                value={username}
              />
              <label htmlFor="admin-email">Email</label>
              <input
                autoComplete="email"
                id="admin-email"
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </>
          )}
          {mode === "login" && (
            <>
              <label htmlFor="admin-login-username">Username</label>
              <input
                autoComplete="username"
                autoFocus
                id="admin-login-username"
                maxLength={64}
                onChange={(event) => setUsername(event.target.value)}
                required
                type="text"
                value={username}
              />
            </>
          )}
          {(mode === "register" || mode === "login") && (
            <>
              <label htmlFor="admin-password">Password</label>
              <div className="password-input-wrap">
                <input
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  id="admin-password"
                  minLength={mode === "login" ? undefined : 6}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="password-visibility-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                </button>
              </div>
              {mode === "register" && password.length > 0 && (
                <PasswordRequirements password={password} />
              )}
              {mode === "register" && (
                <>
                  <label htmlFor="admin-confirm-password">Repeat password</label>
                  <div className="password-input-wrap">
                    <input
                      autoComplete="new-password"
                      id="admin-confirm-password"
                      minLength={6}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                    />
                    <button
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      aria-pressed={showConfirmPassword}
                      className="password-visibility-toggle"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      type="button"
                    >
                      {showConfirmPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {error && <p className="login-error" role="alert">{error}</p>}

          <button
            className="button button-primary login-submit"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Please wait…"
              : mode === "register"
                ? "Create Account"
                : "Login"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Login;
