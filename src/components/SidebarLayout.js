import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useFirebaseAuth } from '../FirebaseAuthContext';
import { useMonth } from '../context/MonthContext';
import MessNameBar from './MessNameBar';

export default function SidebarLayout() {
  const location = useLocation();
  const { signout, user } = useFirebaseAuth();
  const { currentMonth, setCurrentMonth } = useMonth();

  // মাস ডিফল্ট সেট করা
  useEffect(() => {
    if (!currentMonth) {
      const now = new Date();
      const def = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      setCurrentMonth(def);
    }
  }, [currentMonth, setCurrentMonth]);

  // 2024 থেকে শুরু করে আগামী ২ বছর পর্যন্ত মাস তৈরি
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

  // Settings বাদ দিয়ে navItems
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
    <div style={{ display: 'flex' }}>
      <nav
        style={{
          width: 220,
          background: '#f0f0f0',
          padding: 20,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* 🔽 ইউজার প্রোফাইল */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 18,
              background: '#fff',
              borderRadius: 8,
              padding: '8px 8px 8px 2px',
              boxShadow: '0 1px 3px #eee'
            }}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="profile"
                  width={36}
                  height={36}
                  style={{ borderRadius: '50%' }}
                />
              ) : (
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#b3b3b3',
                  textAlign: 'center',
                  lineHeight: '36px',
                  fontWeight: 'bold',
                  fontSize: '1.2em',
                  color: '#fff'
                }}>
                  {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {user.displayName || "No Name"}
                </div>
                <div style={{ fontSize: 13, color: '#444' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}

          {/* 🔽 Sidebar Main */}
          <h3 style={{ marginBottom: 5 }}>Mess Manager</h3>
          <small style={{ color: '#555' }}>Created by Tanjil</small>

          {/* 🔽 মাস নির্বাচন */}
          <div style={{ margin: '20px 0' }}>
            <label>🌙 মাস নির্বাচন:</label>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              style={{
                width: '100%',
                padding: '5px',
                marginTop: '5px',
                fontSize: '14px',
              }}
            >
              {generateAllMonths().map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* 🔽 Navigation Links */}
          {navItems.map((item) => (
            <div key={item.path}>
              <Link
                to={item.path}
                style={{
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  color: location.pathname === item.path ? '#1976d2' : '#333',
                  background: location.pathname === item.path ? '#e3f0ff' : 'none',
                  display: 'block',
                  margin: '10px 0',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
              >
                {item.label}
              </Link>
            </div>
          ))}
        </div>

        {/* 🔽 Logout Button */}
        <button
          onClick={signout}
          style={{
            marginTop: 20,
            color: 'white',
            backgroundColor: 'red',
            border: 'none',
            padding: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            borderRadius: '4px',
          }}
        >
          🚪 লগ আউট
        </button>
      </nav>

      {/* 🔽 Main Page Content */}
      <main style={{ flex: 1, padding: 20 }}>
        <MessNameBar />
        <Outlet />
      </main>
    </div>
  );
}
