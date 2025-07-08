import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';
import {
  Grid, Card, CardContent, Typography, Box, Divider, CircularProgress, Paper
} from '@mui/material';

const db = getFirestore();

export default function Dashboard() {
  const { currentMonth } = useMonth();
  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [bazars, setBazars] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fast fetch all Firestore data in parallel
  useEffect(() => {
    let unsub = false;
    const fetchAll = async () => {
      setLoading(true);
      // All fetches in parallel
      const [
        memberSnap,
        mealSnap,
        bazarSnap,
        depositSnap
      ] = await Promise.all([
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'meals')),
        getDocs(collection(db, 'bazar')),
        getDocs(collection(db, 'deposits'))
      ]);
      if (unsub) return;
      setMembers(memberSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setMeals(mealSnap.docs.map(doc => doc.data()).filter(m => m.monthId === currentMonth));
      setBazars(bazarSnap.docs.map(doc => doc.data()).filter(b => b.monthId === currentMonth));
      setDeposits(depositSnap.docs.map(doc => doc.data()).filter(d => d.monthId === currentMonth));
      setLoading(false);
    };
    if (currentMonth) fetchAll();
    return () => { unsub = true; };
  }, [currentMonth]);

  // Data processing (pure JS, super fast)
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

  if (loading) {
    return (
      <Box sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }}>ডেটা লোড হচ্ছে...</Typography>
      </Box>
    );
  }

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
          <Typography
            variant="h6"
            fontWeight={700}
            color="primary"
          >
            📊 ড্যাশবোর্ড ({currentMonth})
          </Typography>
        </Box>
        {/* Left/Right divider */}
        <Box
          sx={{
            px: 0,
            borderLeft: '2px solid #3bb59a',
            borderRight: '2px solid #3bb59a',
            borderRadius: 0,
            overflow: 'hidden',
            pb: 4,
          }}
        >
          {/* Summary cards */}
          <Grid
            container
            spacing={3}
            justifyContent="center"
            alignItems="center"
            sx={{ mb: 2, px: 1, pt: 1 }}
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
        </Box>
        {/* Bottom divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main', my: 3 }} />

        {/* Note only (memberwise table removed) */}
        <Box px={3} py={4}>
          <Typography sx={{ color: "gray" }}>
            <b>নোট:</b> সকল হিসাব দেখার জন্য রিপোর্ট পেজে যান।
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
