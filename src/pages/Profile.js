import React, { useState } from 'react';
import { useFirebaseAuth } from '../FirebaseAuthContext';
import {
  Paper,
  Divider,
  Box,
  Typography,
  Stack,
  Avatar,
  TextField,
  Button,
} from '@mui/material';
import { getAuth, updateProfile, updatePassword, sendPasswordResetEmail } from 'firebase/auth';

export default function Profile({ showToast }) {
  const { user } = useFirebaseAuth();
  const auth = getAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [newPassword, setNewPassword] = useState('');

  if (!user) return (
    <Box mt={8} textAlign="center">
      <Typography color="error" variant="h6">কোনো ইউজার নেই!</Typography>
    </Box>
  );

  // Profile Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(user, { displayName, photoURL });
      showToast && showToast('প্রোফাইল আপডেট হয়েছে!', 'success');
    } catch (err) {
      showToast && showToast('Update ব্যর্থ: ' + err.message, 'error');
      console.log(err);
    }
  };

  // Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast && showToast('Password কমপক্ষে ৬ অক্ষরের হতে হবে!', 'error');
      return;
    }
    try {
      await updatePassword(user, newPassword);
      showToast && showToast('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!', 'success');
      setNewPassword('');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        showToast && showToast('Password পরিবর্তনের জন্য আপনাকে আবার লগইন করতে হবে অথবা Reset লিঙ্ক ব্যবহার করুন।', 'error');
      } else {
        showToast && showToast('Password পরিবর্তন ব্যর্থ: ' + err.message, 'error');
      }
      console.log(err);
    }
  };

  // Password reset email
  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      showToast && showToast('Password reset লিঙ্ক ইমেইলে পাঠানো হয়েছে!', 'success');
    } catch (err) {
      showToast && showToast('Password reset ব্যর্থ: ' + err.message, 'error');
      console.log(err);
    }
  };

  return (
    <Box maxWidth={420} mx="auto" mt={6}>
      <Paper
        elevation={4}
        sx={{
          p: 0,
          borderRadius: 4,
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}
      >
        {/* Top Divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />
        {/* Header/Profile pic */}
        <Box px={3} pt={3} pb={1} display="flex" flexDirection="column" alignItems="center">
          <Avatar
            src={photoURL || '/default-avatar.png'}
            alt="profile"
            sx={{
              width: 90, height: 90, mb: 1, bgcolor: "#e3e3e3", border: "2px solid #1976d2"
            }}
          />
          <Typography variant="h6" fontWeight={700} color="primary">👤 ইউজার প্রোফাইল</Typography>
        </Box>
        {/* Left/Right Divider */}
        <Box
          sx={{
            px: 0,
            borderLeft: '2px solid #1976d2',
            borderRight: '2px solid #1976d2',
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          {/* Profile Edit Form */}
          <Box component="form" onSubmit={handleSubmit} px={3} py={2}>
            <TextField
              label="নাম"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              label="ছবির লিঙ্ক (URL)"
              value={photoURL}
              onChange={e => setPhotoURL(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              * চাইলে Google Drive/Photos/Dropbox/Imgur থেকে public image link দিন।
            </Typography>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="medium"
              sx={{ borderRadius: 2, minWidth: 160, mt: 1 }}
              fullWidth
            >
              প্রোফাইল আপডেট
            </Button>
          </Box>
          {/* Bottom Divider */}
          <Divider sx={{ my: 0 }} />
          {/* Password Change */}
          <Box px={3} py={2}>
            <Typography fontWeight={600} mb={1}>🔑 পাসওয়ার্ড পরিবর্তন</Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              component="form"
              onSubmit={handlePasswordChange}
            >
              <TextField
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড (৬+ অক্ষর)"
                size="small"
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                sx={{ borderRadius: 2, minWidth: 120 }}
              >
                পরিবর্তন করুন
              </Button>
            </Stack>
            <Button
              variant="text"
              sx={{
                mt: 1,
                color: 'primary.main',
                textDecoration: 'underline',
                fontSize: 14,
                px: 0,
                minWidth: 0,
              }}
              onClick={handlePasswordReset}
            >
              পাসওয়ার্ড ভুলে গেছেন? Reset লিঙ্ক পাঠান
            </Button>
          </Box>
          <Divider sx={{ my: 0 }} />
          {/* User Email */}
          <Box px={3} py={2}>
            <Typography variant="subtitle2" fontWeight={600}>ইমেইল:</Typography>
            <Typography variant="body2">{user.email}</Typography>
          </Box>
        </Box>
        {/* Bottom Divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main' }} />
      </Paper>
    </Box>
  );
}
