import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
} from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';

import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Divider, Stack
} from '@mui/material';

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

      // Step 4: কারা ১ টাকা বেশি পাবে ঠিক করি
      const sortedByDecimal = [...flooredCosts].sort((a, b) => b.decimal - a.decimal);

      // Step 5: Distributed cost বানাই
      const distributed = {};
      sortedByDecimal.forEach((c, idx) => {
        distributed[c.id] = c.floorCost + (idx < remaining ? 1 : 0);
      });

      setMealRate(Math.round(exactMealRate));
      setMemberMeals(memberMealCount);
      setDistributedCost(distributed);
    };

    if (currentMonth) {
      fetchAll();
    }
  }, [currentMonth]);

  const totalBazarInt = Math.round(bazars.reduce((sum, b) => sum + Number(b.amount), 0));
  const totalMealInt = Object.values(memberMeals).reduce((sum, m) => sum + m, 0);
  const totalCost = Object.values(distributedCost).reduce((sum, c) => sum + c, 0);

  return (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      mt: 3,
      minHeight: "90vh"
    }}>
      {/* Left-aligned main title */}
      <Box sx={{ width: "100%", maxWidth: 900 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3, textAlign: "left" }}>
          📊 মিল রেট হিসাব
        </Typography>
      </Box>

      {/* Cards in middle */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 3, justifyContent: "center", alignItems: "center", width: "100%" }}
      >
        <Card sx={{ minWidth: 210, bgcolor: "#f8f9fa", borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography>📅 মাস</Typography>
            <Typography variant="h6" color="primary">{currentMonth || "নির্বাচিত নয়"}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 210, bgcolor: "#f8f9fa", borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography>💸 মোট বাজার</Typography>
            <Typography variant="h6" color="secondary">{totalBazarInt} টাকা</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 210, bgcolor: "#f8f9fa", borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography>🍽️ মোট মিল</Typography>
            <Typography variant="h6" color="success.main">{totalMealInt} টি</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 210, bgcolor: "#f8f9fa", borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography>⚖️ প্রতি মিল রেট</Typography>
            <Typography variant="h6" color="info.main">{mealRate} টাকা</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Divider sx={{ my: 3, width: "100%", maxWidth: 800 }} />

      {/* Left-aligned subtitle */}
      <Box sx={{ width: "100%", maxWidth: 900 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3, textAlign: "left" }}>
          👤 মেম্বার অনুযায়ী হিসাব:
        </Typography>
      </Box>

      {/* Modern Table */}
      <TableContainer
        component={Paper}
        sx={{
          maxWidth: 750,
          mx: "auto",
          borderRadius: 3,
          mb: 2,
          boxShadow: 2,
        }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f1f7fc" }}>
              <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>মেম্বার</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 16 }}>মিল</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 16 }}>কস্ট (টাকা)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map(m => (
              <TableRow key={m.id}>
                <TableCell sx={{ minWidth: 170, fontWeight: 500 }}>{m.name}</TableCell>
                <TableCell align="center">{memberMeals[m.id] || 0}</TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontWeight: 600, color: "#1976d2" }}>
                    {distributedCost[m.id] || 0} টাকা
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ color: "#888" }}>
                  কোনো সদস্য নেই।
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer notes */}
      <Typography sx={{ color: "gray", mt: 2, textAlign: "center" }}>
        <b>নোট:</b> সব কস্ট যোগ করলে মোট বাজারের সাথে একদম মিলবে।  
        কারো কস্ট ১ টাকা বেশি বা কম থাকলেও, সবাইকে একদম সমানভাবে ভাগ করা হয়েছে।
      </Typography>
      <Typography sx={{ color: "green", mt: 1, fontWeight: 700, textAlign: "center" }}>
        মোট কস্ট যোগফল: {totalCost} টাকা (একদম সঠিক)
      </Typography>
    </Box>
  );
}
