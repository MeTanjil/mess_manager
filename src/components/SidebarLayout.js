import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useFirebaseAuth } from '../FirebaseAuthContext';
import { useMonth } from '../context/MonthContext';
import MessNameBar from './MessNameBar';

export default function SidebarLayout() {
  const location = useLocation();
  const { signout, user } = useFirebaseAuth();
  const { currentMonth, setCurrentMonth } = useMonth();

  // মাস ডিফল্ট সেট
  useEffect(() => {
    if (!currentMonth) {
      const now = new Date();
      const def = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      setCurrentMonth(def);
    }
  }, [currentMonth, setCurrentMonth]);

  // মাস লিস্ট
  const generateAllMonths = () => {
    const months = [];
    const startYear = 2024;
    const now = new Date();
    const endYear = now.getFullYear() + 2;
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        const value = `${year}-${month.toString().padStart(2, '0')}`;
        const label = new Date(year, month - 1).toLocaleDateString('bn-BD', {
          year: 'numeric',
          month: 'long',
        });
        months.push({ value, label });
      }
    }
    return months;
  };

  const navItems = [
    { path: '/dashboard', label: 'ড্যাশবোর্ড' },
    { path: '/members', label: 'মেম্বার' },
    { path: '/meals', label: 'মিল' },
    { path: '/meal-entry', label: 'মিল এন্ট্রি' },
    { path: '/expense-entry', label: 'খরচ এন্ট্রি' },
    { path: '/bazar', label: 'বাজার' },
    { path: '/deposit', label: 'জমা' },
    { path: '/rate', label: 'মিল রেট' },
    { path: '/calc', label: 'রিপোর্ট' },
    { path: '/profile', label: '👤 প্রোফাইল' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col justify-between p-4">
        <div>
          {/* ইউজার প্রোফাইল */}
          {user && (
            <div className="flex items-center gap-3 mb-5 bg-gray-100 rounded-xl p-3 shadow">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="profile"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-lg">
                  {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-semibold text-base">{user.displayName || "নাম নেই"}</div>
                <div className="text-xs text-gray-600">{user.email}</div>
              </div>
            </div>
          )}

          {/* Mess Manager Brand */}
          <h2 className="font-bold text-xl text-[#1976d2] mb-0">Mess Manager</h2>
          <small className="text-gray-500">Created by Tanjil</small>

          {/* মাস নির্বাচন */}
          <div className="my-5">
            <label className="font-medium text-sm">🌙 মাস নির্বাচন:</label>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="block w-full mt-2 px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            >
              {generateAllMonths().map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 mt-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-3 py-2 rounded-lg font-medium text-[15px]
                  ${location.pathname === item.path
                    ? 'bg-blue-100 text-[#1976d2] font-bold'
                    : 'text-gray-800 hover:bg-blue-50 transition'}
                `}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {/* Logout */}
        <button
          onClick={signout}
          className="mt-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 justify-center transition"
        >
          🚪 লগ আউট
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 px-6 py-5">
        <MessNameBar />
        <Outlet />
      </main>
    </div>
  );
}
