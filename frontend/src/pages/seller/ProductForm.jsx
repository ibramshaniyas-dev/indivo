import { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, TextField, MenuItem, Button, Paper, Alert, Chip, IconButton,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import ProductImage from '../../components/ProductImage';
import { realImage } from '../../utils/images';

// Mirrors the backend upload rules (upload.middleware.js IMAGE_MIMES, MAX_UPLOAD_SIZE_MB=5).
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_MB = 5;
const MIN_CLEAR_PX = 800;
const RECOMMENDED_PX = 1200;

function readImageSize(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(objectUrl); };
    img.onerror = () => { resolve(null); URL.revokeObjectURL(objectUrl); };
    img.src = objectUrl;
  });
}
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
  const [imageWarnings, setImageWarnings] = useState([]);

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
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;
    setError('');
    setImageWarnings([]);

    // Reject what the server would reject anyway, with a clear message instead of a failed request.
    const rejected = [];
    const valid = picked.filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) { rejected.push(`${f.name}: only JPG, PNG or WebP images are allowed`); return false; }
      if (f.size > MAX_UPLOAD_MB * 1024 * 1024) { rejected.push(`${f.name}: larger than ${MAX_UPLOAD_MB} MB`); return false; }
      return true;
    });
    if (rejected.length) setError(rejected.join(' · '));
    if (!valid.length) return;

    // Low-resolution photos are what look blurry on the product page — upload, but warn.
    const sizes = await Promise.all(valid.map(readImageSize));
    const lowRes = [];
    valid.forEach((f, i) => {
      const s = sizes[i];
      if (s && Math.min(s.width, s.height) < MIN_CLEAR_PX) {
        lowRes.push(`${f.name} is small (${s.width}×${s.height}px) and may look blurry — ${RECOMMENDED_PX}px or larger is recommended.`);
      }
    });
    setImageWarnings(lowRes);

    setUploading(true);
    try {
      await sellerProductService.uploadImages(id, valid);
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
          <Typography variant="subtitle1" sx={{ mb: 0.5 }}>Product Images</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload clear photos of the actual product — JPG, PNG or WebP, up to {MAX_UPLOAD_MB} MB each, ideally at least {RECOMMENDED_PX}×{RECOMMENDED_PX} px on a plain background. The first photo is the main image.
          </Typography>
          <Button variant="outlined" component="label" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload Images'}
            <input type="file" hidden multiple accept={ACCEPTED_TYPES.join(',')} onChange={handleImageUpload} />
          </Button>
          {imageWarnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }} onClose={() => setImageWarnings([])}>
              {imageWarnings.map((w) => <div key={w}>{w}</div>)}
            </Alert>
          )}
          {product?.images?.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 1.5, mt: 2 }}>
              {product.images.map((img, i) => {
                const isReal = Boolean(realImage(img.url));
                return (
                  <Box key={img.id} sx={{ position: 'relative', border: '1px solid', borderColor: isReal ? 'divider' : 'warning.main', borderRadius: 2, overflow: 'hidden' }}>
                    <ProductImage src={img.url} alt={product.name} placeholderLabel={false} />
                    {i === 0 && isReal && <Chip label="Main" size="small" color="secondary" sx={{ position: 'absolute', top: 6, left: 6, height: 20, fontSize: '0.65rem' }} />}
                    {!isReal && (
                      <Typography variant="caption" sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: 0.75, bgcolor: 'warning.light', color: 'warning.main', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
                        Demo picture — hidden from customers
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
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
