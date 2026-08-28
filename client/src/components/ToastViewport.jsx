import { useEffect, useState } from "react";

const TOAST_EVENT = "astumsj:toast";

export const showToast = (message, type = "error") => {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: { message, type },
  }));
};

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export default function ToastViewport() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let timeoutId;
    const handleToast = (event) => {
      window.clearTimeout(timeoutId);
      setToast({ ...event.detail, id: Date.now() });
      timeoutId = window.setTimeout(() => setToast(null), 5000);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="toast-viewport" aria-live="assertive" aria-atomic="true">
      <div className="modern-error-toast" role="alert">
        <span className="modern-error-toast__icon"><AlertIcon /></span>
        <div className="min-w-0 flex-1">
          <p className="modern-error-toast__title">Something went wrong</p>
          <p className="modern-error-toast__message">{toast.message}</p>
        </div>
        <button
          type="button"
          className="modern-error-toast__close"
          onClick={() => setToast(null)}
          aria-label="Dismiss error"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  );
}