import React, { useEffect, useState } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';
import { useFirebaseAuth } from '../FirebaseAuthContext'; // ← যদি auth context থাকে

const db = getFirestore();

export default function MessNameBar() {
  const { currentMonth } = useMonth();
  const { user } = useFirebaseAuth(); // ← ইউজার অবজেক্ট (uid)
  const [messName, setMessName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // 🔄 Mess Name load
  useEffect(() => {
    if (!user) return; // user না থাকলে ফাঁকা রাখো
    const fetchMessName = async () => {
      const docRef = doc(db, 'messNames', `${user.uid}_${currentMonth}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMessName(docSnap.data().messName);
      } else {
        setMessName('');
      }
    };
    fetchMessName();
  }, [currentMonth, user]);

  // Input always synced with messName
  useEffect(() => {
    setInputValue(messName || '');
  }, [messName]);

  // ✏️ Edit mode on
  const handleEdit = () => setEditMode(true);
  const handleCancel = () => setEditMode(false);

  // ✅ Save button
  const handleSave = async () => {
    if (!user) return;
    const value = inputValue.trim();
    await setDoc(
      doc(db, 'messNames', `${user.uid}_${currentMonth}`),
      { messName: value, userId: user.uid, month: currentMonth, updatedAt: new Date() }
    );
    setMessName(value);
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
      <span style={{
        fontSize: '1rem',
        color: '#33A8FF',
        fontWeight: 500,
        marginRight: '4px',
        letterSpacing: '0.07em'
      }}>
        Mess Name&nbsp;–
      </span>
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
            {messName ? messName : "Mess Manager"}
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
