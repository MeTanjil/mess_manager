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

const db = getFirestore();

// লগইন ছাড়া অ্যাক্সেস করা যাবে না
function ProtectedRoute({ children }) {
  const { user } = useFirebaseAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const [members, setMembers] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // টোস্ট দেখাও
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
          {/* টোস্ট নোটিফিকেশন */}
          {toast.show && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ show: false, message: '', type: 'success' })}
            />
          )}
          <Routes>
            {/* লগইন */}
            <Route path="/login" element={<SignInSignUp />} />
            {/* সাইডবার + ড্যাশবোর্ড structure */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <SidebarLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard & Page Routes */}
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
              {/* চাইলে আরও রাউট যোগ করো */}
            </Route>
            {/* ভুল URL দিলে Dashboard এ যাবে */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </MonthProvider>
    </FirebaseAuthProvider>
  );
}

export default App;
