
import React from "react";
import { useToast } from "../context/ToastContext";

export default function ToastContainer() {
  const { toast } = useToast();
  if (!toast) return null;

  let bg = "#222";
  if (toast.type === "success") bg = "#2e7d32";
  else if (toast.type === "error") bg = "#c62828";
  else if (toast.type === "info") bg = "#1565c0";

  return (
    <div
      style={{
        position: "fixed",
        top: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: bg,
        color: "#fff",
        padding: "12px 32px",
        borderRadius: 8,
        zIndex: 10000,
        boxShadow: "0 4px 18px #0005",
        fontSize: 17,
        fontWeight: 500,
        minWidth: 190,
        textAlign: "center",
        opacity: 0.97,
      }}
    >
      {toast.message}
    </div>
  );
}
