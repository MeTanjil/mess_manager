import React, { useState } from 'react';
import { useFirebaseAuth } from '../FirebaseAuthContext';
import { useNavigate } from 'react-router-dom';

export default function SignInSignUp() {
  const { signup, signin } = useFirebaseAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await signup(email, password);
        setMsg("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!");
      } else {
        await signin(email, password);
        setMsg("সাইন ইন সফল হয়েছে!");
      }
      navigate('/dashboard');
    } catch (err) {
      setMsg(`ত্রুটি: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", textAlign: "center" }}>
      <h2>{isSignup ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'সাইন ইন করুন'} - মেস ম্যানেজার</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="আপনার ইমেইল দিন"
          required
        />
        <br /><br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="পাসওয়ার্ড দিন"
          required
        />
        <br /><br />
        <button type="submit">{isSignup ? 'রেজিস্টার করুন' : 'সাইন ইন'}</button>
        <br /><br />
        <button type="button" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? 'আগে থেকেই অ্যাকাউন্ট আছে?' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
        </button>
      </form>
      <p style={{ color: "green" }}>{msg}</p>
    </div>
  );
}
