import { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, Menu,
} from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import * as adminUserService from '../../services/adminUser.service';
import * as roleService from '../../services/role.service';
import StatusBadge from '../../components/StatusBadge';

const initialForm = { name: '', mobile: '', email: '', password: '', roleId: '' };

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [menuTarget, setMenuTarget] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const load = async () => {
    const [a, r] = await Promise.all([adminUserService.listAdmins(), roleService.listRoles()]);
    setAdmins(a);
    setRoles(r);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await adminUserService.createAdmin(form);
      setDialogOpen(false);
      setForm(initialForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin user');
    }
  };

  const handleStatusChange = async (status) => {
    await adminUserService.updateAdmin(menuTarget.id, { status });
    setMenuAnchor(null);
    load();
  };

  const handleForceLogout = async () => {
    await adminUserService.forceLogoutAdmin(menuTarget.id);
    setMenuAnchor(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Admin Users</Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialogOpen(true)}>
          Add Admin User
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last Login</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {admins.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.name}</TableCell>
              <TableCell>{a.email}<br /><Typography variant="caption" color="text.secondary">{a.mobile}</Typography></TableCell>
              <TableCell><Chip size="small" label={a.roles || '—'} /></TableCell>
              <TableCell><StatusBadge status={a.status} /></TableCell>
              <TableCell>{a.last_login_at ? new Date(a.last_login_at).toLocaleString() : 'Never'}</TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuTarget(a); }}>
                  <MoreVertRoundedIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => handleStatusChange('ACTIVE')}>Activate</MenuItem>
        <MenuItem onClick={() => handleStatusChange('INACTIVE')}>Deactivate</MenuItem>
        <MenuItem onClick={() => handleStatusChange('SUSPENDED')}>Suspend</MenuItem>
        <MenuItem onClick={() => handleStatusChange('BLOCKED')}>Block</MenuItem>
        <MenuItem onClick={handleForceLogout}>Force Logout</MenuItem>
      </Menu>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Admin User</DialogTitle>
        <Box component="form" onSubmit={handleCreate}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="Mobile Number" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <TextField label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <TextField select label="Role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} required>
              {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
