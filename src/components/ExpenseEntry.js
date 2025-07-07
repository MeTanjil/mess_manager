import React, { useState, useEffect } from 'react';
import {
  getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc
} from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';

import {
  Box, Card, CardContent, Typography, Button, TextField, Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack, Tooltip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

const db = getFirestore();

export default function ExpenseEntry({ members, showToast }) {
  const { currentMonth } = useMonth();
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [type, setType] = useState('shared');
  const [payerId, setPayerId] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [editId, setEditId] = useState(null);

  // খরচের তালিকা লোড
  const fetchExpenses = async () => {
    const q = query(collection(db, 'expenses'), where('monthId', '==', currentMonth));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setExpenses(data.sort((a, b) => a.date.localeCompare(b.date)));
  };

  useEffect(() => {
    if (currentMonth) fetchExpenses();
    // eslint-disable-next-line
  }, [currentMonth]);

  // খরচ সেভ বা আপডেট
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date || !amount || !purpose) {
      showToast && showToast("সব ঘর পূরণ করুন!", "error");
      return;
    }
    if (!payerId) {
      showToast && showToast("কে টাকা দিয়েছে সেটি নির্বাচন করুন!", "error");
      return;
    }

    try {
      if (editId) {
        await updateDoc(doc(db, 'expenses', editId), {
          date,
          amount: Number(amount),
          purpose,
          type,
          payerId,
          monthId: currentMonth,
        });
        showToast && showToast("খরচ আপডেট হয়েছে!", "success");
      } else {
        await addDoc(collection(db, 'expenses'), {
          date,
          amount: Number(amount),
          purpose,
          type,
          payerId,
          monthId: currentMonth,
        });
        showToast && showToast("খরচ সংরক্ষণ হয়েছে!", "success");
      }

      setDate('');
      setAmount('');
      setPurpose('');
      setType('shared');
      setPayerId('');
      setEditId(null);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      showToast && showToast("সেভ করতে সমস্যা হয়েছে!", "error");
    }
  };

  const getMemberName = (id) => {
    const m = members.find(m => m.id === id);
    return m ? m.name : '';
  };

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিত? ডিলিট করলে আর ফেরত পাবেন না!")) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      showToast && showToast("খরচ ডিলিট হয়েছে!", "success");
      fetchExpenses();
    } catch (err) {
      console.error(err);
      showToast && showToast("ডিলিট করতে সমস্যা হয়েছে!", "error");
    }
  };

  const handleEdit = (exp) => {
    setEditId(exp.id);
    setDate(exp.date);
    setAmount(exp.amount);
    setPurpose(exp.purpose);
    setType(exp.type);
    setPayerId(exp.payerId || '');
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setDate('');
    setAmount('');
    setPurpose('');
    setType('shared');
    setPayerId('');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        💰 খরচ এন্ট্রি
      </Typography>
      {/* Entry Form */}
      <Card sx={{ maxWidth: 540, mx: "auto", boxShadow: 3, borderRadius: 4, bgcolor: "#f9fbfd", mb: 4 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="তারিখ"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                sx={{ bgcolor: "#fff" }}
                size="small"
              />
              <FormControl fullWidth required size="small" sx={{ bgcolor: "#fff" }}>
                <InputLabel id="payer-label">কে টাকা দিয়েছে?</InputLabel>
                <Select
                  labelId="payer-label"
                  value={payerId}
                  label="কে টাকা দিয়েছে?"
                  onChange={e => setPayerId(e.target.value)}
                >
                  <MenuItem value=""><em>সদস্য নির্বাচন করুন</em></MenuItem>
                  {members.map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="পরিমাণ (৳)"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                inputProps={{
                  min: 1,
                  step: 1,
                  style: { textAlign: "center", fontWeight: 700, fontSize: 18 }
                }}
                sx={{ bgcolor: "#fff", width: 160 }}
                size="small"
              />
              <TextField
                label="কারণ/বিবরণ"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                required
                sx={{ bgcolor: "#fff" }}
                size="small"
              />
              <FormControl fullWidth required size="small" sx={{ bgcolor: "#fff" }}>
                <InputLabel id="type-label">খরচের ধরন</InputLabel>
                <Select
                  labelId="type-label"
                  value={type}
                  label="খরচের ধরন"
                  onChange={e => setType(e.target.value)}
                >
                  <MenuItem value="shared">Shared</MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                </Select>
              </FormControl>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={editId ? <EditIcon /> : <SaveIcon />}
                  sx={{ px: 4, fontWeight: 600, fontSize: 16, borderRadius: 2 }}
                >
                  {editId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                </Button>
                {editId && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={handleCancelEdit}
                  >
                    বাতিল
                  </Button>
                )}
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        🧾 খরচের তালিকা ({currentMonth})
      </Typography>
      <TableContainer component={Paper} sx={{
        maxWidth: 1100,
        mx: "auto",
        boxShadow: 2,
        borderRadius: 3,
        mt: 2,
        background: "#fff"
      }}>
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ background: "#f6faff" }}>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 17 }}>তারিখ</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 17 }}>সদস্য</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 17 }}>টাকার পরিমাণ</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 17 }}>কারণ/বিবরণ</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 17 }}>ধরন</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: 17 }}>একশন</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: "#888", py: 4, fontSize: 16 }}>
                  কোনো খরচ এন্ট্রি নেই
                </TableCell>
              </TableRow>
            ) : (
              expenses.map(exp => (
                <TableRow key={exp.id} hover sx={{
                  transition: "all 0.18s", "&:hover": { background: "#f8fbff" }
                }}>
                  <TableCell align="center" sx={{ fontSize: 16 }}>{exp.date}</TableCell>
                  <TableCell align="center" sx={{ fontSize: 16 }}>{getMemberName(exp.payerId)}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#1976d2", fontSize: 17 }}>
                    {exp.amount} টাকা
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: 15, wordBreak: "break-word" }}>{exp.purpose}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {exp.type === 'shared' ? 'Shared' : 'Individual'}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="এডিট করুন">
                        <Button
                          color="primary"
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(exp)}
                          sx={{
                            minWidth: 0,
                            px: 1.2,
                            borderRadius: 2,
                            fontWeight: 600,
                            border: "1.5px solid #1976d2",
                            background: "#f7fbff",
                            '&:hover': {
                              background: "#e3f0ff",
                              border: "1.5px solid #0a56a3"
                            },
                            boxShadow: 0,
                            textTransform: "none",
                            cursor: "pointer"
                          }}
                        >
                          এডিট
                        </Button>
                      </Tooltip>
                      <Tooltip title="ডিলিট করুন">
                        <Button
                          color="error"
                          size="small"
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(exp.id)}
                          sx={{
                            minWidth: 0,
                            px: 1.2,
                            borderRadius: 2,
                            fontWeight: 600,
                            border: "1.5px solid #e53935",
                            background: "#fff7f7",
                            '&:hover': {
                              background: "#ffeaea",
                              border: "1.5px solid #b71c1c"
                            },
                            boxShadow: 0,
                            textTransform: "none",
                            cursor: "pointer"
                          }}
                        >
                          ডিলিট
                        </Button>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ===== Member Delete করলে তার সব Expense অটো ডিলিট করার ফাংশন =====
export async function deleteMemberExpenses(memberId) {
  const db = getFirestore();
  const expenseQuery = query(collection(db, 'expenses'), where('payerId', '==', memberId));
  const expenseSnap = await getDocs(expenseQuery);
  for (const docu of expenseSnap.docs) {
    await deleteDoc(doc(db, 'expenses', docu.id));
  }
}
