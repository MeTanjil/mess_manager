import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
} from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Card, CardContent, Stack, Divider,
} from '@mui/material';

const db = getFirestore();

export default function MealRate() {
  const [members, setMembers] = useState([]);
  const [memberMeals, setMemberMeals] = useState({});
  const [distributedCost, setDistributedCost] = useState({});
  const [mealRate, setMealRate] = useState(0);
  const [totalBazar, setTotalBazar] = useState(0);
  const [totalMeals, setTotalMeals] = useState(0);
  const { currentMonth } = useMonth();

  useEffect(() => {
    if (!currentMonth) return;
    (async () => {
      // Load all in parallel
      const [memberSnap, mealSnap, bazarSnap] = await Promise.all([
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'meals')),
        getDocs(collection(db, 'bazar'))
      ]);

      const members = memberSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(members);

      const meals = mealSnap.docs.map(doc => doc.data()).filter(m => m.monthId === currentMonth);
      const bazars = bazarSnap.docs.map(doc => doc.data()).filter(b => b.monthId === currentMonth);

      let totalMeals = 0, memberMealCount = {};
      meals.forEach(day => {
        Object.entries(day.meals).forEach(([memberId, meal]) => {
          const t = Number(meal.breakfast || 0) + Number(meal.lunch || 0) + Number(meal.dinner || 0);
          totalMeals += t;
          memberMealCount[memberId] = (memberMealCount[memberId] || 0) + t;
        });
      });

      const totalBazarCost = bazars.reduce((sum, b) => sum + Number(b.amount), 0);
      setTotalBazar(Math.round(totalBazarCost));
      setTotalMeals(totalMeals);

      // Exact meal rate
      const exactMealRate = totalMeals > 0 ? totalBazarCost / totalMeals : 0;

      // Calc cost for each member
      const costs = members.map(m => ({
        id: m.id,
        mealCount: memberMealCount[m.id] || 0,
        exactCost: (memberMealCount[m.id] || 0) * exactMealRate,
      }));

      // Step 1: floor
      const floored = costs.map(c => ({
        ...c,
        floorCost: Math.floor(c.exactCost),
        decimal: c.exactCost - Math.floor(c.exactCost),
      }));
      const totalFloor = floored.reduce((sum, c) => sum + c.floorCost, 0);

      // Step 2: rest to distribute (rounding adjust)
      let rest = Math.round(totalBazarCost - totalFloor);

      // Step 3: who gets +1? (descending decimal)
      const sorted = [...floored].sort((a, b) => b.decimal - a.decimal);

      // Step 4: distributed cost object
      const distributed = {};
      sorted.forEach((c, idx) => {
        distributed[c.id] = c.floorCost + (idx < rest ? 1 : 0);
      });

      setMealRate(Math.round(exactMealRate));
      setMemberMeals(memberMealCount);
      setDistributedCost(distributed);
    })();
  }, [currentMonth]);

  // For summary
  const totalCost = Object.values(distributedCost).reduce((a, b) => a + b, 0);

  return (
    <Box maxWidth="lg" mx="auto" mt={4} px={2}>
      <Paper
        elevation={4}
        sx={{
          p: 0,
          borderRadius: 4,
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}
      >
        {/* Top divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />

        {/* Title */}
        <Box px={3} pt={2} pb={1}>
          <Typography variant="h6" fontWeight={700} color="primary">
            📊 মিল রেট হিসাব
          </Typography>
        </Box>

        {/* Summary cards */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            px: 3, pb: 2,
            justifyContent: { md: "center" },
            alignItems: { xs: "stretch", md: "center" },
          }}
        >
          <Card sx={{ minWidth: 170, bgcolor: "#f8f9fa", borderRadius: 3, boxShadow: 0, flex: 1 }}>
            <CardContent>
              <Typography fontSize={15}>📅 মাস</Typography>
              <Typography variant="h6" color="primary">{currentMonth || "নির্বাচিত নয়"}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 170, bgcolor: "#f8f9fa", borderRadius: 3, boxShadow: 0, flex: 1 }}>
            <CardContent>
              <Typography fontSize={15}>💸 মোট বাজার</Typography>
              <Typography variant="h6" color="secondary">{totalBazar} টাকা</Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 170, bgcolor: "#f8f9fa", borderRadius: 3, boxShadow: 0, flex: 1 }}>
            <CardContent>
              <Typography fontSize={15}>🍽️ মোট মিল</Typography>
              <Typography variant="h6" color="success.main">{totalMeals} টি</Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 170, bgcolor: "#f8f9fa", borderRadius: 3, boxShadow: 0, flex: 1 }}>
            <CardContent>
              <Typography fontSize={15}>⚖️ প্রতি মিল রেট</Typography>
              <Typography variant="h6" color="info.main">{mealRate} টাকা</Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* Table */}
        <Box
          sx={{
            px: 0,
            borderLeft: '2px solid #1976d2',
            borderRight: '2px solid #1976d2',
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} sx={{ px: 3, mt: 1, mb: 1, textAlign: "left" }}>
            👤 মেম্বার অনুযায়ী হিসাব
          </Typography>

          <TableContainer component={Box} sx={{ mb: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>মেম্বার</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 16 }}>মিল</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 16 }}>কস্ট (টাকা)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.id}>
                    <TableCell sx={{ minWidth: 120, fontWeight: 500 }}>{m.name}</TableCell>
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
        </Box>

        {/* Bottom divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />

        {/* Footer notes */}
        <Box px={3} py={2}>
          <Typography sx={{ color: "gray" }}>
            <b>নোট:</b> সব কস্ট যোগ করলে মোট বাজারের সাথে একদম মিলবে।
            কারো কস্ট ১ টাকা বেশি বা কম থাকলেও, সবাইকে একদম সমানভাবে ভাগ করা হয়েছে।
          </Typography>
          <Typography sx={{ color: "green", mt: 1, fontWeight: 700 }}>
            মোট কস্ট যোগফল: {totalCost} টাকা (একদম সঠিক)
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}