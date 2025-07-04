import React, { useEffect, useState } from 'react';
import { useMonth } from '../context/MonthContext';

export default function MessNameBar() {
  const { currentMonth } = useMonth();
  const [messNames, setMessNames] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('messNames') || '{}');
    setMessNames(data);
  }, []);

  useEffect(() => {
    setInputValue(messNames[currentMonth] || '');
  }, [currentMonth, messNames]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => setEditMode(false);

  const handleSave = () => {
    const newMessNames = { ...messNames, [currentMonth]: inputValue.trim() };
    setMessNames(newMessNames);
    localStorage.setItem('messNames', JSON.stringify(newMessNames));
    setEditMode(false);
  };

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '24px 0 16px 0',
      fontWeight: 'bold',
      fontSize: '1.6rem',
      letterSpacing: '1px',
      gap: '10px'
    }}>
      {editMode ? (
        <>
          <input
            type="text"
            value={inputValue}
            placeholder="Mess name"
            onChange={e => setInputValue(e.target.value)}
            style={{ fontSize: '1.1rem', padding: '4px 8px' }}
            autoFocus
          />
          <button onClick={handleSave} style={{ marginLeft: 6, padding: '3px 10px', fontSize: '1rem' }}>Save</button>
          <button onClick={handleCancel} style={{ marginLeft: 4, padding: '3px 10px', fontSize: '1rem' }}>Cancel</button>
        </>
      ) : (
        <>
          <span>
            {messNames[currentMonth] ? messNames[currentMonth] : "Mess Manager"}
          </span>
          <button
            onClick={handleEdit}
            style={{
              marginLeft: 10,
              padding: '2px 8px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
            title="Edit Name"
          >
            ✏️
          </button>
        </>
      )}
    </div>
  );
}
