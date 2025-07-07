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
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (err) {
      setMsg(`ত্রুটি: ${err.message}`);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #e3f2fd 0%, #c8e6c9 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "#fff",
        padding: "36px 28px",
        borderRadius: "18px",
        boxShadow: "0 4px 32px #0001",
        width: "100%",
        maxWidth: "380px",
        textAlign: "center"
      }}>
        <h2 style={{
          fontWeight: 700,
          fontSize: "1.7rem",
          color: "#1976d2",
          marginBottom: "18px"
        }}>
          {isSignup ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'সাইন ইন করুন'} <span style={{ color: "#666", fontSize: "1rem" }}>- মেস ম্যানেজার</span>
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="আপনার ইমেইল দিন"
            required
            style={{
              padding: "11px",
              borderRadius: "7px",
              border: "1px solid #b0bec5",
              outline: "none",
              fontSize: "1rem"
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="পাসওয়ার্ড দিন"
            required
            style={{
              padding: "11px",
              borderRadius: "7px",
              border: "1px solid #b0bec5",
              outline: "none",
              fontSize: "1rem"
            }}
          />
          <button
            type="submit"
            style={{
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: "7px",
              padding: "11px 0",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              marginTop: "5px",
              transition: "background .2s"
            }}
            onMouseOver={e => e.currentTarget.style.background = "#1565c0"}
            onMouseOut={e => e.currentTarget.style.background = "#1976d2"}
          >
            {isSignup ? 'রেজিস্টার করুন' : 'সাইন ইন'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)}
          style={{
            marginTop: "18px",
            background: "none",
            border: "none",
            color: "#1976d2",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "1rem"
          }}
        >
          {isSignup ? 'আগে থেকেই অ্যাকাউন্ট আছে?' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
        </button>
        <p style={{
          marginTop: "16px",
          color: msg.includes('ত্রুটি') ? "#d32f2f" : "#388e3c",
          fontWeight: 500,
          minHeight: "18px"
        }}>
          {msg}
        </p>
      </div>
    </div>
  );
}