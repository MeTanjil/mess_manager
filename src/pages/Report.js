import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';

// MUI imports
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Divider,
} from '@mui/material';

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
        <Box px={3} pt={2} pb={1} display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" fontWeight={700} color="primary">
            📊 মাসিক রিপোর্ট ও ব্যালেন্স
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            ({currentMonth})
          </Typography>
        </Box>
        {/* Left-Right divider (table border) */}
        <Box
          sx={{
            px: 0,
            borderLeft: '2px solid #1976d2',
            borderRight: '2px solid #1976d2',
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <TableContainer component={Box}>
            <Table sx={{ minWidth: 900 }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>নাম</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>মোট মিল</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>মোট জমা</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>মোট বাজার</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>মিল খরচ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>শেয়ার্ড খরচ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>ইন্ডিভিজুয়াল খরচ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>মোট খরচ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>ব্যালেন্স</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {memberReports.map(r => (
                  <TableRow
                    key={r.name}
                    hover
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                      background: r.balance < 0 ? "#fff6f6" : r.balance > 0 ? "#f6fff7" : "",
                    }}
                  >
                    <TableCell align="center">{r.name}</TableCell>
                    <TableCell align="center">{r.totalMeal}</TableCell>
                    <TableCell align="center">{r.totalDeposit} টাকা</TableCell>
                    <TableCell align="center">{r.totalBazar} টাকা</TableCell>
                    <TableCell align="center">{r.mealCost} টাকা</TableCell>
                    <TableCell align="center">{r.sharedCost ? r.sharedCost.toFixed(2) : 0} টাকা</TableCell>
                    <TableCell align="center">{r.indivCost || 0} টাকা</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      {r.totalCost ? r.totalCost.toFixed(2) : 0} টাকা
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: r.balance < 0 ? "error.main" : "success.main",
                        fontWeight: 700,
                      }}
                    >
                      {r.balance < 0
                        ? `বাকী: ${(-r.balance).toFixed(2)}`
                        : `অতিরিক্ত: ${r.balance.toFixed(2)}`}
                      &nbsp;টাকা
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        {/* Bottom divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />
        {/* Notes */}
        <Box px={3} py={2}>
          <Typography variant="body2">
            <b>ব্যালেন্স:</b>
            <span style={{ color: 'red', marginLeft: 6 }}>বাকী (নেগেটিভ) = টাকা দিতে হবে</span>,
            <span style={{ color: 'green', marginLeft: 10 }}>অতিরিক্ত (পজিটিভ) = টাকা পাবে</span>
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            <b>নোট:</b> মিল, ইন্ডিভিজুয়াল এবং শেয়ার্ড সব খরচ যোগ হয়েছে। <b>শেয়ার্ড খরচ</b> সমান ভাগে ভাগ হয়েছে এবং যিনি দিয়েছেন তার জমায় যোগ হয়েছে।
          </Typography>
          <Typography variant="body2" color="success.main" mt={1}>
            <b>মোট মিল কস্ট যোগফল:</b> {totalDistributedCost} টাকা
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
