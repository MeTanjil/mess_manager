import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import {
  Card, Typography, Box, Grid, Button, TextField,
  IconButton, Stack, Tooltip, Avatar, Paper, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import ConfirmDialog from '../components/ConfirmDialog';

const db = getFirestore();

export default function Members({ showToast }) {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [confirmState, setConfirmState] = useState({ show: false, id: null, name: "" });

  // Load members fast
  const fetchMembers = async () => {
    const snapshot = await getDocs(collection(db, 'members'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setMembers(data);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Add/Update member
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast && showToast("নাম দিতে হবে!", "error");
      return;
    }
    if (editId) {
      const ref = doc(db, 'members', editId);
      await updateDoc(ref, { name });
      setEditId(null);
      showToast && showToast("সদস্য আপডেট হয়েছে!", "success");
    } else {
      await addDoc(collection(db, 'members'), { name });
      showToast && showToast("নতুন সদস্য যোগ হয়েছে!", "success");
    }
    setName('');
    fetchMembers();
  };

  // Edit
  const handleEdit = (m) => {
    setName(m.name);
    setEditId(m.id);
    showToast && showToast("এডিট মোডে আছেন!", "info");
  };

  // Delete member + ALL relevant data (meals, expense, deposit, bazar)
  const handleDelete = async (id) => {
    const member = members.find(m => m.id === id);
    if (!member) return;

    // Start batch for expenses, deposits, bazar, member doc (NOT for meals)
    const batch = writeBatch(db);

    // 1. Delete member doc
    batch.delete(doc(db, 'members', id));

    // 2. Remove from meals (remove property from meals object in all docs)
    const mealSnap = await getDocs(collection(db, 'meals'));
    for (const d of mealSnap.docs) {
      const mealsObj = d.data().meals || {};
      if (Object.keys(mealsObj).includes(id)) {
        const newMeals = { ...mealsObj };
        delete newMeals[id];
        try {
          await updateDoc(doc(db, 'meals', d.id), { meals: newMeals });
          console.log(`Deleted meals for memberId ${id} from doc ${d.id}`);
        } catch (e) {
          console.error(`Meal update failed for doc ${d.id} - memberId: ${id}`, e);
        }
      }
    }

    // 3. Delete all expenses (payerId === id)
    const expenseSnap = await getDocs(query(collection(db, 'expenses'), where('payerId', '==', id)));
    expenseSnap.forEach(d => batch.delete(doc(db, 'expenses', d.id)));

    // 4. Delete all deposits (member === member.name)
    const depositSnap = await getDocs(query(collection(db, 'deposits'), where('member', '==', member.name)));
    depositSnap.forEach(d => batch.delete(doc(db, 'deposits', d.id)));

    // 5. Delete all bazar (person === member.name)
    const bazarSnap = await getDocs(query(collection(db, 'bazar'), where('person', '==', member.name)));
    bazarSnap.forEach(d => batch.delete(doc(db, 'bazar', d.id)));

    await batch.commit();
    fetchMembers();
    showToast && showToast("সদস্য এবং সংশ্লিষ্ট সব হিসাব দ্রুত ডিলিট হয়েছে!", "success");
  };

  // Avatar initial
  const getInitial = name => name ? name[0].toUpperCase() : "?";

  return (
    <Box maxWidth="md" mx="auto" mt={4} px={2}>
      <Paper
        elevation={4}
        sx={{
          p: 0,
          borderRadius: 5,
          border: '1px solid #e0e0e0',
          overflow: "hidden",
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
            👥 সদস্য তালিকা
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
          {/* Input Form Centered */}
          <Grid container justifyContent="center" sx={{ mb: 2, mt: 1 }}>
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 2, p: 2, borderRadius: 3, bgcolor: "#f7faff", boxShadow: 1 }}>
                <form onSubmit={handleSubmit}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      label="নাম লিখুন"
                      variant="outlined"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                      required
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={editId ? <SaveIcon /> : <PersonAddAlt1Icon />}
                      color={editId ? "success" : "primary"}
                      sx={{ boxShadow: 1, borderRadius: 2 }}
                    >
                      {editId ? "আপডেট" : "যোগ করুন"}
                    </Button>
                  </Stack>
                </form>
              </Card>
            </Grid>
          </Grid>

          {/* Member List Table Centered */}
          <Grid container justifyContent="center">
            <Grid item xs={12} md={8}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  bgcolor: "#fff",
                  px: 0,
                  py: 0,
                  mb: 3
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    bgcolor: "#e3f0ff",
                    px: 4,
                    py: 2.2,
                    borderBottom: "1.5px solid #dde7f8",
                  }}
                >
                  <Box sx={{ flex: 2, fontWeight: 700, fontSize: 18 }}>নাম</Box>
                  <Box sx={{ flex: 1, fontWeight: 700, fontSize: 18, textAlign: "center" }}>একশন</Box>
                </Box>

                {/* Member rows */}
                {members.length === 0 && (
                  <Box sx={{ p: 4, textAlign: "center", color: "#777" }}>কোনো সদস্য নেই!</Box>
                )}
                <Box>
                  {members.map((m, i) => (
                    <Box
                      key={m.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 4,
                        py: 2.2,
                        bgcolor: "#fff",
                        borderBottom: i < members.length - 1 ? "1px solid #f1f1f7" : "none",
                        borderRadius: 0,
                        boxShadow: 0,
                        transition: "background 0.15s, box-shadow 0.2s",
                        "&:hover": {
                          background: "#f4faff",
                          boxShadow: 2,
                        },
                      }}
                    >
                      {/* Avatar + name */}
                      <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        minWidth: 0,
                        pr: 24,
                      }}>
                        <Avatar sx={{
                          bgcolor: "#3bb59a",
                          width: 44, height: 44, fontWeight: 700, mr: 2, fontSize: 22
                        }}>
                          {getInitial(m.name)}
                        </Avatar>
                        <Typography sx={{ fontSize: 18, fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {m.name}
                        </Typography>
                      </Box>
                      {/* Actions */}
                      <Box sx={{ minWidth: 170, textAlign: "center" }}>
                        <Stack direction="row" spacing={2} justifyContent="center">
                          <Tooltip title="এডিট">
                            <IconButton
                              color="primary"
                              sx={{
                                bgcolor: "#e3f0ff",
                                "&:hover": { bgcolor: "#b4d5fa" }
                              }}
                              onClick={() => handleEdit(m)}
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
                              onClick={() => setConfirmState({ show: true, id: m.id, name: m.name })}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        {/* Bottom divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />
        {/* Footer note */}
        <Box px={3} py={2}>
          <Typography sx={{ color: "gray" }}>
            <b>নোট:</b> সদস্য যোগ বা ডিলিট করার পর রিপোর্ট/রেট/মিল/খরচ সব অটো আপডেট হবে।
          </Typography>
        </Box>
      </Paper>

      <ConfirmDialog
        show={confirmState.show}
        message={
          <span>
            {confirmState.name} - এই সদস্য এবং তার সব হিসাব দ্রুত ডিলিট করবেন?<br />
            <span style={{ color: 'red' }}>সতর্কতা: সব meal, expense, bazar, deposit ডিলিট হবে।</span>
          </span>
        }
        onConfirm={async () => {
          await handleDelete(confirmState.id);
          setConfirmState({ show: false, id: null, name: "" });
        }}
        onCancel={() => setConfirmState({ show: false, id: null, name: "" })}
      />
    </Box>
  );
}