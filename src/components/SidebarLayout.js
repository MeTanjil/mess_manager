import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, AppBar, Toolbar, List, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Select, MenuItem, Avatar, Button, Divider
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AddBoxIcon from '@mui/icons-material/AddBox';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SavingsIcon from '@mui/icons-material/Savings';
import StarRateIcon from '@mui/icons-material/StarRate';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

import { useFirebaseAuth } from '../FirebaseAuthContext';
import { useMonth } from '../context/MonthContext';
import MessNameBar from './MessNameBar';

const drawerWidth = 230;

const navItems = [
  { path: '/dashboard', label: 'ড্যাশবোর্ড', icon: <DashboardIcon /> },
  { path: '/members', label: 'মেম্বার', icon: <PeopleIcon /> },
  { path: '/meals', label: 'মিল', icon: <RestaurantIcon /> },
  { path: '/meal-entry', label: 'মিল এন্ট্রি', icon: <AddBoxIcon /> },
  { path: '/expense-entry', label: 'খরচ এন্ট্রি', icon: <AttachMoneyIcon /> },
  { path: '/bazar', label: 'বাজার', icon: <ShoppingCartIcon /> },
  { path: '/deposit', label: 'জমা', icon: <SavingsIcon /> },
  { path: '/rate', label: 'মিল রেট', icon: <StarRateIcon /> },
  { path: '/calc', label: 'রিপোর্ট', icon: <AssessmentIcon /> },
  { path: '/profile', label: 'প্রোফাইল', icon: <AccountCircleIcon /> },
];

export default function SidebarLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signout, user } = useFirebaseAuth();
  const { currentMonth, setCurrentMonth } = useMonth();

  // মাস ডিফল্ট সেট করা
  useEffect(() => {
    if (!currentMonth) {
      const now = new Date();
      const def = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      setCurrentMonth(def);
    }
  }, [currentMonth, setCurrentMonth]);

  // 2024 থেকে শুরু করে আগামী ২ বছর পর্যন্ত মাস তৈরি
  const generateAllMonths = () => {
    const months = [];
    const startYear = 2024;
    const now = new Date();
    const endYear = now.getFullYear() + 2;
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        const value = `${year}-${month.toString().padStart(2, '0')}`;
        const label = new Date(year, month - 1).toLocaleDateString('bn-BD', {
          year: 'numeric',
          month: 'long',
        });
        months.push({ value, label });
      }
    }
    return months;
  };

  // ইউজার ইনিশিয়াল
  const getUserInitial = () =>
    (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <Box sx={{ display: 'flex' }}>
      {/* --- AppBar --- */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme => theme.zIndex.drawer + 1,
          bgcolor: "#1976d2",
        }}
      >
        <Toolbar sx={{ minHeight: 60 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            মেস ম্যানেজার
          </Typography>
          {/* ইউজার অ্যাভাটার */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar src={user.photoURL} alt="profile" sx={{ bgcolor: "#1565c0" }}>
                {!user.photoURL && getUserInitial()}
              </Avatar>
              <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{user.displayName || "No Name"}</Typography>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* --- Sidebar Drawer --- */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: "#fff"
          },
        }}
        open
      >
        <Toolbar />
        <Box sx={{ p: 2, pt: 0 }}>
          {/* ইউজার ইনফো */}
          {user && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                bgcolor: "#f5f5f5",
                borderRadius: 2,
                p: 1,
                mb: 2,
                boxShadow: 1
              }}
            >
              <Avatar src={user.photoURL} alt="profile" sx={{ width: 36, height: 36, bgcolor: "#1976d2", fontWeight: "bold" }}>
                {!user.photoURL && getUserInitial()}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                  {user.displayName || "No Name"}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#444' }}>
                  {user.email}
                </Typography>
              </Box>
            </Box>
          )}

          {/* মাস নির্বাচন */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 14, mb: 0.5 }}>🌙 মাস নির্বাচন:</Typography>
            <Select
              value={currentMonth}
              onChange={e => setCurrentMonth(e.target.value)}
              fullWidth
              size="small"
              sx={{ background: "#f0f4ff", borderRadius: 1 }}
            >
              {generateAllMonths().map(m => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Navigation */}
          <List>
            {navItems.map(item => (
              <ListItemButton
                key={item.path}
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: location.pathname === item.path ? "#1976d2" : "#222",
                  bgcolor: location.pathname === item.path ? "#e3f0ff" : "transparent",
                  '&:hover': { bgcolor: "#e3f2fd" }
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? "#1976d2" : "#888" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>

          {/* নিচে স্পেস ফাঁকা রাখতে flex ব্যবহার */}
          <Box sx={{ flexGrow: 1 }} />
          <Divider sx={{ mt: 3 }} />

          {/* Logout */}
          <Button
            startIcon={<LogoutIcon />}
            variant="contained"
            color="error"
            onClick={signout}
            fullWidth
            sx={{ mt: 2, borderRadius: 1 }}
          >
            লগ আউট
          </Button>
        </Box>
      </Drawer>

      {/* --- Main Content --- */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
        <Toolbar />
        <MessNameBar />
        <Outlet />
      </Box>
    </Box>
  );
}
