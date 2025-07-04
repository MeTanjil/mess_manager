import React from "react";

export default function ConfirmDialog({ show, message, onConfirm, onCancel }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 4px 32px #0002",
        padding: "30px 26px 18px 26px",
        minWidth: 300,
        textAlign: "center"
      }}>
        <div style={{ fontWeight: 600, fontSize: 19, marginBottom: 18 }}>
          ⚠️ সতর্কতা
        </div>
        <div style={{ marginBottom: 28, color: "#222", fontSize: 16 }}>
          {message}
        </div>
        <button
          onClick={onConfirm}
          style={{
            background: "#e53935", color: "#fff", border: "none", borderRadius: 5, padding: "8px 22px", fontWeight: 600, marginRight: 10, cursor: "pointer"
          }}
        >
          ডিলিট করুন
        </button>
        <button
          onClick={onCancel}
          style={{
            background: "#e0e0e0", color: "#333", border: "none", borderRadius: 5, padding: "8px 22px", fontWeight: 500, cursor: "pointer"
          }}
        >
          বাতিল
        </button>
      </div>
    </div>
  );
}
