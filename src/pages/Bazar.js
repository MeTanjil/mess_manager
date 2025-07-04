import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';
import ConfirmDialog from '../components/ConfirmDialog'; // ✅ import

const db = getFirestore();

export default function Bazar({ showToast }) {
  const [members, setMembers] = useState([]);
  const [date, setDate] = useState('');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [bazarList, setBazarList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const { currentMonth } = useMonth();

  // Modal state for delete confirmation
  const [confirmState, setConfirmState] = useState({ show: false, id: null, date: '', person: '' });

  useEffect(() => {
    const fetchMembers = async () => {
      const snapshot = await getDocs(collection(db, 'members'));
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    const fetchBazar = async () => {
      const snapshot = await getDocs(collection(db, 'bazar'));
      const allBazar = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBazarList(allBazar.filter(b => b.monthId === currentMonth));
    };
    if (currentMonth) fetchBazar();
  }, [currentMonth]);

  const resetForm = () => {
    setDate('');
    setPerson('');
    setAmount('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!date) {
      showToast && showToast("তারিখ দিন!", "error");
      return;
    }
    if (!person) {
      showToast && showToast("কে বাজার করেছে নির্বাচন করুন!", "warning");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      showToast && showToast("সঠিক টাকার পরিমাণ লিখুন (১ বা তার বেশি)!", "error");
      return;
    }

    if (editingId) {
      // Update
      await updateDoc(doc(db, 'bazar', editingId), {
        date,
        person,
        amount: Number(amount),
        monthId: currentMonth,
      });
      setBazarList(prev =>
        prev.map(b => b.id === editingId ? { ...b, date, person, amount: Number(amount) } : b)
      );
      showToast && showToast("বাজার এন্ট্রি আপডেট হয়েছে!", "success");
    } else {
      // Add new
      const docRef = await addDoc(collection(db, 'bazar'), {
        date,
        person,
        amount: Number(amount),
        monthId: currentMonth,
      });
      setBazarList(prev => [...prev, { id: docRef.id, date, person, amount: Number(amount), monthId: currentMonth }]);
      showToast && showToast("বাজার এন্ট্রি সফলভাবে সংরক্ষণ হয়েছে!", "success");
    }

    resetForm();
  };

  const handleEdit = (bazar) => {
    setDate(bazar.date);
    setPerson(bazar.person);
    setAmount(bazar.amount);
    setEditingId(bazar.id);
    showToast && showToast("এডিট মোডে আছো!", "info");
  };

  // Custom confirm delete
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'bazar', id));
    setBazarList(prev => prev.filter(b => b.id !== id));
    showToast && showToast("বাজার এন্ট্রি ডিলিট হয়েছে!", "success");
  };

  return (
    <div>
      <h2>🛒 বাজার এন্ট্রি</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <label>তারিখ: </label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <br /><br />
        <label>কে বাজার করেছে: </label>
        <select value={person} onChange={e => setPerson(e.target.value)}>
          <option value="">-- সদস্য নির্বাচন করুন --</option>
          {members.map(m => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
        <br /><br />
        <label>টাকার পরিমাণ: </label>
        <input
          type="number"
          min="0"
          step="1"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <br /><br />

        <button type="submit">{editingId ? "✏️ আপডেট করুন" : "✅ সেভ করুন"}</button>{' '}
        {editingId && <button type="button" onClick={resetForm}>❌ বাতিল</button>}
      </form>

      <hr />

      <h3>এই মাসের বাজারের তালিকা ({currentMonth}):</h3>
      {bazarList.length === 0 && <p>কোন বাজার এন্ট্রি নেই।</p>}
      <ul>
        {bazarList.sort((a, b) => a.date.localeCompare(b.date)).map(bazar => (
          <li key={bazar.id}>
            📅 {bazar.date} — 👤 {bazar.person} — 💸 {bazar.amount} টাকা{' '}
            <button onClick={() => handleEdit(bazar)}>✏️</button>{' '}
            <button onClick={() => setConfirmState({ show: true, id: bazar.id, date: bazar.date, person: bazar.person })}>🗑️</button>
          </li>
        ))}
      </ul>

      {/* Custom Confirm Modal */}
      <ConfirmDialog
        show={confirmState.show}
        message={
          <span>
            {confirmState.date && <>তারিখ: <b>{confirmState.date}</b><br /></>}
            {confirmState.person && <>কার: <b>{confirmState.person}</b><br /></>}
            আপনি কি নিশ্চিতভাবে এই বাজার এন্ট্রি ডিলিট করতে চান?
          </span>
        }
        onConfirm={async () => {
          await handleDelete(confirmState.id);
          setConfirmState({ show: false, id: null, date: '', person: '' });
        }}
        onCancel={() => setConfirmState({ show: false, id: null, date: '', person: '' })}
      />
    </div>
  );
}
