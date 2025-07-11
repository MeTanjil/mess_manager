import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { getFirestore, setDoc, doc } from 'firebase/firestore';

// 🔑 Firebase project-er config (eta একবারই লাগবে)
const firebaseConfig = {
  apiKey: "AIzaSyBoKxw28d2xNJdw7m0wgz2Sm-jFjzkKb0E",
  authDomain: "mess-manager-8d276.firebaseapp.com",
  projectId: "mess-manager-8d276",
  storageBucket: "mess-manager-8d276.appspot.com",
  messagingSenderId: "687932786280",
  appId: "1:687932786280:web:41b175fe011544b3279ddd",
  measurementId: "G-LBQXTVB9SY"
};

// 🔥 একবার initialize করে ফেলো
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Firestore init

// 🔒 Context setup
const AuthContext = createContext();

// 👇 Context use korar shortcut
export function useFirebaseAuth() {
  return useContext(AuthContext);
}

// 🌟 Provider function, এইটা দিয়েই app ঘিরে রাখতে হবে
export function FirebaseAuthProvider({ children }) {
  const [user, setUser] = useState(null); // লগইন করা ইউজার থাকবে এখানে
  const [loading, setLoading] = useState(true); // প্রথমে লোডিং চলবে

  useEffect(() => {
    // firebase নিজে থেকেই দেখে নেবে ইউজার আগে থেকে লগইন করা আছে কিনা
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // থাকলে user set হবে, না থাকলে null
      setLoading(false);    // চেক শেষ হলে লোডিং false
    });
    // ক্লিনআপ
    return () => unsubscribe();
  }, []);

  // 🔹 SIGN UP — Firestore integration সহ
  const signup = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Auth profile-এ displayName সেট (optional)
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    // Firestore users collection-এ আলাদা doc তৈরি
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email,
      displayName: displayName || "",
      createdAt: new Date(),
    });
    return userCredential.user;
  };

  // 🔹 SIGN IN
  const signin = (email, password) => signInWithEmailAndPassword(auth, email, password);
  // 🔹 SIGN OUT
  const signout = () => signOut(auth);

  // যদি এখনো user চেক হচ্ছে, তখন "লোড হচ্ছে..." দেখাবে
  if (loading) return <div>লোড হচ্ছে...</div>;

  // পুরো app-এ user, signup, signin, signout সবার জন্য available থাকবে
  return (
    <AuthContext.Provider value={{ user, signup, signin, signout }}>
      {children}
    </AuthContext.Provider>
  );
}
