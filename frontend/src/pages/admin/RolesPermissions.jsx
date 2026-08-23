import { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, Alert, Tooltip,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import * as roleService from '../../services/role.service';

const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

export default function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState('');

  const load = async () => {
    const [r, p] = await Promise.all([roleService.listRoles(), roleService.listPermissionsCatalog()]);
    setRoles(r);
    setCatalog(p);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setSelected(new Set());
    setError('');
    setDialogOpen(true);
  };

  const openEdit = async (role) => {
    const detail = await roleService.getRole(role.id);
    setEditing(detail);
    setName(detail.name);
    setDescription(detail.description || '');
    setSelected(new Set(detail.permissionCodes));
    setError('');
    setDialogOpen(true);
  };

  const toggle = (code) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { name, description, permissionCodes: Array.from(selected) };
      if (editing) await roleService.updateRole(editing.id, payload);
      else await roleService.createRole(payload);
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save role');
    }
  };

  const handleClone = async (id) => { await roleService.cloneRole(id); load(); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this role?')) return;
    try {
      await roleService.deleteRole(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Roles &amp; Permissions</Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>Create Role</Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Role</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Permissions</TableCell>
            <TableCell>Admins</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {roles.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                {r.name} {r.is_system ? <Chip size="small" label="System" sx={{ ml: 1 }} /> : null}
              </TableCell>
              <TableCell>{r.description || '—'}</TableCell>
              <TableCell>{r.permission_count}</TableCell>
              <TableCell>{r.user_count}</TableCell>
              <TableCell align="right">
                <Tooltip title="Edit">
                  <span>
                    <IconButton size="small" onClick={() => openEdit(r)} disabled={r.is_system}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Clone">
                  <IconButton size="small" onClick={() => handleClone(r.id)}>
                    <ContentCopyRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <span>
                    <IconButton size="small" onClick={() => handleDelete(r.id)} disabled={r.is_system || r.user_count > 0}>
                      <DeleteRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? `Edit Role — ${editing.name}` : 'Create Role'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField label="Role Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
              <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth />
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    {ACTIONS.map((a) => <TableCell key={a} align="center" sx={{ textTransform: 'capitalize' }}>{a}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(catalog).map(([module, perms]) => (
                    <TableRow key={module}>
                      <TableCell sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{module.replace(/_/g, ' ')}</TableCell>
                      {ACTIONS.map((action) => {
                        const perm = perms.find((p) => p.action === action);
                        if (!perm) return <TableCell key={action} />;
                        return (
                          <TableCell key={action} align="center">
                            <Checkbox size="small" checked={selected.has(perm.code)} onChange={() => toggle(perm.code)} />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Role</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
