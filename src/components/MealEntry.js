import React, { useState } from 'react';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';

const db = getFirestore();

export default function MealEntry({ members, showToast }) {
  const [date, setDate] = useState('');
  const [mealData, setMealData] = useState({});
  const { currentMonth } = useMonth();

  const handleChange = (memberId, type, value) => {
    setMealData(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], [type]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date) {
      showToast("তারিখ দিন!", "error");
      return;
    }

    if (members.length === 0) {
      showToast("কোনো সদস্য নেই!", "error");
      return;
    }

    const mealEntered = Object.values(mealData).some(
      m => Number(m.breakfast) > 0 || Number(m.lunch) > 0 || Number(m.dinner) > 0
    );
    if (!mealEntered) {
      showToast("কমপক্ষে একজনের জন্য অন্তত একবেলা মিল লিখুন!", "warning");
      return;
    }

    try {
      // আগের meal এন্ট্রি চেক করুন
      const snapshot = await getDocs(collection(db, 'meals'));
      const alreadyExists = snapshot.docs.some(doc => doc.data().date === date);

      if (alreadyExists) {
        showToast("এই তারিখে ইতিমধ্যেই meal entry রয়েছে!", "warning");
        return;
      }

      // নতুন এন্ট্রি যুক্ত করুন
      await addDoc(collection(db, 'meals'), {
        date,
        monthId: currentMonth,
        meals: mealData
      });

      setDate('');
      setMealData({});
      showToast("মিল সংরক্ষণ হয়েছে!", "success");
    } catch (err) {
      console.error(err);
      showToast("একটি সমস্যা হয়েছে!", "error");
    }
  };

  return (
    <div>
      <h2>🍽️ মিল এন্ট্রি</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <label>তারিখ:</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          style={{ marginLeft: 10, marginBottom: 10 }}
        />

        {members.length === 0 && (
          <p style={{ color: "red" }}>কোনো সদস্য নেই, আগে সদস্য যোগ করুন।</p>
        )}

        {members.map(member => (
          <div key={member.id} style={{ marginBottom: 10 }}>
            <strong>{member.name}</strong><br />
            নাস্তা:
            <input
              type="number"
              min="0"
              step="0.5"
              value={mealData[member.id]?.breakfast || ''}
              onChange={e => handleChange(member.id, 'breakfast', e.target.value)}
              style={{ width: 50, marginRight: 10 }}
            />
            দুপুর:
            <input
              type="number"
              min="0"
              step="0.5"
              value={mealData[member.id]?.lunch || ''}
              onChange={e => handleChange(member.id, 'lunch', e.target.value)}
              style={{ width: 50, marginRight: 10 }}
            />
            রাত:
            <input
              type="number"
              min="0"
              step="0.5"
              value={mealData[member.id]?.dinner || ''}
              onChange={e => handleChange(member.id, 'dinner', e.target.value)}
              style={{ width: 50 }}
            />
          </div>
        ))}

        <button type="submit" style={{ marginTop: 10 }}>✅ সেভ করুন</button>
      </form>
    </div>
  );
}
