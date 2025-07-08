import React, { useState } from 'react';
import { useMonth } from '../context/MonthContext';
import {
  Box, Paper, Divider, Typography, Select, MenuItem, FormControl, InputLabel,
  TextField, Button, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function MonthSelector() {
  const { months, currentMonth, setCurrentMonth, addMonth } = useMonth();
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');

  const handleAdd = () => {
    if (newName && newId) {
      addMonth(newName, newId);
      setNewName('');
      setNewId('');
    } else {
      alert("মাসের নাম ও আইডি দিন (যেমন: 2024-07)");
    }
  };

  return (
    <Box maxWidth={420} mx="auto" mb={4}>
      <Paper
        elevation={3}
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
          <Typography variant="subtitle1" fontWeight={700} color="primary">
            মাস নির্বাচন ও নতুন মাস যোগ করুন
          </Typography>
        </Box>
        {/* Left/Right divider */}
        <Box
          sx={{
            px: 0,
            borderLeft: '2px solid #1976d2',
            borderRight: '2px solid #1976d2',
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <Box px={3} py={2}>
            {/* মাস নির্বাচন */}
            <FormControl fullWidth size="small" sx={{ mb: 2, bgcolor: "#fff" }}>
              <InputLabel id="current-month-label">চলতি মাস</InputLabel>
              <Select
                labelId="current-month-label"
                value={currentMonth || ''}
                label="চলতি মাস"
                onChange={(e) => setCurrentMonth(e.target.value)}
              >
                {months.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* নতুন মাস যোগ */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <TextField
                placeholder="নতুন মাসের নাম"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                size="small"
                sx={{ bgcolor: "#fff" }}
              />
              <TextField
                placeholder="ID (যেমন: 2024-07)"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                size="small"
                sx={{ bgcolor: "#fff" }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ fontWeight: 600, borderRadius: 2, px: 2 }}
              >
                নতুন মাস
              </Button>
            </Stack>
            <Typography sx={{ color: "gray", fontSize: 13, mt: 1 }}>
              উদাহরণ: "July 2024", ID: "2024-07"
            </Typography>
          </Box>
        </Box>
        {/* Bottom divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />
      </Paper>
    </Box>
  );
}
