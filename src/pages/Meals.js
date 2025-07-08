import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
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

export default function Meals({ showToast }) {
  const [members, setMembers] = useState([]);
  const [savedMeals, setSavedMeals] = useState([]);
  const [editingMealId, setEditingMealId] = useState(null);
  const [editData, setEditData] = useState({});
  const { currentMonth } = useMonth();
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState({ show: false, id: null, date: "" });

  // Helper: id to name
  const getMemberName = (id) => {
    const m = members.find(m => m.id === id);
    return m ? m.name : id;
  };

  // সদস্য লোড
  useEffect(() => {
    const fetchMembers = async () => {
      const snapshot = await getDocs(collection(db, 'members'));
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchMembers();
  }, []);

  // Meal লোড
  useEffect(() => {
    const fetchSavedMeals = async () => {
      const snapshot = await getDocs(collection(db, 'meals'));
      const allMeals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedMeals(allMeals.filter(m => m.monthId === currentMonth));
    };
    if (currentMonth) fetchSavedMeals();
  }, [currentMonth]);

  // Delete (Custom Confirm)
  const handleDelete = async (mealId) => {
    await deleteDoc(doc(db, 'meals', mealId));
    setSavedMeals(prev => prev.filter(m => m.id !== mealId));
    showToast && showToast("মিল ডিলিট হয়েছে!", "success");
  };

  // Edit শুরু
  const handleEdit = (meal) => {
    setEditingMealId(meal.id);
    setEditData(meal.meals);
    setError('');
    showToast && showToast("এডিট মোডে আছেন!", "info");
  };

  // Edit ইনপুট পরিবর্তন
  const handleEditChange = (memberId, type, value) => {
    setEditData(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [type]: value
      }
    }));
  };

  // Edit সেভ
  const handleSaveEdit = async () => {
    const mealEntered = Object.values(editData).some(
      m => Number(m.breakfast) > 0 || Number(m.lunch) > 0 || Number(m.dinner) > 0
    );
    if (!mealEntered) {
      setError("কমপক্ষে একজনের জন্য অন্তত একবেলা meal লিখুন!");
      showToast && showToast("কমপক্ষে একজনের জন্য meal দিতে হবে!", "error");
      return;
    }

    const docRef = doc(db, 'meals', editingMealId);
    await updateDoc(docRef, {
      meals: editData
    });
    setSavedMeals(prev =>
      prev.map(m => m.id === editingMealId ? { ...m, meals: editData } : m)
    );
    setEditingMealId(null);
    setEditData({});
    setError('');
    showToast && showToast("মিল আপডেট হয়েছে!", "success");
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
        {/* Top divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />

        {/* Title */}
        <Box px={3} pt={2} pb={1}>
          <Typography variant="h6" fontWeight={700} color="primary">
            📅 সেভকৃত মিল তালিকা ({currentMonth || "নির্বাচিত নয়"})
          </Typography>
        </Box>

        <Box
          sx={{
            px: 0,
            borderLeft: '2px solid #1976d2',
            borderRight: '2px solid #1976d2',
            borderRadius: 0,
            overflow: 'hidden',
            pb: 4,
          }}
        >
          {/* No meal message */}
          {savedMeals.length === 0 && (
            <Typography sx={{ mb: 2, color: "#777", px: 3 }}>
              এই মাসে এখনও কোন মিল এন্ট্রি নেই।
            </Typography>
          )}

          {/* Meal cards (grid) */}
          <Grid container spacing={3} alignItems="stretch" sx={{ px: 2 }}>
            {savedMeals
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
                      {/* Top part */}
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

                      {/* Table or Edit Form */}
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
                                  <TableRow key={mid}>
                                    <TableCell>
                                      <b>{getMemberName(mid)}</b>
                                    </TableCell>
                                    <TableCell align="center">{mealObj.breakfast || 0}</TableCell>
                                    <TableCell align="center">{mealObj.lunch || 0}</TableCell>
                                    <TableCell align="center">{mealObj.dinner || 0}</TableCell>
                                  </TableRow>
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
        {/* Bottom divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />
        {/* Footer note */}
        <Box px={3} py={2}>
          <Typography sx={{ color: "gray" }}>
            <b>নোট:</b> মিল এন্ট্রি বা আপডেটের পর রেট/রিপোর্ট অটো আপডেট হবে।
          </Typography>
        </Box>
      </Paper>

      {/* Custom Confirm Modal */}
      <ConfirmDialog
        show={confirmState.show}
        message={`তারিখ: ${confirmState.date} - এই মিলটি ডিলিট করবেন?`}
        onConfirm={async () => {
          await handleDelete(confirmState.id);
          setConfirmState({ show: false, id: null, date: "" });
        }}
        onCancel={() => setConfirmState({ show: false, id: null, date: "" })}
      />
    </Box>
  );
}
