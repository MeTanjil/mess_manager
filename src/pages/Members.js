import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import ConfirmDialog from '../components/ConfirmDialog'; // পাথ ঠিক থাকলে OK

const db = getFirestore();

export default function Members({ showToast }) {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  // Custom Confirm Dialog state
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

  // **Cascade Delete + Meal Doc Remove if empty**
  const handleDelete = async (id) => {
    const member = members.find(m => m.id === id);
    if (!member) return;

    // ১. মেম্বার ডিলিট
    await deleteDoc(doc(db, 'members', id));

    // ২. Meal Entry থেকে memberId remove (meals[id] ডিলিট), আর কেউ না থাকলে meal doc ডিলিট
    const mealsSnap = await getDocs(collection(db, 'meals'));
    for (const mealDoc of mealsSnap.docs) {
      const mealData = mealDoc.data();
      if (mealData.meals && mealData.meals[id]) {
        const updatedMeals = { ...mealData.meals };
        delete updatedMeals[id];

        if (Object.keys(updatedMeals).length === 0) {
          // meal doc ফাঁকা, পুরো doc ডিলিট
          await deleteDoc(doc(db, 'meals', mealDoc.id));
        } else {
          // অন্য মেম্বার meal আছে, শুধু update
          await updateDoc(doc(db, 'meals', mealDoc.id), { meals: updatedMeals });
        }
      }
    }

    // ৩. Bazar-এ member-এর entry ডিলিট (person === name)
    const bazarSnap = await getDocs(collection(db, 'bazar'));
    for (const entry of bazarSnap.docs) {
      if (entry.data().person === member.name) {
        await deleteDoc(doc(db, 'bazar', entry.id));
      }
    }

    // ৪. Deposits-এ member-এর entry ডিলিট (member === name)
    const depositSnap = await getDocs(collection(db, 'deposits'));
    for (const entry of depositSnap.docs) {
      if (entry.data().member === member.name) {
        await deleteDoc(doc(db, 'deposits', entry.id));
      }
    }

    fetchMembers();
    showToast && showToast("সদস্য এবং সংশ্লিষ্ট সব হিসাব ডিলিট হয়েছে!", "success");
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
        message={`${confirmState.name} - এই সদস্য এবং তার সব হিসাব ডিলিট করবেন?`}
        onConfirm={async () => {
          await handleDelete(confirmState.id);
          setConfirmState({ show: false, id: null, name: "" });
        }}
        onCancel={() => setConfirmState({ show: false, id: null, name: "" })}
      />
    </div>
  );
}
