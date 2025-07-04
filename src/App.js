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
import ExpenseEntry from './components/ExpenseEntry'; // ✅
import Toast from './components/Toast';

const db = getFirestore();

function ProtectedRoute({ children }) {
  const { user } = useFirebaseAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const [members, setMembers] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2200);
  };

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
          {/* Toast Notification (all pages) */}
          {toast.show && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ show: false, message: '', type: 'success' })}
            />
          )}
          <Routes>
            {/* Login page route */}
            <Route path="/login" element={<SignInSignUp />} />

            {/* Main app routes, যেগুলো শুধু লগইন ইউজার দেখতে পাবে */}
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
              <Route path="expense-entry" element={<ExpenseEntry members={members} showToast={showToast} />} /> {/* ✅ খরচ এন্ট্রি */}
              <Route path="bazar" element={<Bazar showToast={showToast} />} />
              <Route path="deposit" element={<Deposit showToast={showToast} />} />
              <Route path="rate" element={<MealRate />} />
              <Route path="calc" element={<Report />} />
              <Route path="profile" element={<Profile showToast={showToast} />} />
            </Route>

            {/* অন্য কিছু path দিলে ড্যাশবোর্ডে যাবে */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </MonthProvider>
    </FirebaseAuthProvider>
  );
}

export default App;
