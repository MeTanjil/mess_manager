import React, { useState } from 'react';
import { useFirebaseAuth } from '../FirebaseAuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Paper, Box, Typography, Divider, TextField, Button
} from '@mui/material';

export default function SignInSignUp() {
  const { signup, signin } = useFirebaseAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  // Main handleSubmit with direct navigate (NO setTimeout)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await signup(email, password, name);
        setMsg("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!");
        setName('');
      } else {
        await signin(email, password);
        setMsg("সাইন ইন সফল হয়েছে!");
      }
      // Navigate directly (no delay)
      navigate('/dashboard');
    } catch (err) {
      setMsg(`ত্রুটি: ${err.message}`);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        background: "linear-gradient(135deg, #e2f7f2 0%, #c8e6c9 100%)"
      }}
    >
      <Paper
        elevation={5}
        sx={{
          p: 0,
          borderRadius: 4,
          minWidth: 320,
          maxWidth: 390,
          width: "100%",
          boxShadow: 3,
          border: "1px solid #e0e0e0",
          overflow: 'hidden',
        }}
      >
        {/* Top divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: '#3bb59a' }} />
        <Box px={3} pt={3} pb={1} textAlign="center">
          <Typography
            variant="h6"
            fontWeight={700}
            color="primary"
            gutterBottom
            sx={{ letterSpacing: 0.2, mb: 0.5 }}
          >
            {isSignup ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'সাইন ইন করুন'}
          </Typography>
          <Typography fontSize="1rem" color="#555">
            মেস ম্যানেজার
          </Typography>
        </Box>
        {/* Left/right divider (form section) */}
        <Box
          sx={{
            px: 0,
            borderLeft: '2px solid #3bb59a',
            borderRight: '2px solid #3bb59a',
            borderRadius: 0,
            overflow: 'hidden',
            bgcolor: "#f9fbfd"
          }}
        >
          <Box px={3} pt={2} pb={1.5}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "19px" }}>
              {isSignup && (
                <TextField
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  label="আপনার নাম"
                  required
                  size="medium"
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: 1,
                  }}
                />
              )}
              <TextField
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                label="আপনার ইমেইল"
                required
                autoFocus
                size="medium"
                sx={{
                  bgcolor: "#fff",
                  borderRadius: 1,
                }}
              />
              <TextField
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                label="পাসওয়ার্ড"
                required
                size="medium"
                sx={{
                  bgcolor: "#fff",
                  borderRadius: 1,
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  background: "#3bb59a",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "1rem",
                  borderRadius: 2,
                  py: 1.2,
                  mt: 0.5,
                  boxShadow: 1,
                  '&:hover': {
                    background: "#2e907a"
                  }
                }}
              >
                {isSignup ? 'রেজিস্টার করুন' : 'সাইন ইন'}
              </Button>
            </form>
            <Button
              variant="text"
              fullWidth
              onClick={() => setIsSignup(!isSignup)}
              sx={{
                mt: 2,
                color: "#3bb59a",
                textDecoration: "underline",
                fontSize: "1rem",
                fontWeight: 500,
                borderRadius: 1
              }}
            >
              {isSignup ? 'আগে থেকেই অ্যাকাউন্ট আছে?' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
            </Button>
            <Typography
              sx={{
                mt: 2,
                color: msg.includes('ত্রুটি') ? "#d32f2f" : "#388e3c",
                fontWeight: 500,
                minHeight: "18px",
                textAlign: "center"
              }}
            >
              {msg}
            </Typography>
          </Box>
        </Box>
        {/* Bottom divider */}
        <Divider sx={{ borderBottomWidth: 2, borderColor: '#3bb59a' }} />
        {/* Footer note */}
        <Box px={3} py={1.2} sx={{ background: "#f9fbfd" }}>
          <Typography sx={{ color: "gray", fontSize: 13, textAlign: "center" }}>
            আপনার তথ্য নিরাপদ এবং শুধুমাত্র এই অ্যাপ ব্যবহারের জন্য।
          </Typography>
        </Box>
        {/* Created by credit (consistent system style) */}
        <Box pb={2} sx={{ background: "#f9fbfd" }}>
          <Typography
            sx={{
              textAlign: "center",
              color: "#3bb59a",
              fontWeight: 500,
              fontSize: 13,
              mt: 0.5,
              letterSpacing: 0.2
            }}
          >
            Created by <span style={{ fontWeight: 700 }}>Tanjil</span>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
