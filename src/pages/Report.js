import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';

const db = getFirestore();

export default function Report() {
  const { currentMonth } = useMonth();
  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [bazars, setBazars] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [mealRate, setMealRate] = useState(0);
  const [memberMeals, setMemberMeals] = useState({});
  const [distributedCost, setDistributedCost] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      const memberSnap = await getDocs(collection(db, 'members'));
      const memberData = memberSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(memberData);

      const mealSnap = await getDocs(collection(db, 'meals'));
      const mealsData = mealSnap.docs.map(doc => doc.data()).filter(m => m.monthId === currentMonth);
      setMeals(mealsData);

      const bazarSnap = await getDocs(collection(db, 'bazar'));
      const bazarData = bazarSnap.docs.map(doc => doc.data()).filter(b => b.monthId === currentMonth);
      setBazars(bazarData);

      const depositSnap = await getDocs(collection(db, 'deposits'));
      const depositData = depositSnap.docs.map(doc => doc.data()).filter(d => d.monthId === currentMonth);
      setDeposits(depositData);

      let totalMeals = 0;
      const memberMealCount = {};
      mealsData.forEach(day => {
        Object.entries(day.meals).forEach(([memberId, meal]) => {
          const total = Number(meal.breakfast || 0) + Number(meal.lunch || 0) + Number(meal.dinner || 0);
          totalMeals += total;
          memberMealCount[memberId] = (memberMealCount[memberId] || 0) + total;
        });
      });
      setMemberMeals(memberMealCount);

      const totalBazarCost = bazarData.reduce((sum, b) => sum + Number(b.amount), 0);
      const exactMealRate = totalMeals > 0 ? totalBazarCost / totalMeals : 0;

      const costs = memberData.map(m => ({
        id: m.id,
        name: m.name,
        mealCount: memberMealCount[m.id] || 0,
        exactCost: (memberMealCount[m.id] || 0) * exactMealRate,
      }));

      const flooredCosts = costs.map(c => ({
        ...c,
        floorCost: Math.floor(c.exactCost),
        decimal: c.exactCost - Math.floor(c.exactCost),
      }));

      const totalFloorCost = flooredCosts.reduce((sum, c) => sum + c.floorCost, 0);
      let remaining = Math.round(totalBazarCost - totalFloorCost);
      const sortedByDecimal = [...flooredCosts].sort((a, b) => b.decimal - a.decimal);
      const distributed = {};
      sortedByDecimal.forEach((c, idx) => {
        distributed[c.id] = c.floorCost + (idx < remaining ? 1 : 0);
      });

      setMealRate(Math.round(exactMealRate));
      setDistributedCost(distributed);
    };

    if (currentMonth) {
      fetchAll();
    }
  }, [currentMonth]);

  const memberReports = members.map(m => {
    const totalBazar = bazars.filter(b => b.person === m.name).reduce((sum, b) => sum + Number(b.amount), 0);
    const totalDeposit = deposits.filter(d => d.member === m.name).reduce((sum, d) => sum + Number(d.amount), 0) + totalBazar;
    const mealCost = distributedCost[m.id] || 0;
    const balance = totalDeposit - mealCost;

    return {
      name: m.name,
      totalMeal: memberMeals[m.id] || 0,
      totalDeposit,
      totalBazar,
      mealCost,
      balance,
    };
  });

  const totalDistributedCost = Object.values(distributedCost).reduce((sum, c) => sum + c, 0);

  return (
    <div>
      <h2>📊 মাসিক রিপোর্ট ও ব্যালেন্স ({currentMonth})</h2>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", minWidth: 600 }}>
        <thead>
          <tr>
            <th>নাম</th>
            <th>মোট মিল</th>
            <th>মোট জমা</th>
            <th>মোট বাজার (ইনফো)</th>
            <th>মিল খরচ</th>
            <th>ব্যালেন্স (বাকী/অতিরিক্ত)</th>
          </tr>
        </thead>
        <tbody>
          {memberReports.map(r => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{r.totalMeal}</td>
              <td>{r.totalDeposit} টাকা</td>
              <td>{r.totalBazar} টাকা</td>
              <td>{r.mealCost} টাকা</td>
              <td style={{ color: r.balance < 0 ? "red" : "green", fontWeight: 'bold' }}>
                {r.balance < 0 ? `বাকী: ${-r.balance} টাকা` : `অতিরিক্ত: ${r.balance} টাকা`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <br />
      <p>
        <b>ব্যালেন্স:</b>
        <span style={{ color: 'red', marginLeft: 5 }}>বাকী (নেগেটিভ) = টাকা দিতে হবে</span>,
        <span style={{ color: 'green', marginLeft: 10 }}>অতিরিক্ত (পজিটিভ) = টাকা পাবে</span>
      </p>
      <p style={{color:'gray'}}>
        <b>নোট:</b> সবার meal cost যোগ করলে মোট বাজারের সাথে একদম মিলবে।
        কেউ ১ টাকা বেশি/কম পেলেও, সেটা ন্যায্যভাবে ভাগ করা হয়েছে।
      </p>
      <p style={{color: 'green'}}>
        <b>মোট কস্ট যোগফল:</b> {totalDistributedCost} টাকা (একদম সঠিক)
      </p>
    </div>
  );
}
