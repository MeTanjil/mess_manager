import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

import { FirebaseAuthProvider, useFirebaseAuth } from './FirebaseAuthContext';
import { MonthProvider } from './context/MonthContext';

import SignInSignUp from './components/SignInSignUp';
import SidebarLayout from './components/SidebarLayout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Meals from './pages/Meals';
import MealEntry from './components/MealEntry';
import Bazar from './pages/Bazar';
import Deposit from './pages/Deposit';
import MealRate from './pages/MealRate';
import Report from './pages/Report';
import Profile from './pages/Profile';
import ExpenseEntry from './components/ExpenseEntry';
import Toast from './components/Toast';

// Firebase Firestore instance
const db = getFirestore();

// Protected Route (লগইন ছাড়া অ্যাক্সেস করা যাবে না)
function ProtectedRoute({ children }) {
  const { user } = useFirebaseAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  // মেম্বার ডেটা ও টোস্ট (নোটিফিকেশন) স্টেট
  const [members, setMembers] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // টোস্ট দেখানোর ফাংশন
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2200);
  };

  // Firestore থেকে মেম্বার লোড
  useEffect(() => {
    const fetchMembers = async () => {
      const snapshot = await getDocs(collection(db, 'members'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(data);
    };
    fetchMembers();
  }, []);

  return (
    <FirebaseAuthProvider>
      <MonthProvider>
        <Router>
          {/* টোস্ট নোটিফিকেশন (সব পেজে) */}
          {toast.show && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ show: false, message: '', type: 'success' })}
            />
          )}
          <Routes>
            {/* লগইন পেজ */}
            <Route path="/login" element={<SignInSignUp />} />

            {/* মেইন অ্যাপ (সবার জন্য সাইডবার+ড্যাশবোর্ড) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <SidebarLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="members" element={<Members showToast={showToast} />} />
              <Route path="meals" element={<Meals members={members} />} />
              <Route path="meal-entry" element={<MealEntry members={members} showToast={showToast} />} />
              <Route path="expense-entry" element={<ExpenseEntry members={members} showToast={showToast} />} />
              <Route path="bazar" element={<Bazar showToast={showToast} />} />
              <Route path="deposit" element={<Deposit showToast={showToast} />} />
              <Route path="rate" element={<MealRate />} />
              <Route path="calc" element={<Report />} />
              <Route path="profile" element={<Profile showToast={showToast} />} />
              {/* Settings route চাইলে এখানে add করতে পারো */}
            </Route>

            {/* যেকোনো ভুল URL দিলে ড্যাশবোর্ডে যাবে */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </MonthProvider>
    </FirebaseAuthProvider>
  );
}

export default App;
