import React, { useState } from 'react';
import { useFirebaseAuth } from '../FirebaseAuthContext';
import { getAuth, updateProfile, updatePassword, sendPasswordResetEmail } from 'firebase/auth';

export default function Profile({ showToast }) { // <<== add showToast
  const { user } = useFirebaseAuth();
  const auth = getAuth(); // ✅ অবশ্যই এটাকে ব্যবহার করো!
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  // old local state এখন লাগবে না, showToast দিয়েই করো
  const [newPassword, setNewPassword] = useState('');

  if (!user) return <div>কোনো ইউজার নেই!</div>;

  // নাম/ছবি লিঙ্ক update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(user, { displayName, photoURL });
      showToast && showToast('প্রোফাইল আপডেট হয়েছে!', 'success');
    } catch (err) {
      showToast && showToast('Update ব্যর্থ: ' + err.message, 'error');
      console.log(err);
    }
  };

  // Password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast && showToast('Password কমপক্ষে ৬ অক্ষরের হতে হবে!', 'error');
      return;
    }
    try {
      await updatePassword(user, newPassword);
      showToast && showToast('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!', 'success');
      setNewPassword('');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        showToast && showToast('Password পরিবর্তনের জন্য আপনাকে আবার লগইন করতে হবে অথবা Reset লিঙ্ক ব্যবহার করুন।', 'error');
      } else {
        showToast && showToast('Password পরিবর্তন ব্যর্থ: ' + err.message, 'error');
      }
      console.log(err);
    }
  };

  // Password reset email
  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      showToast && showToast('Password reset লিঙ্ক ইমেইলে পাঠানো হয়েছে!', 'success');
    } catch (err) {
      showToast && showToast('Password reset ব্যর্থ: ' + err.message, 'error');
      console.log(err);
    }
  };

  return (
    <div style={{ maxWidth: 370, margin: '0 auto' }}>
      <h2>👤 ইউজার প্রোফাইল</h2>
      <div style={{ textAlign: 'center', marginBottom: 15 }}>
        <img
          src={photoURL || '/default-avatar.png'}
          alt="profile"
          width={90}
          height={90}
          style={{ borderRadius: '50%', objectFit: 'cover', background: '#e3e3e3' }}
        />
      </div>
      <form onSubmit={handleSubmit}>
        <label>নাম:</label>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          style={{ width: '100%', padding: 7, marginBottom: 10 }}
        />
        <label>ছবির লিঙ্ক (URL):</label>
        <input
          type="text"
          value={photoURL}
          onChange={e => setPhotoURL(e.target.value)}
          style={{ width: '100%', padding: 7, marginBottom: 10 }}
        />
        <div style={{ marginBottom: 10, color: '#555', fontSize: 13 }}>
          * চাইলে Google Drive/Photos/Dropbox/Imgur থেকে public image link দিন।
        </div>
        <button type="submit" style={{ padding: '8px 20px', borderRadius: 4 }}>প্রোফাইল আপডেট</button>
      </form>
      <hr />

      {/* Password Change Option */}
      <div style={{ margin: '20px 0', padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
        <b>🔑 পাসওয়ার্ড পরিবর্তন</b>
        <form onSubmit={handlePasswordChange}>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="নতুন পাসওয়ার্ড (৬+ অক্ষর)"
            style={{ width: '100%', padding: 7, margin: '8px 0' }}
          />
          <button type="submit" style={{ padding: '7px 14px', borderRadius: 4 }}>পরিবর্তন করুন</button>
        </form>
        <button
          style={{
            marginTop: 10, background: 'none', border: 'none', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer'
          }}
          onClick={handlePasswordReset}
        >
          পাসওয়ার্ড ভুলে গেছেন? Reset লিঙ্ক পাঠান
        </button>
      </div>
      <hr />

      <div>
        <b>ইমেইল:</b> <br /> {user.email}
      </div>
    </div>
  );
}
