import React, { useEffect, useState } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';
import { useFirebaseAuth } from '../FirebaseAuthContext'; // (ensure your auth context is working)

const db = getFirestore();

export default function MessNameBar() {
  const { currentMonth } = useMonth();
  const { user } = useFirebaseAuth(); // user object with uid
  const [messName, setMessName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Load Mess Name from Firestore
  useEffect(() => {
    if (!user || !currentMonth) return;
    const fetchMessName = async () => {
      const docRef = doc(db, 'messNames', `${user.uid}_${currentMonth}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMessName(docSnap.data().messName || '');
      } else {
        setMessName('');
      }
    };
    fetchMessName();
  }, [user, currentMonth]);

  // Sync input with messName
  useEffect(() => {
    setInputValue(messName || '');
  }, [messName]);

  // Edit & Cancel
  const handleEdit = () => setEditMode(true);
  const handleCancel = () => setEditMode(false);

  // Save to Firestore
  const handleSave = async () => {
    if (!user || !currentMonth) return;
    const value = inputValue.trim();
    await setDoc(
      doc(db, 'messNames', `${user.uid}_${currentMonth}`),
      {
        messName: value,
        userId: user.uid,
        month: currentMonth,
        updatedAt: new Date()
      }
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
      margin: '22px 0 15px 0',
      fontWeight: 'bold',
      fontSize: '1.35rem',
      letterSpacing: '1px',
      gap: '10px',
      background: 'linear-gradient(90deg, #f9e7ee 0%, #eaf6fb 100%)',
      borderRadius: '18px',
      border: '1.2px solid #f4d9ea',
      boxShadow: '0 2px 8px 0 #efe9f980',
      padding: '9px 15px 9px 20px'
    }}>
      <span style={{
        fontSize: '1.03rem',
        color: '#a284a2',
        fontWeight: 600,
        marginRight: '5px',
        letterSpacing: '0.06em',
        fontFamily: 'Segoe UI, Ubuntu, Arial, sans-serif'
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
            style={{
              fontSize: '1.05rem',
              padding: '4px 10px',
              border: '1px solid #e5cad7',
              borderRadius: 5,
              background: '#faf8fa',
              outline: 'none'
            }}
            autoFocus
          />
          <button
            onClick={handleSave}
            style={{
              marginLeft: 6,
              padding: '3px 12px',
              fontSize: '1rem',
              background: '#f4b6c2',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 4px 0 #e7b9d180'
            }}
          >Save</button>
          <button
            onClick={handleCancel}
            style={{
              marginLeft: 4,
              padding: '3px 12px',
              fontSize: '1rem',
              background: '#fff',
              color: '#a284a2',
              border: '1.5px solid #e3cbe4',
              borderRadius: 5,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >Cancel</button>
        </>
      ) : (
        <>
          <span style={{
            color: '#5c4764',
            letterSpacing: '0.07em'
          }}>
            {messName ? messName : "Mess Manager"}
          </span>
          <button
            onClick={handleEdit}
            style={{
              marginLeft: 10,
              padding: '2px 8px',
              fontSize: '1.02rem',
              cursor: 'pointer',
              borderRadius: 5,
              background: '#f5f1fa',
              color: '#a284a2',
              border: '1.2px solid #ecd7f8',
              fontWeight: 500,
              transition: 'all 0.15s'
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
