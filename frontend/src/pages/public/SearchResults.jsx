import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Container, Typography, Skeleton, Button, Paper, IconButton, Tooltip, CircularProgress } from '@mui/material';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import FilterSidebar from '../../components/search/FilterSidebar';
import MobileFilterSheet from '../../components/search/MobileFilterSheet';
import SortSheet from '../../components/search/SortSheet';
import {
  SORT_OPTIONS, EMPTY_FILTERS, fromParams, toParams, toQuery, activeCount, appliedChips,
} from '../../components/search/filterModel';
import { listProducts } from '../../services/product.service';
import useWishlistToggle from '../../hooks/useWishlistToggle';
import api from '../../services/api';

const PAGE = 24;
const DENSITY_KEY = 'seeshaa.searchDensity';
const readDensity = () => { try { return localStorage.getItem(DENSITY_KEY) === '3' ? 3 : 2; } catch { return 2; } };

function QuickChip({ selected, onClick, children, icon }) {
  return (
    <Box
      component="button" type="button" onClick={onClick} aria-pressed={selected}
      sx={{
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.75, borderRadius: 999, font: 'inherit', fontSize: '0.78rem',
        fontWeight: selected ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap', border: '1.5px solid',
        borderColor: selected ? 'primary.main' : 'rgba(122,85,23,0.22)', bgcolor: selected ? 'primary.main' : '#fff', color: selected ? '#fff' : 'text.primary',
        boxShadow: selected ? '0 4px 12px rgba(122,85,23,0.25)' : '0 1px 3px rgba(14,13,11,0.05)',
      }}
    >
      {icon}{children}
    </Box>
  );
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [res, setRes] = useState({ items: [], total: 0, page: 0, facets: null });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sheet, setSheet] = useState(null); // 'filter' | 'sort' | null
  const [sheetSection, setSheetSection] = useState('category');
  const [density, setDensity] = useState(readDensity);
  const { wishlistIds, toggle } = useWishlistToggle();
  const reqId = useRef(0);
  const sentinel = useRef(null);

  const key = searchParams.toString();
  const filters = useMemo(() => fromParams(searchParams), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || '';
  const query = useMemo(() => toQuery(filters, q, sort), [filters, q, sort]);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/brands')]).then(([c, b]) => {
      setCategories(c.data.data);
      setBrands(b.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    if (window.scrollY > 400) window.scrollTo({ top: 0, behavior: 'smooth' });
    listProducts({ ...query, page: 1, limit: PAGE, facets: 1 })
      .then((r) => { if (id === reqId.current) setRes({ items: r.data, total: r.meta.total, page: 1, facets: r.meta.facets }); })
      .catch(() => { if (id === reqId.current) setRes({ items: [], total: 0, page: 0, facets: null }); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasMore = res.items.length < res.total;
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const id = reqId.current;
    setLoadingMore(true);
    listProducts({ ...query, page: res.page + 1, limit: PAGE })
      .then((r) => { if (id === reqId.current) setRes((s) => ({ ...s, items: [...s.items, ...r.data.filter((p) => !s.items.some((x) => x.id === p.id))], page: s.page + 1 })); })
      .finally(() => setLoadingMore(false));
  }, [loading, loadingMore, hasMore, query, res.page]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return undefined;
    const io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: '700px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const applyFilters = (next) => setSearchParams(toParams(next, searchParams));
  const patch = (p) => applyFilters({ ...filters, ...p });
  const clearAll = () => applyFilters(EMPTY_FILTERS);
  const setSort = (v) => { const n = new URLSearchParams(searchParams); if (v) n.set('sort', v); else n.delete('sort'); setSearchParams(n); };
  const setDense = (d) => { setDensity(d); try { localStorage.setItem(DENSITY_KEY, String(d)); } catch { /* storage unavailable */ } };
  const openFilter = (section = 'category') => { setSheetSection(section); setSheet('filter'); };

  const chips = appliedChips(filters, { categories, brands });
  const nActive = activeCount(filters);
  const tops = categories.filter((c) => !c.parent_id);
  const singleCat = filters.category.length === 1 ? categories.find((c) => c.id === filters.category[0]) : null;
  const title = q ? `“${q}”` : singleCat ? singleCat.name : 'All Products';
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Relevance';
  const toggleCat = (id) => patch({ category: filters.category.includes(id) ? filters.category.filter((x) => x !== id) : [...filters.category, id] });

  const gridCols = { xs: `repeat(${density}, 1fr)`, sm: 'repeat(3, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)', xl: 'repeat(6, 1fr)' };

  return (
    <Box sx={{ bgcolor: '#F3EEE4', minHeight: '70vh' }}>
      {/* Title band */}
      <Box sx={{ background: 'linear-gradient(120deg, #FDF8EC 0%, #F5E6BF 100%)', borderBottom: '1px solid rgba(154,114,40,0.18)' }}>
        <Container maxWidth="xl" sx={{ py: { xs: 1.5, md: 2.25 }, px: { xs: 1.5, md: 3 } }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            <Box component={Link} to="/" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Home</Box>
            {' › '}{q ? 'Search' : singleCat ? singleCat.name : 'Shop'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.25, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', md: '1.7rem' }, lineHeight: 1.2 }}>{q ? <>Results for {title}</> : title}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', md: '0.92rem' } }}>
              {loading ? 'Searching…' : `${res.total.toLocaleString('en-IN')} product${res.total === 1 ? '' : 's'}`}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1.25, md: 2.5 } }}>
        {/* Mobile quick filters */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 0.75, overflowX: 'auto', pb: 1.25, mx: -1, px: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          <QuickChip selected={nActive > 0} onClick={() => openFilter()} icon={<TuneRoundedIcon sx={{ fontSize: 16 }} />}>Filters{nActive ? ` · ${nActive}` : ''}</QuickChip>
          <QuickChip selected={filters.minDiscount !== ''} onClick={() => patch({ minDiscount: filters.minDiscount === '' ? 30 : '' })} icon={<LocalOfferRoundedIcon sx={{ fontSize: 15 }} />}>30%+ off</QuickChip>
          <QuickChip selected={String(filters.maxPrice) === '999' && filters.minPrice === ''} onClick={() => patch(String(filters.maxPrice) === '999' && filters.minPrice === '' ? { minPrice: '', maxPrice: '' } : { minPrice: '', maxPrice: 999 })}>Under ₹999</QuickChip>
          {tops.map((c) => <QuickChip key={c.id} selected={filters.category.includes(c.id)} onClick={() => toggleCat(c.id)}>{c.name}</QuickChip>)}
          <QuickChip selected={filters.minRating !== ''} onClick={() => patch({ minRating: filters.minRating === '' ? 4 : '' })} icon={<StarRoundedIcon sx={{ fontSize: 15 }} />}>4★ & up</QuickChip>
          <QuickChip selected={filters.inStock} onClick={() => patch({ inStock: !filters.inStock })}>In stock</QuickChip>
          <QuickChip onClick={() => openFilter('brand')}>Brand ▾</QuickChip>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '270px 1fr' }, gap: { md: 2.5 }, alignItems: 'start' }}>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <FilterSidebar filters={filters} onChange={patch} onClearAll={clearAll} facets={res.facets} categories={categories} brands={brands} />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            {/* Desktop sort bar */}
            <Paper sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, px: 2, py: 0.75, mb: 1.5, borderRadius: 3, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', mr: 1 }}>Sort by</Typography>
              {SORT_OPTIONS.map((o) => {
                const on = sort === o.value;
                return (
                  <Box
                    key={o.value} component="button" type="button" onClick={() => setSort(o.value)} aria-pressed={on}
                    sx={{
                      border: 0, font: 'inherit', cursor: 'pointer', fontSize: '0.84rem', px: 1.5, py: 0.75, borderRadius: 999, fontWeight: on ? 800 : 500,
                      bgcolor: on ? 'primary.main' : 'transparent', color: on ? '#fff' : 'text.primary', transition: 'all 0.15s',
                      '&:hover': { bgcolor: on ? 'primary.main' : 'rgba(168,106,0,0.08)' },
                    }}
                  >
                    {o.label}
                  </Box>
                );
              })}
            </Paper>

            {/* Applied filters */}
            {chips.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: { xs: 'nowrap', md: 'wrap' }, overflowX: { xs: 'auto', md: 'visible' }, mb: 1.25, alignItems: 'center', scrollbarWidth: 'none' }}>
                {chips.map((c) => (
                  <Box key={c.key} sx={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 0.25, pl: 1.25, pr: 0.25, py: 0.15, borderRadius: 999, bgcolor: '#FFF8E6', border: '1px solid rgba(168,106,0,0.35)', fontSize: '0.78rem', fontWeight: 600 }}>
                    {c.label}
                    <IconButton size="small" aria-label={`Remove ${c.label}`} onClick={() => patch(c.patch)} sx={{ p: 0.4 }}><CloseRoundedIcon sx={{ fontSize: 14 }} /></IconButton>
                  </Box>
                ))}
                <Typography component="button" type="button" onClick={clearAll} sx={{ flexShrink: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer', color: '#C62828', fontWeight: 700, fontSize: '0.78rem', px: 1 }}>Clear all</Typography>
              </Box>
            )}

            {/* Mobile density toggle + sort label */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Sorted by <b>{sortLabel}</b></Typography>
              <Box>
                <Tooltip title="Bigger cards"><IconButton size="small" aria-label="Two per row" onClick={() => setDense(2)} sx={{ color: density === 2 ? 'primary.main' : 'text.disabled' }}><GridViewRoundedIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="More products"><IconButton size="small" aria-label="Three per row" onClick={() => setDense(3)} sx={{ color: density === 3 ? 'primary.main' : 'text.disabled' }}><AppsRoundedIcon fontSize="small" /></IconButton></Tooltip>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: gridCols, gap: { xs: '8px', md: '14px' } }}>
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} variant="rounded" sx={{ aspectRatio: '1 / 1.5', height: 'auto', borderRadius: 2 }} />)}
              </Box>
            ) : res.items.length === 0 ? (
              <Paper sx={{ textAlign: 'center', py: { xs: 6, md: 9 }, px: 3, borderRadius: 3 }}>
                <Box sx={{ width: 84, height: 84, borderRadius: '50%', mx: 'auto', mb: 2, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #FDF8EC, #F1DDA6)' }}>
                  <SearchOffRoundedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.2rem' }}>No products match</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2.5, maxWidth: 360, mx: 'auto' }}>
                  {nActive ? 'Try removing a filter or two to see more results.' : 'Try a different word, or browse today’s offers.'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {nActive > 0 && <Button variant="contained" onClick={clearAll}>Clear all filters</Button>}
                  <Button variant="outlined" component={Link} to="/search?sort=discount">See top offers</Button>
                </Box>
              </Paper>
            ) : (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: gridCols, gap: { xs: '8px', md: '14px' } }}>
                  {res.items.map((p) => (
                    <ProductCard key={p.id} product={p} dense wishlisted={wishlistIds.includes(p.id)} onToggleWishlist={() => toggle(p)} />
                  ))}
                  {loadingMore && Array.from({ length: density === 3 ? 6 : 4 }).map((_, i) => <Skeleton key={`m${i}`} variant="rounded" sx={{ aspectRatio: '1 / 1.5', height: 'auto', borderRadius: 2 }} />)}
                </Box>
                <Box ref={sentinel} sx={{ height: 1 }} />
                <Box sx={{ textAlign: 'center', py: 3, mb: { xs: 8, md: 0 } }}>
                  {hasMore ? (
                    loadingMore ? <CircularProgress size={22} /> : <Button variant="outlined" onClick={loadMore}>Load more</Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary">You’ve seen all {res.total.toLocaleString('en-IN')} products ✨</Typography>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Container>

      {/* Mobile floating Sort | Filter bar (sits above the bottom navigation) */}
      <Paper
        elevation={0}
        sx={{
          display: { xs: 'flex', md: 'none' }, position: 'fixed', zIndex: 11, left: '50%', transform: 'translateX(-50%)', bottom: 'calc(68px + env(safe-area-inset-bottom))',
          borderRadius: 999, overflow: 'hidden', bgcolor: 'primary.main', color: '#fff', boxShadow: '0 10px 28px rgba(122,85,23,0.45)',
        }}
      >
        {[
          ['sort', <SwapVertRoundedIcon key="i" sx={{ fontSize: 19 }} />, sort ? sortLabel.split(':')[0] : 'Sort'],
          ['filter', <TuneRoundedIcon key="i" sx={{ fontSize: 18 }} />, nActive ? `Filter · ${nActive}` : 'Filter'],
        ].map(([k, icon, label], i) => (
          <Box
            key={k} component="button" type="button" onClick={() => (k === 'sort' ? setSheet('sort') : openFilter())}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 2.5, py: 1.15, border: 0, bgcolor: 'transparent', color: 'inherit', font: 'inherit', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', borderLeft: i ? '1px solid rgba(255,255,255,0.3)' : 0 }}
          >
            {icon}{label}
          </Box>
        ))}
      </Paper>

      <SortSheet open={sheet === 'sort'} onClose={() => setSheet(null)} value={sort} onChange={setSort} />
      <MobileFilterSheet
        open={sheet === 'filter'} onClose={() => setSheet(null)} filters={filters} onApply={applyFilters}
        q={q} categories={categories} brands={brands} initialSection={sheetSection}
      />
    </Box>
  );
}
