import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';
import ConfirmDialog from '../components/ConfirmDialog'; // ✅ import

const db = getFirestore();

export default function Meals({ showToast }) {
  const [members, setMembers] = useState([]);
  const [savedMeals, setSavedMeals] = useState([]);
  const [editingMealId, setEditingMealId] = useState(null);
  const [editData, setEditData] = useState({});
  const { currentMonth } = useMonth();
  const [error, setError] = useState('');
  // ConfirmDialog state
  const [confirmState, setConfirmState] = useState({ show: false, id: null, date: "" });

  // সদস্য লোড
  useEffect(() => {
    const fetchMembers = async () => {
      const snapshot = await getDocs(collection(db, 'members'));
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchMembers();
  }, []);

  // Meal লোড
  useEffect(() => {
    const fetchSavedMeals = async () => {
      const snapshot = await getDocs(collection(db, 'meals'));
      const allMeals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedMeals(allMeals.filter(m => m.monthId === currentMonth));
    };
    if (currentMonth) fetchSavedMeals();
  }, [currentMonth]);

  // Delete (Custom Confirm)
  const handleDelete = async (mealId) => {
    await deleteDoc(doc(db, 'meals', mealId));
    setSavedMeals(prev => prev.filter(m => m.id !== mealId));
    showToast && showToast("মিল ডিলিট হয়েছে!", "success");
  };

  // Edit শুরু
  const handleEdit = (meal) => {
    setEditingMealId(meal.id);
    setEditData(meal.meals);
    setError('');
    showToast && showToast("এডিট মোডে আছেন!", "info");
  };

  // Edit ইনপুট পরিবর্তন
  const handleEditChange = (memberId, type, value) => {
    setEditData(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [type]: value
      }
    }));
  };

  // Edit সেভ
  const handleSaveEdit = async () => {
    // কমপক্ষে একজন সদস্যের অন্তত একবেলা meal থাকতে হবে
    const mealEntered = Object.values(editData).some(
      m => Number(m.breakfast) > 0 || Number(m.lunch) > 0 || Number(m.dinner) > 0
    );
    if (!mealEntered) {
      setError("কমপক্ষে একজনের জন্য অন্তত একবেলা meal লিখুন!");
      showToast && showToast("কমপক্ষে একজনের জন্য meal দিতে হবে!", "error");
      return;
    }

    const docRef = doc(db, 'meals', editingMealId);
    await updateDoc(docRef, {
      meals: editData
    });
    // আপডেট UI
    setSavedMeals(prev =>
      prev.map(m => m.id === editingMealId ? { ...m, meals: editData } : m)
    );
    setEditingMealId(null);
    setEditData({});
    setError('');
    showToast && showToast("মিল আপডেট হয়েছে!", "success");
  };

  return (
    <div>
      <h2>📅 সেভকৃত মিল তালিকা ({currentMonth || "নির্বাচিত নয়"})</h2>
      {savedMeals.length === 0 && <p>এই মাসে এখনও কোন মিল এন্ট্রি নেই।</p>}

      {savedMeals
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(meal => (
          <div key={meal.id} style={{ marginBottom: 20, borderBottom: "1px solid #ccc", paddingBottom: 10 }}>
            <strong>📅 {meal.date}</strong>
            {editingMealId === meal.id ? (
              <div style={{ marginLeft: 20 }}>
                {members.map(m => (
                  <div key={m.id}>
                    👤 <strong>{m.name}</strong><br />
                    নাস্তা: <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editData[m.id]?.breakfast || ''}
                      onChange={e => handleEditChange(m.id, 'breakfast', e.target.value)}
                      style={{ width: 50 }}
                    />
                    দুপুর: <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editData[m.id]?.lunch || ''}
                      onChange={e => handleEditChange(m.id, 'lunch', e.target.value)}
                      style={{ width: 50 }}
                    />
                    রাত: <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editData[m.id]?.dinner || ''}
                      onChange={e => handleEditChange(m.id, 'dinner', e.target.value)}
                      style={{ width: 50 }}
                    />
                    <br /><br />
                  </div>
                ))}
                {error && (
                  <div style={{
                    color: 'red',
                    marginBottom: 10,
                    fontWeight: '500',
                    fontSize: '1.08em'
                  }}>
                    ⚠️ {error}
                  </div>
                )}
                <button onClick={handleSaveEdit}>✅ আপডেট করুন</button>{' '}
                <button onClick={() => { setEditingMealId(null); setEditData({}); setError(''); }}>❌ বাতিল</button>
              </div>
            ) : (
              <>
                <ul style={{ marginLeft: 20 }}>
                  {Object.entries(meal.meals).map(([mid, mealObj]) => {
                    const memberName = members.find(mem => mem.id === mid)?.name || mid;
                    return (
                      <li key={mid}>
                        👤 {memberName} — 🍽️ নাস্তা: {mealObj.breakfast || 0}, দুপুর: {mealObj.lunch || 0}, রাত: {mealObj.dinner || 0}
                      </li>
                    );
                  })}
                </ul>
                <div style={{ marginTop: 5 }}>
                  <button onClick={() => handleEdit(meal)} style={{ marginRight: 10 }}>✏️ Edit</button>
                  <button onClick={() => setConfirmState({ show: true, id: meal.id, date: meal.date })}>🗑️ Delete</button>
                </div>
              </>
            )}
          </div>
        ))}

      {/* Custom Confirm Modal */}
      <ConfirmDialog
        show={confirmState.show}
        message={`তারিখ: ${confirmState.date} - এই মিলটি ডিলিট করবেন?`}
        onConfirm={async () => {
          await handleDelete(confirmState.id);
          setConfirmState({ show: false, id: null, date: "" });
        }}
        onCancel={() => setConfirmState({ show: false, id: null, date: "" })}
      />
    </div>
  );
}
