import React, { useEffect, useState } from "react";

export default function Toast({ message, type = "success", onClose }) {
  // Light/dark mode detect
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(m.matches);
    const handler = (e) => setIsDark(e.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);

  // Fade in/out animation
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (type !== "info") {
      const t = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(t);
    }
  }, [type]);
  useEffect(() => {
    if (!show) {
      setTimeout(() => onClose && onClose(), 200);
    }
  }, [show, onClose]);

  // Theme colors
  let bg = isDark ? "#23272e" : "#f5f5f5";
  let color = isDark ? "#fff" : "#1d1d1d";
  if (type === "success") {
    bg = isDark ? "#245a36" : "#d0ffd7";
    color = isDark ? "#baffdc" : "#217a3a";
  }
  if (type === "error") {
    bg = isDark ? "#5a2222" : "#ffe5e5";
    color = isDark ? "#ffbbbb" : "#c62828";
  }
  if (type === "info") {
    bg = isDark ? "#184272" : "#e2f0fe";
    color = isDark ? "#c6e2ff" : "#1a4d8e";
  }
  if (type === "warning") {
    bg = isDark ? "#5a4917" : "#fffbe0";
    color = isDark ? "#fffcc5" : "#f9a825";
  }

  return (
    <div
      onClick={() => { setShow(false); }}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        background: bg,
        color: color,
        padding: "18px 42px 18px 24px",
        borderRadius: 13,
        zIndex: 9999,
        fontWeight: 600,
        fontSize: 17,
        minWidth: 200,
        maxWidth: 360,
        width: "auto",
        textAlign: "center",
        boxShadow: "0 6px 32px #0005",
        opacity: show ? 0.98 : 0,
        transition: "opacity 0.22s cubic-bezier(.68,-0.55,.27,1.55)",
        cursor: "pointer",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        boxSizing: "border-box",
        overflowWrap: "break-word",
        pointerEvents: show ? "auto" : "none",
      }}
      role="alert"
    >
      <span style={{ display: "inline-block", lineHeight: 1.4 }}>
        {message}
      </span>
      {/* Close button */}
      <button
        onClick={e => {
          e.stopPropagation();
          setShow(false);
        }}
        aria-label="Close"
        style={{
          position: "absolute",
          top: 6,
          right: 12,
          width: 26,
          height: 26,
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
