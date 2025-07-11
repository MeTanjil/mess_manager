import React, { useState, useEffect, useCallback } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';
import ConfirmDialog from '../components/ConfirmDialog';

import {
  Box, Paper, Card, CardContent, Typography, Button, TextField, Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, Tooltip, Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

const db = getFirestore();

export default function Deposit({ showToast }) {
  const [date, setDate] = useState('');
  const [member, setMember] = useState('');
  const [amount, setAmount] = useState('');
  const [depositList, setDepositList] = useState([]);
  const [members, setMembers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const { currentMonth } = useMonth();
  const [confirmState, setConfirmState] = useState({ show: false, id: null, date: '', member: '' });

  // fetchMembers always fresh
  const fetchMembers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'members'));
    setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, []);

  // fetchDeposits always fresh
  const fetchDeposits = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'deposits'));
    const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDepositList(allData.filter(item => item.monthId === currentMonth));
  }, [currentMonth]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { if (currentMonth) fetchDeposits(); }, [currentMonth, fetchDeposits]);

  const resetForm = () => {
    setDate('');
    setMember('');
    setAmount('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date) {
      showToast && showToast('তারিখ সিলেক্ট করুন!', 'error');
      return;
    }
    if (!member) {
      showToast && showToast('মেম্বার নির্বাচন করুন!', 'error');
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      showToast && showToast('সঠিক টাকার পরিমাণ লিখুন!', 'error');
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'deposits', editingId), {
          date,
          member,
          amount: parseFloat(amount),
          monthId: currentMonth,
        });
        showToast && showToast('জমা আপডেট হয়েছে!', 'success');
      } else {
        await addDoc(collection(db, 'deposits'), {
          date,
          member,
          amount: parseFloat(amount),
          monthId: currentMonth,
        });
        showToast && showToast('জমা সংরক্ষণ হয়েছে!', 'success');
      }
      resetForm();
      fetchDeposits();
    } catch (err) {
      showToast && showToast('কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন!', 'error');
    }
  };

  const handleEdit = (item) => {
    setDate(item.date);
    setMember(item.member);
    setAmount(item.amount);
    setEditingId(item.id);
    showToast && showToast('এডিট মোডে আছেন!', 'info');
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'deposits', id));
    showToast && showToast('জমা ডিলিট হয়েছে!', 'success');
    fetchDeposits();
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
          <Typography variant="h6" fontWeight={700} color="primary">
            💰 জমা এন্ট্রি
          </Typography>
        </Box>

        {/* Entry Form */}
        <Box
          sx={{
            px: 0,
            borderLeft: '2px solid #1976d2',
            borderRight: '2px solid #1976d2',
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <Box py={2} px={3}>
            <Card sx={{ maxWidth: 480, mx: "auto", boxShadow: 1, borderRadius: 3, bgcolor: "#f9fbfd", mb: 1 }}>
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
                      <InputLabel id="member-label">মেম্বার</InputLabel>
                      <Select
                        labelId="member-label"
                        value={member}
                        label="মেম্বার"
                        onChange={e => setMember(e.target.value)}
                      >
                        <MenuItem value=""><em>-- সদস্য নির্বাচন করুন --</em></MenuItem>
                        {members.map((m) => (
                          <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="টাকার পরিমাণ (৳)"
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      required
                      inputProps={{
                        min: 1,
                        step: 1,
                        style: { textAlign: "center", fontWeight: 700, fontSize: 18 }
                      }}
                      sx={{ bgcolor: "#fff", width: 180 }}
                      size="small"
                    />
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={editingId ? <EditIcon /> : <SaveIcon />}
                        sx={{ px: 4, fontWeight: 600, fontSize: 16, borderRadius: 2 }}
                      >
                        {editingId ? "আপডেট করুন" : "সেভ করুন"}
                      </Button>
                      {editingId && (
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={resetForm}
                        >
                          বাতিল
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Box>
          {/* Table Title */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ px: 3, mt: 1, mb: 1, textAlign: "left" }}>
            📅 {currentMonth} মাসের জমা তালিকা:
          </Typography>

          {/* Table */}
          <TableContainer component={Box} sx={{ mb: 2 }}>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell align="left" sx={{ fontWeight: 700, fontSize: 16, width: 120 }}>তারিখ</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700, fontSize: 16, width: 200 }}>মেম্বার</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700, fontSize: 16, width: 160 }}>টাকার পরিমাণ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 16, width: 120 }}>একশন</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {depositList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ color: "#888", py: 4, fontSize: 16 }}>
                      এই মাসে কোনো জমা নেই।
                    </TableCell>
                  </TableRow>
                ) : (
                  depositList.sort((a, b) => a.date.localeCompare(b.date)).map(item => (
                    <TableRow key={item.id} hover sx={{
                      transition: "all 0.18s", "&:hover": { background: "#f8fbff" }
                    }}>
                      <TableCell align="left" sx={{ fontSize: 16 }}>{item.date}</TableCell>
                      <TableCell align="left" sx={{ fontSize: 16 }}>{item.member}</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 700, color: "#1976d2", fontSize: 17 }}>
                        {item.amount} টাকা
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="এডিট করুন">
                            <Button
                              color="primary"
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleEdit(item)}
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
                              onClick={() =>
                                setConfirmState({
                                  show: true,
                                  id: item.id,
                                  date: item.date,
                                  member: item.member,
                                })
                              }
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

        {/* Bottom divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />
        {/* Footer notes */}
        <Box px={3} py={2}>
          <Typography sx={{ color: "gray" }}>
            <b>নোট:</b> জমা যুক্ত বা পরিবর্তনের পর রিপোর্ট/ব্যালেন্স পেজে সঙ্গে সঙ্গে হিসাব দেখাবে।
          </Typography>
        </Box>
      </Paper>

      {/* Confirm Modal */}
      <ConfirmDialog
        show={confirmState.show}
        message={
          <span>
            {confirmState.date && <>তারিখ: <b>{confirmState.date}</b><br /></>}
            {confirmState.member && <>কার: <b>{confirmState.member}</b><br /></>}
            আপনি কি নিশ্চিতভাবে এই জমা ডিলিট করতে চান?
          </span>
        }
        onConfirm={async () => {
          await handleDelete(confirmState.id);
          setConfirmState({ show: false, id: null, date: '', member: '' });
        }}
        onCancel={() => setConfirmState({ show: false, id: null, date: '', member: '' })}
      />
    </Box>
  );
}

// 🚀 Member Delete করলে তার সব deposit ডিলিট করার utility function:
export async function deleteMemberDeposits(memberName) {
  const db = getFirestore();
  const depositQuery = query(collection(db, 'deposits'), where('member', '==', memberName));
  const depositSnap = await getDocs(depositQuery);
  for (const docu of depositSnap.docs) {
    await deleteDoc(doc(db, 'deposits', docu.id));
  }
}