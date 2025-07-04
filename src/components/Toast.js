import React from "react";

export default function Toast({ message, type = "success", onClose }) {
  let bg = "#323232";
  if (type === "success") bg = "#388e3c";
  if (type === "error") bg = "#d32f2f";
  if (type === "info") bg = "#1976d2";
  if (type === "warning") bg = "#f9a825";
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        background: bg,
        color: "#fff",
        padding: "20px 45px",
        borderRadius: 14,
        zIndex: 9999,
        fontWeight: 600,
        fontSize: 18,
        minWidth: 240,
        textAlign: "center",
        boxShadow: "0 6px 32px #0005",
        opacity: 0.98,
        animation: "fadein 0.3s",
        cursor: "pointer"
      }}
      onClick={onClose}
    >
      {message}
    </div>
  );
}
