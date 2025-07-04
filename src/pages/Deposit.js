import React, { useEffect, useState } from 'react';
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

export default function Deposit({ showToast }) {
  const [date, setDate] = useState('');
  const [member, setMember] = useState('');
  const [amount, setAmount] = useState('');
  const [depositList, setDepositList] = useState([]);
  const [members, setMembers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const { currentMonth } = useMonth();

  // Custom confirm modal state
  const [confirmState, setConfirmState] = useState({ show: false, id: null, date: '', member: '' });

  useEffect(() => {
    const fetchMembers = async () => {
      const snapshot = await getDocs(collection(db, 'members'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(data);
    };
    fetchMembers();
  }, []);

  const fetchDeposits = async () => {
    const snapshot = await getDocs(collection(db, 'deposits'));
    const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const filtered = allData.filter(item => item.monthId === currentMonth);
    setDepositList(filtered);
  };

  useEffect(() => {
    if (currentMonth) {
      fetchDeposits();
    }
  }, [currentMonth]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!date) {
      showToast && showToast('তারিখ সিলেক্ট করুন!', 'error');
      return;
    }
    if (!member) {
      showToast && showToast('মেম্বার নির্বাচন করুন!', 'error');
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      showToast && showToast('সঠিক টাকার পরিমাণ লিখুন!', 'error');
      return;
    }

    try {
      if (editingId) {
        const ref = doc(db, 'deposits', editingId);
        await updateDoc(ref, {
          date,
          member,
          amount: parseFloat(amount),
          monthId: currentMonth,
        });
        showToast && showToast('জমা আপডেট হয়েছে!', 'success');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'deposits'), {
          date,
          member,
          amount: parseFloat(amount),
          monthId: currentMonth,
        });
        showToast && showToast('জমা সংরক্ষণ হয়েছে!', 'success');
      }

      setDate('');
      setMember('');
      setAmount('');
      fetchDeposits();
    } catch (err) {
      showToast && showToast('কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন!', 'error');
    }
  };

  const handleEdit = (item) => {
    setDate(item.date);
    setMember(item.member);
    setAmount(item.amount);
    setEditingId(item.id);
    showToast && showToast('এডিট মোডে আছেন!', 'info');
  };

  // Custom modal confirm for delete
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'deposits', id));
    fetchDeposits();
    showToast && showToast('জমা ডিলিট হয়েছে!', 'success');
  };

  return (
    <div>
      <h2>💰 জমা এন্ট্রি</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <label>তারিখ:</label><br />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <br /><br />
        <label>মেম্বারের নাম:</label><br />
        <select value={member} onChange={(e) => setMember(e.target.value)}>
          <option value="">-- সদস্য নির্বাচন করুন --</option>
          {members.map((m) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
        <br /><br />
        <label>টাকার পরিমাণ (৳):</label><br />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="টাকা"
        />
        <br /><br />

        <button type="submit">{editingId ? '✏️ আপডেট করুন' : '✅ সেভ করুন'}</button>
      </form>

      <h3>📅 {currentMonth} মাসের জমা তালিকা:</h3>
      {depositList.length === 0 ? (
        <p>এই মাসে কোনো জমা নেই।</p>
      ) : (
        <ul>
          {depositList.map((item) => (
            <li key={item.id}>
              📅 {item.date} — 👤 {item.member} — 💸 {item.amount} টাকা
              <button onClick={() => handleEdit(item)} style={{ marginLeft: 10 }}>✏️</button>
              <button
                onClick={() =>
                  setConfirmState({
                    show: true,
                    id: item.id,
                    date: item.date,
                    member: item.member,
                  })
                }
                style={{ marginLeft: 5, color: 'red' }}
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Custom Confirm Modal */}
      <ConfirmDialog
        show={confirmState.show}
        message={
          <span>
            {confirmState.date && <>তারিখ: <b>{confirmState.date}</b><br /></>}
            {confirmState.member && <>কার: <b>{confirmState.member}</b><br /></>}
            আপনি কি নিশ্চিতভাবে এই জমা ডিলিট করতে চান?
          </span>
        }
        onConfirm={async () => {
          await handleDelete(confirmState.id);
          setConfirmState({ show: false, id: null, date: '', member: '' });
        }}
        onCancel={() => setConfirmState({ show: false, id: null, date: '', member: '' })}
      />
    </div>
  );
}
