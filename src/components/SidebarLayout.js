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

  useEffect(() => {
    if (!currentMonth) {
      const now = new Date();
      const def = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      setCurrentMonth(def);
    }
  }, [currentMonth, setCurrentMonth]);

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

  const getUserInitial = () =>
    (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <Box sx={{
      display: 'flex',
      bgcolor: "linear-gradient(120deg, #f7fcfa 0%, #e2f7f2 70%, #e3f2fd 100%)",
      minHeight: "100vh"
    }}>
      {/* --- AppBar --- */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme => theme.zIndex.drawer + 1,
          bgcolor: "#3bb59a",
          borderBottom: "3px solid #30a88b",
          minHeight: 64,
          boxShadow: "0 2px 9px #0001"
        }}
        elevation={4}
      >
        <Toolbar sx={{ minHeight: 60 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 1 }}>
            মেস ম্যানেজার
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar src={user.photoURL} alt="profile" sx={{ bgcolor: "#27a17a" }}>
                {!user.photoURL && getUserInitial()}
              </Avatar>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{user.displayName || "No Name"}</Typography>
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
            bgcolor: "#fff",
            borderRight: "2px solid #30a88b",
            boxShadow: "3px 0 10px #0001",
            position: 'relative'
          },
        }}
        open
      >
        <Toolbar />
        <Box
          sx={{
            p: 2,
            pt: 0,
            minHeight: "100vh",
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            position: 'relative'
          }}
        >
          {/* ইউজার কার্ড */}
          {user && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                bgcolor: "#e2f7f2",
                borderRadius: 2,
                p: 1,
                mb: 1.5,
                boxShadow: 1
              }}
            >
              <Avatar src={user.photoURL} alt="profile" sx={{ width: 36, height: 36, bgcolor: "#3bb59a", fontWeight: "bold" }}>
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
            <Typography sx={{ fontSize: 14, mb: 0.5, fontWeight: 500, color: "#333" }}>🌙 মাস নির্বাচন:</Typography>
            <Select
              value={currentMonth}
              onChange={e => setCurrentMonth(e.target.value)}
              fullWidth
              size="small"
              sx={{ background: "#f5fcfa", borderRadius: 1, fontWeight: 600 }}
            >
              {generateAllMonths().map(m => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </Box>

          <Divider sx={{ my: 2, borderColor: "#cbeee6" }} />

          {/* Navigation */}
          <List sx={{ mb: 1 }}>
            {navItems.map(item => (
              <ListItemButton
                key={item.path}
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  fontWeight: 600,
                  color: location.pathname === item.path ? "#3bb59a" : "#1a1a1a",
                  bgcolor: location.pathname === item.path ? "#b2dfdb" : "transparent",
                  '&:hover': { bgcolor: "#e2f7f2" }
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? "#3bb59a" : "#7a9580" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>

          {/* Logout, created by, copyright */}
          <Box
            sx={{
              mt: 1.2,
              mb: 0.2,
              px: 0,
              textAlign: "center",
              border: "1px solid #e2f7f2",
              borderRadius: 2,
              boxShadow: "0 2px 7px #0000",
              bgcolor: "#f8fafb",
            }}
          >
            <Button
              startIcon={<LogoutIcon />}
              variant="contained"
              color="error"
              onClick={signout}
              fullWidth
              size="small"
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                fontSize: 15,
                py: 0.6,
                mb: 0.7,
                minHeight: 0,
                minWidth: 0
              }}
            >
              লগ আউট
            </Button>
            <Typography sx={{ color: "#63c9a7", fontSize: 13, mt: 0.3 }}>
              Created by <span style={{ color: "#3bb59a", fontWeight: 600 }}>Tanjil</span>
            </Typography>
            <Typography sx={{ color: "#bdbdbd", fontSize: 12, mt: 0.1 }}>
              © {new Date().getFullYear()} Mess Manager
            </Typography>
          </Box>
        </Box>
      </Drawer>

      {/* --- Main Content --- */}
      <Box component="main" sx={{
        flexGrow: 1,
        minHeight: "100vh",
        p: { xs: 1.5, sm: 2.5, md: 3 },
        background: "linear-gradient(120deg, #f8fafc 0%, #e2f7f2 100%)"
      }}>
        <Toolbar />
        <MessNameBar />
        <Outlet />
      </Box>
    </Box>
  );
}
