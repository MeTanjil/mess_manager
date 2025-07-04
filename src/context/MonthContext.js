import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';

const MonthContext = createContext();
const db = getFirestore();

export function useMonth() {
  return useContext(MonthContext);
}

export function MonthProvider({ children }) {
  const [months, setMonths] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(null);

  useEffect(() => {
    const fetchMonths = async () => {
      const snap = await getDocs(collection(db, 'months'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMonths(data);
      if (data.length > 0 && !currentMonth) {
        setCurrentMonth(data[0].id); // default
      }
    };
    fetchMonths();
  }, []);

  const addMonth = async (name, id) => {
    const newMonth = { name, createdAt: new Date() };
    await addDoc(collection(db, 'months'), { ...newMonth, id });
    setMonths(prev => [...prev, { ...newMonth, id }]);
    setCurrentMonth(id);
  };

  const value = {
    months,
    currentMonth,
    setCurrentMonth,
    addMonth,
  };

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}
