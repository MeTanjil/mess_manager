import React, { useState } from 'react';
import { getFirestore, collection, addDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';
import {
  Box, Paper, Card, CardContent, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const db = getFirestore();

export default function MealEntry({ members, showToast }) {
  const [date, setDate] = useState('');
  const [mealData, setMealData] = useState({});
  const { currentMonth } = useMonth();

  const handleChange = (memberId, type, value) => {
    setMealData(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], [type]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date) {
      showToast && showToast("তারিখ দিন!", "error");
      return;
    }
    if (members.length === 0) {
      showToast && showToast("কোনো সদস্য নেই!", "error");
      return;
    }

    const mealEntered = Object.values(mealData).some(
      m => Number(m.breakfast) > 0 || Number(m.lunch) > 0 || Number(m.dinner) > 0
    );
    if (!mealEntered) {
      showToast && showToast("কমপক্ষে একজনের জন্য অন্তত একবেলা মিল লিখুন!", "warning");
      return;
    }

    try {
      const mealQuery = query(
        collection(db, 'meals'),
        where('date', '==', date),
        where('monthId', '==', currentMonth),
        limit(1)
      );
      const snapshot = await getDocs(mealQuery);
      if (!snapshot.empty) {
        showToast && showToast("এই তারিখে ইতিমধ্যেই meal entry রয়েছে!", "warning");
        return;
      }

      await addDoc(collection(db, 'meals'), {
        date,
        monthId: currentMonth,
        meals: mealData
      });

      setDate('');
      setMealData({});
      showToast && showToast("মিল সংরক্ষণ হয়েছে!", "success");
    } catch (err) {
      console.error(err);
      showToast && showToast("একটি সমস্যা হয়েছে!", "error");
    }
  };

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
            🍽️ মিল এন্ট্রি
          </Typography>
        </Box>

        {/* Left/Right divider (form+table section) */}
        <Box
          sx={{
            px: 0,
            borderLeft: '2px solid #1976d2',
            borderRight: '2px solid #1976d2',
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          {/* Form */}
          <Box py={2} px={3}>
            <Card sx={{ maxWidth: 650, mx: "auto", boxShadow: 1, borderRadius: 3, bgcolor: "#f9fbfd", mb: 2 }}>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <CalendarMonthIcon color="primary" />
                    <TextField
                      label="তারিখ"
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      required
                      sx={{ width: 180, bgcolor: "#fff" }}
                    />
                    <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#1b1b1b" }}>
                      মাস: <b>{currentMonth || "নির্বাচিত নয়"}</b>
                    </Typography>
                  </Stack>

                  {members.length === 0 && (
                    <Typography color="error" sx={{ mb: 2 }}>
                      কোনো সদস্য নেই, আগে সদস্য যোগ করুন।
                    </Typography>
                  )}

                  {members.length > 0 && (
                    <TableContainer component={Box} sx={{ boxShadow: 0, mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                fontWeight: 700,
                                minWidth: 180,
                                width: 210,
                                maxWidth: 260
                              }}
                            >
                              সদস্য
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>নাস্তা</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>দুপুর</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>রাত</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {members.map(member => (
                            <TableRow key={member.id}>
                              <TableCell
                                sx={{
                                  fontWeight: 500,
                                  minWidth: 180,
                                  width: 210,
                                  maxWidth: 260,
                                  whiteSpace: 'pre-line',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {member.name}
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  inputProps={{
                                    min: 0,
                                    step: 0.5,
                                    style: {
                                      textAlign: 'center',
                                      fontWeight: 600,
                                      fontSize: 17
                                    }
                                  }}
                                  value={mealData[member.id]?.breakfast || ''}
                                  onChange={e => handleChange(member.id, 'breakfast', e.target.value)}
                                  sx={{ width: 90 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  inputProps={{
                                    min: 0,
                                    step: 0.5,
                                    style: {
                                      textAlign: 'center',
                                      fontWeight: 600,
                                      fontSize: 17
                                    }
                                  }}
                                  value={mealData[member.id]?.lunch || ''}
                                  onChange={e => handleChange(member.id, 'lunch', e.target.value)}
                                  sx={{ width: 90 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  inputProps={{
                                    min: 0,
                                    step: 0.5,
                                    style: {
                                      textAlign: 'center',
                                      fontWeight: 600,
                                      fontSize: 17
                                    }
                                  }}
                                  value={mealData[member.id]?.dinner || ''}
                                  onChange={e => handleChange(member.id, 'dinner', e.target.value)}
                                  sx={{ width: 90 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    sx={{
                      borderRadius: 2,
                      boxShadow: 1,
                      px: 4,
                      fontWeight: 600,
                      fontSize: 16,
                      mt: 1
                    }}
                    disabled={members.length === 0}
                  >
                    ✅ সেভ করুন
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Box>
        </Box>
        {/* Bottom divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />
        {/* Footer note */}
        <Box px={3} py={2}>
          <Typography sx={{ color: "gray" }}>
            <b>নোট:</b> মিল এন্ট্রি যুক্ত করার পর রিপোর্ট/রেট অটো আপডেট হবে।
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
