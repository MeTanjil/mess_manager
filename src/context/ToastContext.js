import React, { createContext, useState, useCallback, useContext } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  // call: showToast("মেসেজ", "success"|"error"|"info")
  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// ব্যবহার করার জন্য হুক:
export function useToast() {
  return useContext(ToastContext);
}
