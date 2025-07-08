import React, { useEffect, useState, useCallback } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useMonth } from '../context/MonthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Box, Paper, Card, CardContent, Typography, Grid, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Stack, Tooltip, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

const db = getFirestore();

// Completely remove a member and all related data
async function deleteMemberCompletely(memberId, memberName) {
  // 1. Delete member from 'members'
  await deleteDoc(doc(db, 'members', memberId));

  // 2. Remove from all meals (if meals object empty, delete doc)
  const mealSnap = await getDocs(collection(db, 'meals'));
  for (const docu of mealSnap.docs) {
    const data = docu.data();
    if (data.meals && Object.keys(data.meals).includes(memberId)) {
      const newMeals = { ...data.meals };
      delete newMeals[memberId];
      if (Object.keys(newMeals).length === 0) {
        await deleteDoc(doc(db, 'meals', docu.id));
      } else {
        await updateDoc(doc(db, 'meals', docu.id), { meals: newMeals });
      }
    }
  }

  // 3. Remove from all expenses (payerId)
  const expSnap = await getDocs(collection(db, 'expenses'));
  for (const docu of expSnap.docs) {
    const data = docu.data();
    if (data.payerId === memberId) {
      await deleteDoc(doc(db, 'expenses', docu.id));
    }
  }

  // 4. Remove from all deposits (by name)
  const depSnap = await getDocs(collection(db, 'deposits'));
  for (const docu of depSnap.docs) {
    const data = docu.data();
    if (data.member === memberName) {
      await deleteDoc(doc(db, 'deposits', docu.id));
    }
  }

  // 5. Remove from all bazar (by name)
  const bazarSnap = await getDocs(collection(db, 'bazar'));
  for (const docu of bazarSnap.docs) {
    const data = docu.data();
    if (data.person === memberName) {
      await deleteDoc(doc(db, 'bazar', docu.id));
    }
  }
}

export default function Meals({ showToast }) {
  const [members, setMembers] = useState([]);
  const [savedMeals, setSavedMeals] = useState([]);
  const [editingMealId, setEditingMealId] = useState(null);
  const [editData, setEditData] = useState({});
  const { currentMonth } = useMonth();
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState({ show: false, id: null, date: "" });
  const [deleteMemberDialog, setDeleteMemberDialog] = useState({ show: false, memberId: null, memberName: '' });

  // id to name
  const getMemberName = useCallback((id) => {
    const m = members.find(m => m.id === id);
    return m ? m.name : id;
  }, [members]);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'members'));
    setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, []);

  // Fetch meals for current month
  const fetchSavedMeals = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'meals'));
    const allMeals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSavedMeals(allMeals.filter(m => m.monthId === currentMonth));
  }, [currentMonth]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (currentMonth) fetchSavedMeals();
  }, [currentMonth, fetchSavedMeals]);

  // Delete Meal (single)
  const handleDelete = async (mealId) => {
    await deleteDoc(doc(db, 'meals', mealId));
    await fetchSavedMeals();
    showToast && showToast("মিল ডিলিট হয়েছে!", "success");
  };

  // Start Edit
  const handleEdit = (meal) => {
    setEditingMealId(meal.id);
    // meal.meals থেকে সদস্য id-wise object, সংখ্যা হিসেবে set
    const asNumbers = {};
    for (const [mid, val] of Object.entries(meal.meals)) {
      asNumbers[mid] = {
        breakfast: Number(val.breakfast) || 0,
        lunch: Number(val.lunch) || 0,
        dinner: Number(val.dinner) || 0
      };
    }
    setEditData(asNumbers);
    setError('');
    showToast && showToast("এডিট মোডে আছেন!", "info");
  };

  // Edit Change
  const handleEditChange = (memberId, type, value) => {
    setEditData(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [type]: value === '' ? '' : Number(value)
      }
    }));
  };

  // Save Edit
  const handleSaveEdit = async () => {
    // শুধু যাদের কোনো মিল আছে তাদেরই save করবে
    const cleanedEditData = {};
    for (const [mid, val] of Object.entries(editData)) {
      const hasMeal = Number(val.breakfast) > 0 || Number(val.lunch) > 0 || Number(val.dinner) > 0;
      if (hasMeal) {
        cleanedEditData[mid] = {
          breakfast: Number(val.breakfast) || 0,
          lunch: Number(val.lunch) || 0,
          dinner: Number(val.dinner) || 0
        };
      }
    }
    const mealEntered = Object.keys(cleanedEditData).length > 0;
    if (!mealEntered) {
      setError("কমপক্ষে একজনের জন্য অন্তত একবেলা meal লিখুন!");
      showToast && showToast("কমপক্ষে একজনের জন্য meal দিতে হবে!", "error");
      return;
    }

    const docRef = doc(db, 'meals', editingMealId);
    await updateDoc(docRef, { meals: cleanedEditData });
    await fetchSavedMeals();
    setEditingMealId(null);
    setEditData({});
    setError('');
    showToast && showToast("মিল আপডেট হয়েছে!", "success");
  };

  // Member Delete Modal show function (যদি দরকার হয় parent থেকে কল)
  const openDeleteMember = (memberId, memberName) => {
    setDeleteMemberDialog({ show: true, memberId, memberName });
  };

  // Confirm Delete Member (utility call)
  const handleDeleteMember = async () => {
    await deleteMemberCompletely(deleteMemberDialog.memberId, deleteMemberDialog.memberName);
    await fetchMembers();
    await fetchSavedMeals();
    setDeleteMemberDialog({ show: false, memberId: null, memberName: '' });
    showToast && showToast("সদস্য এবং সংশ্লিষ্ট সব হিসাব ডিলিট হয়েছে!", "success");
  };

  return (
    <Box maxWidth="xl" mx="auto" mt={4} px={2}>
      <Paper
        elevation={4}
        sx={{
          p: 0,
          borderRadius: 4,
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}
      >
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />
        <Box px={3} pt={2} pb={1}>
          <Typography variant="h6" fontWeight={700} color="primary">
            📅 সেভকৃত মিল তালিকা ({currentMonth || "নির্বাচিত নয়"})
          </Typography>
        </Box>

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
          {savedMeals.length === 0 && (
            <Typography sx={{ mb: 2, color: "#777", px: 3 }}>
              এই মাসে এখনও কোন মিল এন্ট্রি নেই।
            </Typography>
          )}

          <Grid container spacing={3} alignItems="stretch" sx={{ px: 2 }}>
            {savedMeals
              .filter(meal => meal.meals && Object.keys(meal.meals).length > 0)
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(meal => (
                <Grid
                  item
                  xs={12}
                  md={6}
                  lg={4}
                  key={meal.id}
                  sx={{ display: "flex" }}
                >
                  <Card
                    sx={{
                      borderRadius: 4,
                      boxShadow: 3,
                      bgcolor: "#f9fbfd",
                      minHeight: 265,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <CardContent
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        pb: "16px !important"
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1.5,
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 1 }}>
                          <span role="img" aria-label="calendar">📅</span> {meal.date}
                        </Typography>
                        {editingMealId !== meal.id && (
                          <Stack direction="row" spacing={1.2}>
                            <Tooltip title="এডিট">
                              <IconButton
                                color="primary"
                                sx={{
                                  bgcolor: "#e3f0ff",
                                  "&:hover": { bgcolor: "#b4d5fa" }
                                }}
                                onClick={() => handleEdit(meal)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="ডিলিট">
                              <IconButton
                                color="error"
                                sx={{
                                  bgcolor: "#fff0f0",
                                  "&:hover": { bgcolor: "#fddada" }
                                }}
                                onClick={() =>
                                  setConfirmState({ show: true, id: meal.id, date: meal.date })
                                }
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        {editingMealId === meal.id ? (
                          <>
                            <TableContainer component={Paper} sx={{ boxShadow: 0, mb: 1 }}>
                              <Table>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>সদস্য</TableCell>
                                    <TableCell align="center">নাস্তা</TableCell>
                                    <TableCell align="center">দুপুর</TableCell>
                                    <TableCell align="center">রাত</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {members.map(m => (
                                    <TableRow key={m.id}>
                                      <TableCell>
                                        <b>{m.name}</b>
                                      </TableCell>
                                      <TableCell align="center">
                                        <TextField
                                          size="small"
                                          type="number"
                                          inputProps={{ step: "0.5", min: "0" }}
                                          value={editData[m.id]?.breakfast || ''}
                                          onChange={e =>
                                            handleEditChange(m.id, 'breakfast', e.target.value)
                                          }
                                          sx={{ width: 60 }}
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <TextField
                                          size="small"
                                          type="number"
                                          inputProps={{ step: "0.5", min: "0" }}
                                          value={editData[m.id]?.lunch || ''}
                                          onChange={e =>
                                            handleEditChange(m.id, 'lunch', e.target.value)
                                          }
                                          sx={{ width: 60 }}
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <TextField
                                          size="small"
                                          type="number"
                                          inputProps={{ step: "0.5", min: "0" }}
                                          value={editData[m.id]?.dinner || ''}
                                          onChange={e =>
                                            handleEditChange(m.id, 'dinner', e.target.value)
                                          }
                                          sx={{ width: 60 }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                            {error && (
                              <Typography color="error" sx={{ mb: 1, fontWeight: 500 }}>
                                ⚠️ {error}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveEdit}
                              >
                                আপডেট করুন
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<CloseIcon />}
                                onClick={() => {
                                  setEditingMealId(null);
                                  setEditData({});
                                  setError('');
                                }}
                              >
                                বাতিল
                              </Button>
                            </Stack>
                          </>
                        ) : (
                          <TableContainer component={Paper} sx={{ boxShadow: 0 }}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>সদস্য</TableCell>
                                  <TableCell align="center">নাস্তা</TableCell>
                                  <TableCell align="center">দুপুর</TableCell>
                                  <TableCell align="center">রাত</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.entries(meal.meals).map(([mid, mealObj]) => (
                                  members.some(m => m.id === mid) && (
                                    <TableRow key={mid}>
                                      <TableCell>
                                        <b>{getMemberName(mid)}</b>
                                      </TableCell>
                                      <TableCell align="center">{mealObj.breakfast || 0}</TableCell>
                                      <TableCell align="center">{mealObj.lunch || 0}</TableCell>
                                      <TableCell align="center">{mealObj.dinner || 0}</TableCell>
                                    </TableRow>
                                  )
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />
        <Box px={3} py={2}>
          <Typography sx={{ color: "gray" }}>
            <b>নোট:</b> মিল এন্ট্রি বা আপডেটের পর রেট/রিপোর্ট অটো আপডেট হবে।
          </Typography>
        </Box>
      </Paper>

      {/* Meal Delete Confirm */}
      <ConfirmDialog
        show={confirmState.show}
        message={`তারিখ: ${confirmState.date} - এই মিলটি ডিলিট করবেন?`}
        onConfirm={async () => {
          await handleDelete(confirmState.id);
          setConfirmState({ show: false, id: null, date: "" });
        }}
        onCancel={() => setConfirmState({ show: false, id: null, date: "" })}
      />

      {/* Member Delete Confirm */}
      <ConfirmDialog
        show={deleteMemberDialog.show}
        message={
          <span>
            <b>{deleteMemberDialog.memberName}</b> এবং তার সমস্ত হিসাব ডিলিট করবেন?<br />
            <span style={{ color: 'red' }}>সব meal, expense, bazar, deposit মুছে যাবে।</span>
          </span>
        }
        onConfirm={handleDeleteMember}
        onCancel={() => setDeleteMemberDialog({ show: false, memberId: null, memberName: '' })}
      />
    </Box>
  );
}