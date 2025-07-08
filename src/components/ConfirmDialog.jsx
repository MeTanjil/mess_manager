import React from "react";
import { Box, Typography, Button, Stack, Paper, Divider } from "@mui/material";
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

export default function ConfirmDialog({ show, message, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0, left: 0, width: "100vw", height: "100vh",
        bgcolor: "rgba(0,0,0,0.50)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Paper
        elevation={5}
        sx={{
          minWidth: 340,
          borderRadius: 3,
          boxShadow: 4,
          px: 3,
          py: 2.5,
          textAlign: "center",
          position: "relative"
        }}
      >
        <Divider sx={{ mb: 2, borderBottomWidth: 2, borderColor: 'error.main' }} />
        <WarningAmberRoundedIcon color="error" sx={{ fontSize: 44, mb: 1 }} />
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.3, color: "error.main" }}>
          সতর্কতা
        </Typography>
        <Typography sx={{ mb: 3, color: "#222", fontSize: 16 }}>
          {message}
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            color="error"
            onClick={onConfirm}
            sx={{ fontWeight: 700, px: 4, borderRadius: 2 }}
          >
            ডিলিট করুন
          </Button>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{ fontWeight: 600, px: 4, borderRadius: 2, bgcolor: "#fafafa" }}
          >
            বাতিল
          </Button>
        </Stack>
        <Divider sx={{ mt: 2, borderBottomWidth: 2, borderColor: 'error.main' }} />
      </Paper>
    </Box>
  );
}
