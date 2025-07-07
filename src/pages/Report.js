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
  const [expenses, setExpenses] = useState([]);
  const [mealRate, setMealRate] = useState(0);
  const [memberMeals, setMemberMeals] = useState({});
  const [distributedCost, setDistributedCost] = useState({});

  useEffect(() => {
    if (!currentMonth) return;
    // সব collection একসাথে আনো (super fast)
    (async () => {
      const [
        memberSnap,
        mealSnap,
        bazarSnap,
        depositSnap,
        expenseSnap,
      ] = await Promise.all([
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'meals')),
        getDocs(collection(db, 'bazar')),
        getDocs(collection(db, 'deposits')),
        getDocs(collection(db, 'expenses'))
      ]);

      const memberData = memberSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const mealsData = mealSnap.docs.map(doc => doc.data()).filter(m => m.monthId === currentMonth);
      const bazarData = bazarSnap.docs.map(doc => doc.data()).filter(b => b.monthId === currentMonth);
      const depositData = depositSnap.docs.map(doc => doc.data()).filter(d => d.monthId === currentMonth);
      const expenseData = expenseSnap.docs.map(doc => doc.data()).filter(e => e.monthId === currentMonth);

      setMembers(memberData);
      setMeals(mealsData);
      setBazars(bazarData);
      setDeposits(depositData);
      setExpenses(expenseData);

      // Meal calculations
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
    })();
  }, [currentMonth]);

  // SHARED COST
  const sharedExpenses = expenses.filter(e => e.type === 'shared');
  const totalSharedCost = sharedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const sharedCostPerMember = members.length > 0 ? totalSharedCost / members.length : 0;
  const sharedPaidByMember = {};
  sharedExpenses.forEach(e => {
    if (!sharedPaidByMember[e.payerId]) sharedPaidByMember[e.payerId] = 0;
    sharedPaidByMember[e.payerId] += Number(e.amount);
  });

  // INDIVIDUAL COST
  const individualExpenses = expenses.filter(e => e.type === 'individual');
  const individualByMemberId = {};
  individualExpenses.forEach(e => {
    if (!individualByMemberId[e.payerId]) individualByMemberId[e.payerId] = 0;
    individualByMemberId[e.payerId] += Number(e.amount);
  });

  // MEMBERWISE FINAL REPORT
  const memberReports = members.map(m => {
    const totalBazar = bazars.filter(b => b.person === m.name).reduce((sum, b) => sum + Number(b.amount), 0);
    const depositTotal =
      deposits.filter(d => d.member === m.name).reduce((sum, d) => sum + Number(d.amount), 0)
      + totalBazar
      + (sharedPaidByMember[m.id] || 0);

    const mealCost = distributedCost[m.id] || 0;
    const indivCost = individualByMemberId[m.id] || 0;
    const sharedCost = sharedCostPerMember;
    const totalCost = mealCost + indivCost + sharedCost;
    const balance = depositTotal - totalCost;

    return {
      name: m.name,
      totalMeal: memberMeals[m.id] || 0,
      totalDeposit: depositTotal,
      totalBazar,
      mealCost,
      sharedCost,
      indivCost,
      totalCost,
      balance,
    };
  });

  const totalDistributedCost = Object.values(distributedCost).reduce((sum, c) => sum + c, 0);

  return (
    <div>
      <h2>📊 মাসিক রিপোর্ট ও ব্যালেন্স ({currentMonth})</h2>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", minWidth: 800 }}>
        <thead>
          <tr>
            <th>নাম</th>
            <th>মোট মিল</th>
            <th>মোট জমা</th>
            <th>মোট বাজার (ইনফো)</th>
            <th>মিল খরচ</th>
            <th>শেয়ার্ড খরচ (সমান ভাগে)</th>
            <th>ইন্ডিভিজুয়াল খরচ</th>
            <th>মোট খরচ</th>
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
              <td>{r.sharedCost ? r.sharedCost.toFixed(2) : 0} টাকা</td>
              <td>{r.indivCost || 0} টাকা</td>
              <td><b>{r.totalCost ? r.totalCost.toFixed(2) : 0}</b> টাকা</td>
              <td style={{ color: r.balance < 0 ? "red" : "green", fontWeight: 'bold' }}>
                {r.balance < 0 ? `বাকী: ${(-r.balance).toFixed(2)} টাকা` : `অতিরিক্ত: ${r.balance.toFixed(2)} টাকা`}
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
      <p style={{ color: 'gray' }}>
        <b>নোট:</b> মিল, ইন্ডিভিজুয়াল এবং শেয়ার্ড সব খরচ যোগ হয়েছে।
        <b>শেয়ার্ড খরচ</b> সমান ভাগে ভাগ হয়েছে এবং যিনি দিয়েছেন তার জমায় যোগ হয়েছে।
      </p>
      <p style={{ color: 'green' }}>
        <b>মোট মিল কস্ট যোগফল:</b> {totalDistributedCost} টাকা
      </p>
    </div>
  );
}
