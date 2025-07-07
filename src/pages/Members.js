import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import ConfirmDialog from '../components/ConfirmDialog';

const db = getFirestore();

export default function Members({ showToast }) {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [confirmState, setConfirmState] = useState({ show: false, id: null, name: "" });

  // সদস্য লোড
  const fetchMembers = async () => {
    const snapshot = await getDocs(collection(db, 'members'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setMembers(data);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // সদস্য যোগ/আপডেট
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast && showToast("নাম দিতে হবে!", "error");
      return;
    }
    if (editId) {
      const ref = doc(db, 'members', editId);
      await updateDoc(ref, { name });
      setEditId(null);
      showToast && showToast("সদস্য আপডেট হয়েছে!", "success");
    } else {
      await addDoc(collection(db, 'members'), { name });
      showToast && showToast("নতুন সদস্য যোগ হয়েছে!", "success");
    }
    setName('');
    fetchMembers();
  };

  // এডিট
  const handleEdit = (m) => {
    setName(m.name);
    setEditId(m.id);
    showToast && showToast("এডিট মোডে আছেন!", "info");
  };

  // **Cascade Batch Delete: Member + Meals + Bazar + Deposit + Expenses**
  const handleDelete = async (id) => {
    const member = members.find(m => m.id === id);
    if (!member) return;

    // ১. Member ডিলিট (direct)
    await deleteDoc(doc(db, 'members', id));

    // ২. Meals: memberId remove (batch update) + ফাঁকা হলে doc delete (batch)
    const mealsSnap = await getDocs(collection(db, 'meals'));
    const mealsBatch = writeBatch(db);
    mealsSnap.forEach(mealDoc => {
      const mealData = mealDoc.data();
      if (mealData.meals && mealData.meals[id]) {
        let updatedMeals = { ...mealData.meals };
        delete updatedMeals[id];
        if (Object.keys(updatedMeals).length === 0) {
          mealsBatch.delete(doc(db, 'meals', mealDoc.id));
        } else {
          mealsBatch.update(doc(db, 'meals', mealDoc.id), { meals: updatedMeals });
        }
      }
    });
    await mealsBatch.commit();

    // ৩. Bazar: person === member.name (batch delete)
    const bazarQuery = query(collection(db, 'bazar'), where('person', '==', member.name));
    const bazarSnap = await getDocs(bazarQuery);
    const bazarBatch = writeBatch(db);
    bazarSnap.forEach(entry => {
      bazarBatch.delete(doc(db, 'bazar', entry.id));
    });
    await bazarBatch.commit();

    // ৪. Deposits: member === member.name (batch delete)
    const depositQuery = query(collection(db, 'deposits'), where('member', '==', member.name));
    const depositSnap = await getDocs(depositQuery);
    const depositBatch = writeBatch(db);
    depositSnap.forEach(entry => {
      depositBatch.delete(doc(db, 'deposits', entry.id));
    });
    await depositBatch.commit();

    // ৫. Expenses: payerId === member.id (batch delete)
    const expenseQuery = query(collection(db, 'expenses'), where('payerId', '==', member.id));
    const expenseSnap = await getDocs(expenseQuery);
    const expenseBatch = writeBatch(db);
    expenseSnap.forEach(entry => {
      expenseBatch.delete(doc(db, 'expenses', entry.id));
    });
    await expenseBatch.commit();

    fetchMembers();
    showToast && showToast("সদস্য এবং সংশ্লিষ্ট সব হিসাব দ্রুত ডিলিট হয়েছে!", "success");
  };

  return (
    <div>
      <h2>👥 সদস্য তালিকা</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="নাম লিখুন"
          required
        />
        <button type="submit">{editId ? 'আপডেট করুন' : 'সদস্য যোগ করুন'}</button>
      </form>

      <ul>
        {members.map(m => (
          <li key={m.id}>
            {m.name} &nbsp;
            <button onClick={() => handleEdit(m)}>এডিট</button>
            <button onClick={() => setConfirmState({ show: true, id: m.id, name: m.name })} style={{ color: 'red' }}>ডিলিট</button>
          </li>
        ))}
      </ul>

      {/* Custom Delete Confirm Modal */}
      <ConfirmDialog
        show={confirmState.show}
        message={
          <span>
            {confirmState.name} - এই সদস্য এবং তার সব হিসাব দ্রুত ডিলিট করবেন?<br />
            <span style={{ color: 'red' }}>সতর্কতা: সব meal, expense, bazar, deposit ডিলিট হবে।</span>
          </span>
        }
        onConfirm={async () => {
          await handleDelete(confirmState.id);
          setConfirmState({ show: false, id: null, name: "" });
        }}
        onCancel={() => setConfirmState({ show: false, id: null, name: "" })}
      />
    </div>
  );
}
