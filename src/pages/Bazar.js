import React, { useState, useEffect, useCallback } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
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

export default function Bazar({ showToast }) {
  const [members, setMembers] = useState([]);
  const [bazarList, setBazarList] = useState([]);
  const [date, setDate] = useState('');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const { currentMonth } = useMonth();
  const [confirmState, setConfirmState] = useState({ show: false, id: null, date: '', person: '' });

  // fetch members - always up to date
  const fetchMembers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'members'));
    setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, []);

  // fetch bazar - always up to date
  const fetchBazar = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'bazar'));
    const allBazar = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBazarList(allBazar.filter(b => b.monthId === currentMonth));
  }, [currentMonth]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (currentMonth) fetchBazar();
  }, [currentMonth, fetchBazar]);

  const resetForm = () => {
    setDate('');
    setPerson('');
    setAmount('');
    setDescription('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) {
      showToast && showToast("তারিখ দিন!", "error");
      return;
    }
    if (!person) {
      showToast && showToast("কে বাজার করেছে নির্বাচন করুন!", "warning");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      showToast && showToast("সঠিক টাকার পরিমাণ লিখুন (১ বা তার বেশি)!", "error");
      return;
    }
    if (!description.trim()) {
      showToast && showToast("বিবরণ লিখুন (কী কী কেনা হয়েছে)!", "error");
      return;
    }

    if (editingId) {
      await updateDoc(doc(db, 'bazar', editingId), {
        date,
        person,
        amount: Number(amount),
        description,
        monthId: currentMonth,
      });
      showToast && showToast("বাজার এন্ট্রি আপডেট হয়েছে!", "success");
    } else {
      await addDoc(collection(db, 'bazar'), {
        date,
        person,
        amount: Number(amount),
        description,
        monthId: currentMonth,
      });
      showToast && showToast("বাজার এন্ট্রি সফলভাবে সংরক্ষণ হয়েছে!", "success");
    }
    resetForm();
    fetchBazar();
  };

  const handleEdit = (bazar) => {
    setDate(bazar.date);
    setPerson(bazar.person);
    setAmount(bazar.amount);
    setDescription(bazar.description || '');
    setEditingId(bazar.id);
    showToast && showToast("এডিট মোডে আছো!", "info");
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'bazar', id));
    showToast && showToast("বাজার এন্ট্রি ডিলিট হয়েছে!", "success");
    fetchBazar();
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
            🛒 বাজার এন্ট্রি
          </Typography>
        </Box>

        {/* Left/Right Divider (form+table box) */}
        <Box
          sx={{
            px: 0,
            borderLeft: '2px solid #1976d2',
            borderRight: '2px solid #1976d2',
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          {/* Entry Form */}
          <Box py={2} px={3}>
            <Card sx={{ maxWidth: 500, mx: "auto", boxShadow: 1, borderRadius: 3, bgcolor: "#f9fbfd", mb: 1 }}>
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
                      <InputLabel id="person-label">কে বাজার করেছে</InputLabel>
                      <Select
                        labelId="person-label"
                        value={person}
                        label="কে বাজার করেছে"
                        onChange={e => setPerson(e.target.value)}
                      >
                        <MenuItem value=""><em>-- সদস্য নির্বাচন করুন --</em></MenuItem>
                        {members.map(m => (
                          <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="টাকার পরিমাণ"
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      inputProps={{
                        min: 1,
                        step: 1,
                        style: { textAlign: "center", fontWeight: 700, fontSize: 18 }
                      }}
                      required
                      sx={{ bgcolor: "#fff", width: 160 }}
                      size="small"
                    />
                    <TextField
                      label="বিবরণ (কী কী বাজার করেছেন)"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      multiline
                      minRows={2}
                      maxRows={4}
                      required
                      sx={{ bgcolor: "#fff" }}
                      size="small"
                      placeholder="যেমন: চাল, ডাল, তেল, সাবান"
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
            এই মাসের বাজারের তালিকা ({currentMonth}):
          </Typography>

          {/* Table */}
          <TableContainer component={Box} sx={{ mb: 2 }}>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell align="left" sx={{ fontWeight: 700, fontSize: 16, width: 140 }}>তারিখ</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700, fontSize: 16, width: 210 }}>সদস্য</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700, fontSize: 16, width: 170 }}>টাকার পরিমাণ</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700, fontSize: 16, width: 260 }}>বিবরণ</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 16, width: 110 }}>একশন</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bazarList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: "#888", py: 4, fontSize: 16 }}>
                      কোনো বাজার এন্ট্রি নেই।
                    </TableCell>
                  </TableRow>
                ) : (
                  bazarList.sort((a, b) => a.date.localeCompare(b.date)).map(bazar => (
                    <TableRow key={bazar.id} hover sx={{
                      transition: "all 0.18s", "&:hover": { background: "#f8fbff" }
                    }}>
                      <TableCell align="left" sx={{ fontSize: 16 }}>{bazar.date}</TableCell>
                      <TableCell align="left" sx={{ fontSize: 16 }}>{bazar.person}</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 700, color: "#1976d2", fontSize: 17 }}>
                        {bazar.amount} টাকা
                      </TableCell>
                      <TableCell align="left" sx={{ fontSize: 15, wordBreak: "break-word", whiteSpace: "pre-line" }}>
                        {bazar.description || <span style={{ color: "#bbb" }}>-</span>}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="এডিট করুন">
                            <Button
                              color="primary"
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleEdit(bazar)}
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
                                setConfirmState({ show: true, id: bazar.id, date: bazar.date, person: bazar.person })
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
            <b>নোট:</b> বাজারের তথ্য যুক্ত/পরিবর্তনের পর রিপোর্টে হিসাব সঙ্গে সঙ্গে আপডেট হবে।
          </Typography>
        </Box>
      </Paper>

      {/* Custom Confirm Modal */}
      <ConfirmDialog
        show={confirmState.show}
        message={
          <span>
            {confirmState.date && <>তারিখ: <b>{confirmState.date}</b><br /></>}
            {confirmState.person && <>কার: <b>{confirmState.person}</b><br /></>}
            আপনি কি নিশ্চিতভাবে এই বাজার এন্ট্রি ডিলিট করতে চান?
          </span>
        }
        onConfirm={async () => {
          await handleDelete(confirmState.id);
          setConfirmState({ show: false, id: null, date: '', person: '' });
        }}
        onCancel={() => setConfirmState({ show: false, id: null, date: '', person: '' })}
      />
    </Box>
  );
}
