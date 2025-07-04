import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
} from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';

const db = getFirestore();

export default function MealRate() {
  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [bazars, setBazars] = useState([]);
  const [mealRate, setMealRate] = useState(0);
  const [memberMeals, setMemberMeals] = useState({});
  const [distributedCost, setDistributedCost] = useState({});
  const { currentMonth } = useMonth();

  useEffect(() => {
    const fetchAll = async () => {
      // Member load
      const memberSnap = await getDocs(collection(db, 'members'));
      const memberData = memberSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(memberData);

      // Meals load (month wise)
      const mealSnap = await getDocs(collection(db, 'meals'));
      const allMealData = mealSnap.docs.map(doc => doc.data());
      const filteredMeals = allMealData.filter(m => m.monthId === currentMonth);
      setMeals(filteredMeals);

      // Bazar load (month wise)
      const bazarSnap = await getDocs(collection(db, 'bazar'));
      const allBazarData = bazarSnap.docs.map(doc => doc.data());
      const filteredBazars = allBazarData.filter(b => b.monthId === currentMonth);
      setBazars(filteredBazars);

      // Calculation
      let totalMeals = 0;
      const memberMealCount = {};

      filteredMeals.forEach((day) => {
        Object.entries(day.meals).forEach(([memberId, meal]) => {
          const total = Number(meal.breakfast || 0) + Number(meal.lunch || 0) + Number(meal.dinner || 0);
          totalMeals += total;
          memberMealCount[memberId] = (memberMealCount[memberId] || 0) + total;
        });
      });

      const totalBazarCost = filteredBazars.reduce((sum, b) => sum + Number(b.amount), 0);

      // Exact meal rate (decimal সহ)
      const exactMealRate = totalMeals > 0 ? totalBazarCost / totalMeals : 0;

      // Member-wise exact meal cost (decimal সহ)
      const costs = memberData.map(m => ({
        id: m.id,
        name: m.name,
        mealCount: memberMealCount[m.id] || 0,
        exactCost: (memberMealCount[m.id] || 0) * exactMealRate,
      }));

      // Step 1: প্রতিটা member এর cost কে floor (নীচের integer) করি
      const flooredCosts = costs.map(c => ({
        ...c,
        floorCost: Math.floor(c.exactCost),
        decimal: c.exactCost - Math.floor(c.exactCost),
      }));

      // Step 2: Total floor cost যোগ করি
      const totalFloorCost = flooredCosts.reduce((sum, c) => sum + c.floorCost, 0);

      // Step 3: Total bazar - total floor cost = বাকি টাকা (adjustable)
      let remaining = Math.round(totalBazarCost - totalFloorCost);

      // Step 4: কারা ১ টাকা বেশি পাবে ঠিক করি (বাকি টাকা যতজন দরকার, ততজন)
      // সবার decimal অংশ বেশি যাদের, তারা আগে বেশি পাবে — যাতে বণ্টন একদম ন্যায্য হয়!
      const sortedByDecimal = [...flooredCosts].sort((a, b) => b.decimal - a.decimal);

      // Step 5: Distributed cost বানাই
      const distributed = {};
      sortedByDecimal.forEach((c, idx) => {
        // যারা extra ১ টাকা পাবে, তাদের জন্য
        distributed[c.id] = c.floorCost + (idx < remaining ? 1 : 0);
      });

      setMealRate(Math.round(exactMealRate)); // রেট দেখাতে চাইলে integer দেখাও (চাইলে দশমিকও দেখাতে পারো)
      setMemberMeals(memberMealCount);
      setDistributedCost(distributed);
    };

    if (currentMonth) {
      fetchAll();
    }
  }, [currentMonth]);

  // মোট বাজার, মোট মিল — integer
  const totalBazarInt = Math.round(bazars.reduce((sum, b) => sum + Number(b.amount), 0));
  const totalMealInt = Object.values(memberMeals).reduce((sum, m) => sum + m, 0);

  // সর্বমোট cost (sum of all member distributed cost) == total bazar, always!
  const totalCost = Object.values(distributedCost).reduce((sum, c) => sum + c, 0);

  return (
    <div>
      <h2>📊 মিল রেট হিসাব</h2>
      <p>📅 মাস: <strong>{currentMonth}</strong></p>
      <p>মোট বাজার খরচ: <strong>{totalBazarInt} টাকা</strong></p>
      <p>মোট মিল সংখ্যা: <strong>{totalMealInt} টি</strong></p>
      <p>প্রতি মিল রেট: <strong>{mealRate} টাকা</strong></p>
      <h3>মেম্বার অনুযায়ী হিসাব:</h3>
      <ul>
        {members.map(m => (
          <li key={m.id}>
            👤 {m.name} — 🍽️ {memberMeals[m.id] || 0} মিল — 💰 {distributedCost[m.id] || 0} টাকা
          </li>
        ))}
      </ul>
      <p style={{color:'gray'}}>
        <b>নোট:</b> সব কস্ট যোগ করলে মোট বাজারের সাথে একদম মিলবে।  
        কারো কস্ট ১ টাকা বেশি বা কম থাকলেও, সবাইকে একদম সমানভাবে ভাগ করা হয়েছে।
      </p>
      <p style={{color: 'green'}}>
        <b>মোট কস্ট যোগফল:</b> {totalCost} টাকা (একদম সঠিক)
      </p>
    </div>
  );
}
