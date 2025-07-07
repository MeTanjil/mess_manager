import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { useMonth } from '../context/MonthContext';
import {
  Grid, Card, CardContent, Typography, Box, Divider, CircularProgress
} from '@mui/material';

const db = getFirestore();
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#d84c4c', '#82ca9d'];

export default function Dashboard() {
  const { currentMonth } = useMonth();
  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [bazars, setBazars] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const memberSnap = await getDocs(collection(db, 'members'));
      setMembers(memberSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const mealSnap = await getDocs(collection(db, 'meals'));
      setMeals(mealSnap.docs.map(doc => doc.data()).filter(m => m.monthId === currentMonth));

      const bazarSnap = await getDocs(collection(db, 'bazar'));
      setBazars(bazarSnap.docs.map(doc => doc.data()).filter(b => b.monthId === currentMonth));

      const depositSnap = await getDocs(collection(db, 'deposits'));
      setDeposits(depositSnap.docs.map(doc => doc.data()).filter(d => d.monthId === currentMonth));

      setLoading(false);
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

  if (loading) {
    return (
      <Box sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }}>ডেটা লোড হচ্ছে...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 700, textAlign: "left" }}>
        📊 ড্যাশবোর্ড ({currentMonth})
      </Typography>

      {/* Summary Card গুলো মাঝখানে */}
      <Grid
        container
        spacing={3}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "#e3f2fd", borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography sx={{ fontSize: 15 }}>👥 মোট সদস্য</Typography>
              <Typography variant="h5" color="primary">{members.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "#e8f5e9", borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography sx={{ fontSize: 15 }}>🍽️ মোট মিল</Typography>
              <Typography variant="h5" color="success.main">{totalMeals}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "#fff8e1", borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography sx={{ fontSize: 15 }}>💸 মোট বাজার</Typography>
              <Typography variant="h5" color="warning.main">{totalBazar} টাকা</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "#f1f8e9", borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography sx={{ fontSize: 15 }}>💰 মোট জমা</Typography>
              <Typography variant="h5" color="success.main">{totalDeposit} টাকা</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "#fff3e0", borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography sx={{ fontSize: 15 }}>⚖️ মিল রেট</Typography>
              <Typography variant="h5" color="secondary">{mealRate} টাকা</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* PieChart/Card গুলো মাঝখানে */}
      <Grid
        container
        spacing={3}
        justifyContent="center"
        alignItems="flex-start"
      >
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, p: 2, minWidth: 320 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, textAlign: "center" }}>
              🥧 কে কত মিল খেয়েছে
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={mealPieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {mealPieData.map((entry, idx) => (
                    <Cell key={`cell-m-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, p: 2, minWidth: 320 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, textAlign: "center" }}>
              💰 কে কত জমা দিয়েছে
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={depositPieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label={({ name, value }) => `${name}: ${value} টাকা`}
                >
                  {depositPieData.map((entry, idx) => (
                    <Cell key={`cell-d-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, p: 2, minWidth: 320 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, textAlign: "center" }}>
              📦 কে কত খরচ করেছে
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={costPieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label={({ name, value }) => `${name}: ${value} টাকা`}
                >
                  {costPieData.map((entry, idx) => (
                    <Cell key={`cell-c-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
