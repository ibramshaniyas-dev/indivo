import { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, TextField, MenuItem, Button, Paper, Alert, Chip, IconButton,
  ImageList, ImageListItem,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';
import * as sellerProductService from '../../services/sellerProduct.service';

const initialForm = {
  name: '', categoryId: '', brandId: '', sku: '', mrp: '', sellingPrice: '', taxRate: '0',
  stock: '0', description: '', shortDescription: '',
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/brands')]).then(([c, b]) => {
      setCategories(c.data.data);
      setBrands(b.data.data);
    });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    sellerProductService.getMyProduct(id).then((data) => {
      setProduct(data);
      setForm({
        name: data.name,
        categoryId: data.category_id,
        brandId: data.brand_id || '',
        sku: data.sku,
        mrp: data.mrp,
        sellingPrice: data.selling_price,
        taxRate: data.tax_rate,
        stock: '0',
        description: data.description || '',
        shortDescription: data.short_description || '',
      });
    });
  }, [id]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        brandId: form.brandId || null,
        sku: form.sku,
        mrp: Number(form.mrp),
        sellingPrice: Number(form.sellingPrice),
        taxRate: Number(form.taxRate) || 0,
        description: form.description,
        shortDescription: form.shortDescription,
      };
      if (isEdit) {
        await sellerProductService.updateProduct(id, payload);
        setSuccessMsg('Product updated');
      } else {
        const created = await sellerProductService.createProduct({ ...payload, stock: Number(form.stock) || 0 });
        navigate(`/seller/products/${created.id}/edit`);
        return;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    if (!e.target.files.length) return;
    setUploading(true);
    setError('');
    try {
      await sellerProductService.uploadImages(id, e.target.files);
      const refreshed = await sellerProductService.getMyProduct(id);
      setProduct(refreshed);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitForReview = async () => {
    setError('');
    try {
      await sellerProductService.submitForReview(id);
      const refreshed = await sellerProductService.getMyProduct(id);
      setProduct(refreshed);
      setSuccessMsg('Submitted for admin review');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h5">{isEdit ? 'Edit Product' : 'Add Product'}</Typography>
        {product && <StatusBadge status={product.status} />}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {product?.status === 'REJECTED' && (
        <Alert severity="warning" sx={{ mb: 2 }}>This product was rejected. Update it and resubmit for review.</Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Product Name" value={form.name} onChange={handleChange('name')} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="SKU" value={form.sku} onChange={handleChange('sku')} required disabled={isEdit} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Category" value={form.categoryId} onChange={handleChange('categoryId')} required>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Brand (optional)" value={form.brandId} onChange={handleChange('brandId')}>
                <MenuItem value="">None</MenuItem>
                {brands.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="MRP (₹)" value={form.mrp} onChange={handleChange('mrp')} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Selling Price (₹)" value={form.sellingPrice} onChange={handleChange('sellingPrice')} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Tax Rate (%)" value={form.taxRate} onChange={handleChange('taxRate')} />
            </Grid>
            {!isEdit && (
              <Grid item xs={12} sm={4}>
                <TextField fullWidth type="number" label="Opening Stock" value={form.stock} onChange={handleChange('stock')} />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField fullWidth label="Short Description" value={form.shortDescription} onChange={handleChange('shortDescription')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={3} label="Description" value={form.description} onChange={handleChange('description')} />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Draft'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {isEdit && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Product Images</Typography>
          <Button variant="outlined" component="label" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload Images'}
            <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
          </Button>
          {product?.images?.length > 0 && (
            <ImageList cols={4} rowHeight={100} sx={{ mt: 2 }}>
              {product.images.map((img) => (
                <ImageListItem key={img.id} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                  <img src={img.url} alt="" style={{ objectFit: 'cover', height: '100%' }} />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </Paper>
      )}

      {isEdit && ['DRAFT', 'REJECTED'].includes(product?.status) && (
        <Button variant="contained" color="secondary" onClick={handleSubmitForReview}>
          Submit for Admin Review
        </Button>
      )}
    </Box>
  );
}
