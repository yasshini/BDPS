import { AlertCircle } from "lucide-react";

function ErrorMessage({ message, onRetry }) {
  return (
    <section className="load-error" role="alert">
      <span className="load-error-icon">
        <AlertCircle size={22} />
      </span>
      <div>
        <h1>Could not load the workspace</h1>
        <p>{message}</p>
        <button
          className="button button-primary"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      </div>
    </section>
  );
}

export default ErrorMessage;