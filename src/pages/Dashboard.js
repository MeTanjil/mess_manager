import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { useMonth } from '../context/MonthContext';

const db = getFirestore();
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#d84c4c', '#82ca9d'];

export default function Dashboard() {
  const { currentMonth } = useMonth();
  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [bazars, setBazars] = useState([]);
  const [deposits, setDeposits] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      const memberSnap = await getDocs(collection(db, 'members'));
      setMembers(memberSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const mealSnap = await getDocs(collection(db, 'meals'));
      setMeals(mealSnap.docs.map(doc => doc.data()).filter(m => m.monthId === currentMonth));

      const bazarSnap = await getDocs(collection(db, 'bazar'));
      setBazars(bazarSnap.docs.map(doc => doc.data()).filter(b => b.monthId === currentMonth));

      const depositSnap = await getDocs(collection(db, 'deposits'));
      setDeposits(depositSnap.docs.map(doc => doc.data()).filter(d => d.monthId === currentMonth));
    };
    if (currentMonth) fetchAll();
  }, [currentMonth]);

  let totalMeals = 0;
  const memberMeals = {};
  meals.forEach(day => {
    Object.entries(day.meals).forEach(([memberId, meal]) => {
      const mealCount = Number(meal.breakfast || 0) + Number(meal.lunch || 0) + Number(meal.dinner || 0);
      totalMeals += mealCount;
      memberMeals[memberId] = (memberMeals[memberId] || 0) + mealCount;
    });
  });

  const totalBazar = bazars.reduce((sum, b) => sum + Number(b.amount), 0);
  const memberBazars = {};
  bazars.forEach(bz => {
    memberBazars[bz.person] = (memberBazars[bz.person] || 0) + Number(bz.amount);
  });

  const memberDeposits = {};
  members.forEach(m => {
    const depositSum = deposits.filter(dep => dep.member === m.name).reduce((sum, dep) => sum + Number(dep.amount), 0);
    const bazarSum = memberBazars[m.name] || 0;
    memberDeposits[m.name] = depositSum + bazarSum;
  });
  const totalDeposit = Object.values(memberDeposits).reduce((a, b) => a + b, 0);

  const mealRate = totalMeals > 0 ? Math.round(totalBazar / totalMeals) : 0;

  let distributedCost = {};
  if (totalMeals > 0 && members.length > 0) {
    const costs = members.map(m => ({
      id: m.id,
      name: m.name,
      mealCount: memberMeals[m.id] || 0,
      exactCost: (memberMeals[m.id] || 0) * (totalBazar / totalMeals),
    }));
    const floored = costs.map(c => ({
      ...c,
      floorCost: Math.floor(c.exactCost),
      decimal: c.exactCost - Math.floor(c.exactCost),
    }));
    const totalFloor = floored.reduce((sum, c) => sum + c.floorCost, 0);
    let remaining = Math.round(totalBazar - totalFloor);
    const sorted = [...floored].sort((a, b) => b.decimal - a.decimal);
    sorted.forEach((c, idx) => {
      distributedCost[c.id] = c.floorCost + (idx < remaining ? 1 : 0);
    });
  }

  const mealPieData = members.map(m => ({
    name: m.name,
    value: memberMeals[m.id] || 0,
  }));

  const depositPieData = members.map(m => ({
    name: m.name,
    value: memberDeposits[m.name] || 0,
  }));

  const costPieData = members.map(m => ({
    name: m.name,
    value: distributedCost[m.id] || 0,
  }));

  return (
    <div>
      <h2>📊 Dashboard ({currentMonth})</h2>
      <div style={{display: 'flex', gap: 30, flexWrap: 'wrap', marginBottom: 30}}>
        <div style={{background:'#f5f5f5', padding: 20, borderRadius: 12, minWidth: 160}}>
          <b>👥 মোট সদস্য:</b> <br /> {members.length}
        </div>
        <div style={{background:'#f5f5f5', padding: 20, borderRadius: 12, minWidth: 160}}>
          <b>🍽️ মোট মিল:</b> <br /> {totalMeals}
        </div>
        <div style={{background:'#f5f5f5', padding: 20, borderRadius: 12, minWidth: 160}}>
          <b>💸 মোট বাজার:</b> <br /> {totalBazar} টাকা
        </div>
        <div style={{background:'#f5f5f5', padding: 20, borderRadius: 12, minWidth: 160}}>
          <b>💰 মোট জমা:</b> <br /> {totalDeposit} টাকা
        </div>
        <div style={{background:'#f5f5f5', padding: 20, borderRadius: 12, minWidth: 160}}>
          <b>⚖️ Meal Rate:</b> <br /> {mealRate} টাকা
        </div>
      </div>

      <div style={{display:'flex', gap: 40, flexWrap:'wrap'}}>
        <div>
          <h3>🥧 কে কত মিল খেয়েছে</h3>
          <ResponsiveContainer width={350} height={300}>
            <PieChart>
              <Pie
                data={mealPieData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                label={({name, value}) => `${name}: ${value}`}
              >
                {mealPieData.map((entry, idx) => (
                  <Cell key={`cell-m-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3>💰 কে কত জমা দিয়েছে</h3>
          <ResponsiveContainer width={350} height={300}>
            <PieChart>
              <Pie
                data={depositPieData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                label={({name, value}) => `${name}: ${value} টাকা`}
              >
                {depositPieData.map((entry, idx) => (
                  <Cell key={`cell-d-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3>📦 কে কত খরচ করেছে</h3>
          <ResponsiveContainer width={350} height={300}>
            <PieChart>
              <Pie
                data={costPieData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                label={({name, value}) => `${name}: ${value} টাকা`}
              >
                {costPieData.map((entry, idx) => (
                  <Cell key={`cell-c-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
