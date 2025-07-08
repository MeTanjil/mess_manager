import React, { useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";

export default function ToastContainer() {
  const { toast, closeToast } = useToast();
  const [show, setShow] = useState(!!toast);

  // Fade in/out
  useEffect(() => {
    if (toast) {
      setShow(true);
      // auto close after 2.5s unless it's info (info stays until manually closed)
      if (toast.type !== "info") {
        const t = setTimeout(() => setShow(false), 2500);
        return () => clearTimeout(t);
      }
    } else {
      setShow(false);
    }
  }, [toast]);

  // Remove from DOM after fade-out
  useEffect(() => {
    if (!show && toast) {
      const t = setTimeout(() => closeToast && closeToast(), 220);
      return () => clearTimeout(t);
    }
  }, [show, toast, closeToast]);

  // Light/dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const match = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(match.matches);
    const handler = (e) => setIsDark(e.matches);
    match.addEventListener("change", handler);
    return () => match.removeEventListener("change", handler);
  }, []);

  if (!toast) return null;

  let bg = isDark ? "#212b36" : "#f5f5f5";
  let color = isDark ? "#fff" : "#222";
  if (toast.type === "success") {
    bg = isDark ? "#245a36" : "#d0ffd7";
    color = isDark ? "#d5ffef" : "#217a3a";
  } else if (toast.type === "error") {
    bg = isDark ? "#4d2020" : "#ffe3e3";
    color = isDark ? "#ffbbbb" : "#c62828";
  } else if (toast.type === "info") {
    bg = isDark ? "#0c2238" : "#e4f1ff";
    color = isDark ? "#97c6f9" : "#1a3d71";
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: bg,
        color: color,
        padding: "13px 36px 13px 20px",
        borderRadius: 11,
        zIndex: 10000,
        boxShadow: "0 6px 32px #0003",
        fontSize: 17,
        fontWeight: 500,
        minWidth: 180,
        maxWidth: 360,
        width: "auto",
        textAlign: "center",
        opacity: show ? 1 : 0,
        transition: "opacity 0.22s cubic-bezier(.68,-0.55,.27,1.55)",
        pointerEvents: "auto",
        userSelect: "none",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        boxSizing: "border-box",
        overflowWrap: "break-word",
      }}
      role="alert"
    >
      <span style={{ display: "inline-block", lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <button
        onClick={() => {
          setShow(false);
          setTimeout(() => closeToast && closeToast(), 220);
        }}
        aria-label="Close notification"
        style={{
          position: "absolute",
          top: 5,
          right: 10,
          width: 28,
          height: 28,
          border: "none",
          outline: "none",
          background: "none",
          color: color,
          fontSize: 22,
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          borderRadius: "50%",
          opacity: 0.7,
          transition: "background 0.13s, opacity 0.2s",
        }}
        onMouseOver={e => (e.currentTarget.style.opacity = "1")}
        onMouseOut={e => (e.currentTarget.style.opacity = "0.7")}
      >
        ×
      </button>
    </div>
  );
}
