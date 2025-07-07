import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';

const db = getFirestore();

export default function ExpenseEntry({ members, showToast }) {
  const { currentMonth } = useMonth();
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [type, setType] = useState('shared');
  const [payerId, setPayerId] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [editId, setEditId] = useState(null);

  // খরচের তালিকা লোড
  const fetchExpenses = async () => {
    const q = query(collection(db, 'expenses'), where('monthId', '==', currentMonth));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setExpenses(data.sort((a, b) => (a.date < b.date ? 1 : -1)));
  };

  useEffect(() => {
    if (currentMonth) fetchExpenses();
    // eslint-disable-next-line
  }, [currentMonth]);

  // খরচ সেভ বা আপডেট
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date || !amount || !purpose) {
      showToast("সব ঘর পূরণ করুন!", "error");
      return;
    }

    // এখন দুই type-ই payerId লাগবে
    if (!payerId) {
      showToast("কে টাকা দিয়েছে সেটি নির্বাচন করুন!", "error");
      return;
    }

    try {
      if (editId) {
        // Update
        await updateDoc(doc(db, 'expenses', editId), {
          date,
          amount: Number(amount),
          purpose,
          type,
          payerId,
          monthId: currentMonth,
        });
        showToast("খরচ আপডেট হয়েছে!", "success");
      } else {
        // Add
        await addDoc(collection(db, 'expenses'), {
          date,
          amount: Number(amount),
          purpose,
          type,
          payerId,
          monthId: currentMonth,
        });
        showToast("খরচ সংরক্ষণ হয়েছে!", "success");
      }

      setDate('');
      setAmount('');
      setPurpose('');
      setType('shared');
      setPayerId('');
      setEditId(null);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      showToast("সেভ করতে সমস্যা হয়েছে!", "error");
    }
  };

  // সদস্য নাম বের করা
  const getMemberName = (id) => {
    const m = members.find(m => m.id === id);
    return m ? m.name : '';
  };

  // Delete expense
  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিত? ডিলিট করলে আর ফেরত পাবেন না!")) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      showToast("খরচ ডিলিট হয়েছে!", "success");
      fetchExpenses();
    } catch (err) {
      console.error(err);
      showToast("ডিলিট করতে সমস্যা হয়েছে!", "error");
    }
  };

  // Edit expense
  const handleEdit = (exp) => {
    setEditId(exp.id);
    setDate(exp.date);
    setAmount(exp.amount);
    setPurpose(exp.purpose);
    setType(exp.type);
    setPayerId(exp.payerId || '');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditId(null);
    setDate('');
    setAmount('');
    setPurpose('');
    setType('shared');
    setPayerId('');
  };

  return (
    <div>
      <h2>💰 খরচ এন্ট্রি</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>তারিখ:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div>
          <label>পরিমাণ:</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>
        <div>
          <label>কারণ:</label>
          <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} required />
        </div>
        <div>
          <label>খরচের ধরন:</label>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="shared">Shared</option>
            <option value="individual">Individual</option>
          </select>
        </div>
        {/* এখন দুই type-ই payerId চাইবে */}
        <div>
          <label>কে টাকা দিল?</label>
          <select value={payerId} onChange={e => setPayerId(e.target.value)}>
            <option value="">সদস্য নির্বাচন করুন</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" style={{ marginTop: 10 }}>
          {editId ? "✏️ আপডেট করুন" : "✅ সংরক্ষণ করুন"}
        </button>
        {editId && (
          <button type="button" onClick={handleCancelEdit} style={{ marginLeft: 10 }}>
            বাতিল
          </button>
        )}
      </form>

      {/* নিচে খরচের ডিটেইল টেবিল */}
      <h3 style={{ marginTop: 40 }}>🧾 খরচের তালিকা</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480, marginTop: 10 }}>
          <thead>
            <tr style={{ background: '#e7eaf6' }}>
              <th style={{ border: '1px solid #bbb', padding: '7px' }}>তারিখ</th>
              <th style={{ border: '1px solid #bbb', padding: '7px' }}>পরিমাণ</th>
              <th style={{ border: '1px solid #bbb', padding: '7px' }}>ধরন</th>
              <th style={{ border: '1px solid #bbb', padding: '7px' }}>কে দিল</th>
              <th style={{ border: '1px solid #bbb', padding: '7px' }}>কারণ</th>
              <th style={{ border: '1px solid #bbb', padding: '7px' }}>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 15, color: '#888' }}>
                  কোনো খরচ এন্ট্রি নেই
                </td>
              </tr>
            ) : (
              expenses.map(exp => (
                <tr key={exp.id}>
                  <td style={{ border: '1px solid #ddd', padding: '7px', textAlign: 'center' }}>{exp.date}</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px', textAlign: 'right' }}>{exp.amount} টাকা</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px', textAlign: 'center' }}>
                    {exp.type === 'shared' ? 'Shared' : 'Individual'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '7px', textAlign: 'center' }}>
                    {getMemberName(exp.payerId)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '7px', textAlign: 'center' }}>{exp.purpose}</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px', textAlign: 'center' }}>
                    <button
                      style={{ marginRight: 8, color: "#1976d2", border: "none", background: "none", cursor: "pointer" }}
                      onClick={() => handleEdit(exp)}
                    >
                      ✏️
                    </button>
                    <button
                      style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}
                      onClick={() => handleDelete(exp.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== Member Delete করলে তার সব Expense অটো ডিলিট করার ফাংশন =====

export async function deleteMemberExpenses(memberId) {
  const db = getFirestore();
  const expenseQuery = query(collection(db, 'expenses'), where('payerId', '==', memberId));
  const expenseSnap = await getDocs(expenseQuery);
  for (const docu of expenseSnap.docs) {
    await deleteDoc(doc(db, 'expenses', docu.id));
  }
}
