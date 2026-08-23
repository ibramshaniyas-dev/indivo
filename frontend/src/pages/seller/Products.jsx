import { useEffect, useState } from 'react';
import { Box, Typography, Button, MenuItem, TextField, IconButton, Avatar } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { Link, useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import * as sellerProductService from '../../services/sellerProduct.service';

const STATUS_FILTERS = ['', 'DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'INACTIVE', 'OUT_OF_STOCK', 'BLOCKED'];

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await sellerProductService.listMyProducts(status ? { status } : {});
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar variant="rounded" src={p.image} sx={{ width: 40, height: 40, bgcolor: 'grey.100' }}>
            <Inventory2RoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </Avatar>
          <Box>
            {p.name}
            <Typography variant="caption" color="text.secondary" display="block">{p.sku}</Typography>
          </Box>
        </Box>
      ),
    },
    { key: 'selling_price', label: 'Price', render: (p) => `₹${Number(p.selling_price).toLocaleString('en-IN')}` },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'created_at', label: 'Created', render: (p) => new Date(p.created_at).toLocaleDateString() },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Products</Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} component={Link} to="/seller/products/new">
          Add Product
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={products}
        loading={loading}
        filters={
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
            {STATUS_FILTERS.map((s) => <MenuItem key={s || 'ALL'} value={s}>{s || 'ALL'}</MenuItem>)}
          </TextField>
        }
        emptyState={
          <EmptyState
            icon={Inventory2RoundedIcon}
            title="No products yet"
            description="Add your first product to start selling on INDIVO."
            actionLabel="Add Product"
            onAction={() => navigate('/seller/products/new')}
          />
        }
        rowActions={(p) => (
          <IconButton size="small" component={Link} to={`/seller/products/${p.id}/edit`}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
        )}
      />
    </Box>
  );
}
