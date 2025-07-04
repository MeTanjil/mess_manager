import React, { useState } from 'react';
import { useMonth } from '../context/MonthContext';

export default function MonthSelector() {
  const { months, currentMonth, setCurrentMonth, addMonth } = useMonth();
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');

  const handleAdd = () => {
    if (newName && newId) {
      addMonth(newName, newId);
      setNewName('');
      setNewId('');
    } else {
      alert("মাসের নাম ও আইডি দিন (যেমন: 2024-07)");
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label>চলতি মাস: </label>
      <select value={currentMonth || ''} onChange={(e) => setCurrentMonth(e.target.value)}>
        {months.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} ({m.id})
          </option>
        ))}
      </select>

      <div style={{ marginTop: 10 }}>
        <input
          placeholder="নতুন মাসের নাম"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          placeholder="ID (যেমন: 2024-07)"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
        />
        <button onClick={handleAdd}>নতুন মাস যোগ করুন</button>
      </div>
    </div>
  );
}
