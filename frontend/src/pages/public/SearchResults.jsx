import { useEffect, useMemo, useState } from 'react';
import {
  Box, Container, Grid, Typography, MenuItem, TextField, Drawer, Button, IconButton,
  Divider, Slider, Checkbox, FormControlLabel, Pagination,
} from '@mui/material';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';
import EmptyState from '../../components/EmptyState';
import { listProducts } from '../../services/product.service';
import useWishlistToggle from '../../hooks/useWishlistToggle';
import api from '../../services/api';

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Best Rated' },
];

function FilterPanel({ categories, brands, filters, onChange }) {
  return (
    <Box sx={{ width: { xs: 280, md: 'auto' }, p: { xs: 2, md: 0 } }}>
      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Category</Typography>
      {categories.map((c) => (
        <FormControlLabel
          key={c.id}
          control={<Checkbox size="small" checked={String(filters.category) === String(c.id)} onChange={() => onChange('category', String(filters.category) === String(c.id) ? '' : c.id)} />}
          label={c.name}
          sx={{ display: 'flex' }}
        />
      ))}

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Brand</Typography>
      {brands.map((b) => (
        <FormControlLabel
          key={b.id}
          control={<Checkbox size="small" checked={String(filters.brand) === String(b.id)} onChange={() => onChange('brand', String(filters.brand) === String(b.id) ? '' : b.id)} />}
          label={b.name}
          sx={{ display: 'flex' }}
        />
      ))}

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Price</Typography>
      <Slider
        value={[Number(filters.minPrice) || 0, Number(filters.maxPrice) || 10000]}
        onChange={(e, val) => { onChange('minPrice', val[0]); onChange('maxPrice', val[1]); }}
        min={0}
        max={10000}
        step={100}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => `₹${v}`}
      />
    </Box>
  );
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 24 });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const { wishlistIds, toggle } = useWishlistToggle();

  const filters = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/brands')]).then(([c, b]) => {
      setCategories(c.data.data);
      setBrands(b.data.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    listProducts(filters)
      .then((res) => {
        setProducts(res.data);
        setMeta(res.meta);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === undefined || value === null) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setSearchParams(next);
  };

  const filterPanelProps = { categories, brands, filters, onChange: updateFilter };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          {filters.q ? `Results for "${filters.q}"` : 'All Products'}
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {meta.total} items
          </Typography>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<TuneRoundedIcon />}
            onClick={() => setFilterOpen(true)}
            sx={{ display: { md: 'none' } }}
            variant="outlined"
            size="small"
          >
            Filters
          </Button>
          <TextField
            select size="small" value={filters.sort || ''} onChange={(e) => updateFilter('sort', e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item md={2.5} sx={{ display: { xs: 'none', md: 'block' } }}>
          <FilterPanel {...filterPanelProps} />
        </Grid>

        <Grid item xs={12} md={9.5}>
          {loading ? (
            <Grid container spacing={2}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={6} sm={4} lg={3} key={i}><ProductCardSkeleton /></Grid>
              ))}
            </Grid>
          ) : products.length === 0 ? (
            <EmptyState
              icon={SearchOffRoundedIcon}
              title="No products found"
              description="Try adjusting your filters or search for something else."
            />
          ) : (
            <>
              <Grid container spacing={2}>
                {products.map((p) => (
                  <Grid item xs={6} sm={4} lg={3} key={p.id}>
                    <ProductCard product={p} wishlisted={wishlistIds.includes(p.id)} onToggleWishlist={() => toggle(p)} />
                  </Grid>
                ))}
              </Grid>
              {meta.total > meta.limit && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={Math.ceil(meta.total / meta.limit)}
                    page={Number(filters.page) || 1}
                    onChange={(e, page) => updateFilter('page', page)}
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>

      <Drawer anchor="left" open={filterOpen} onClose={() => setFilterOpen(false)}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="subtitle1">Filters</Typography>
          <IconButton onClick={() => setFilterOpen(false)}>&times;</IconButton>
        </Box>
        <Divider />
        <FilterPanel {...filterPanelProps} />
      </Drawer>
    </Container>
  );
}
