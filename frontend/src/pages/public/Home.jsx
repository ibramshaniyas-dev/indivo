import { useEffect, useMemo, useState } from 'react';
import { Box, Container, Typography, Button, Skeleton, Paper } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import HomeDemoShelf from '../../components/homeDemo/HomeDemoShelf';
import CategoryStrip from '../../components/home/CategoryStrip';
import AdCarousel from '../../components/home/AdCarousel';
import OfferTile from '../../components/home/OfferTile';
import QuadCards from '../../components/home/QuadCards';
import AdBanner from '../../components/home/AdBanner';
import DealsOfTheDay from '../../components/home/DealsOfTheDay';
import ProductRail from '../../components/home/ProductRail';
import { AD_THEMES, offerStats, withPhotos, inr } from '../../components/home/adUtils';
import { listProducts } from '../../services/product.service';
import useWishlistToggle from '../../hooks/useWishlistToggle';
import useHomeDemo from '../../hooks/useHomeDemo';
import api from '../../services/api';
import { BRAND } from '../../brand';

const FEED_PAGE = 24;

const offerLine = (s) => (s.maxDiscount >= 5 ? `Up to ${s.maxDiscount}% OFF` : s.from ? `From ${inr(s.from)}` : null);

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [deals, setDeals] = useState([]);
  const [budget, setBudget] = useState([]);
  const [rated, setRated] = useState([]);
  const [fresh, setFresh] = useState([]);
  const [rails, setRails] = useState({}); // categoryId -> products
  const [feed, setFeed] = useState({ items: [], page: 0, total: 0 });
  const [feedLoading, setFeedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { wishlistIds, toggle } = useWishlistToggle();
  const homeDemo = useHomeDemo();
  const hasHomeDemo = homeDemo.productIds.size > 0;

  const loadFeed = (page) => {
    setFeedLoading(true);
    listProducts({ sort: 'rating', page, limit: FEED_PAGE })
      .then((r) => setFeed((f) => ({ items: page === 1 ? r.data : [...f.items, ...r.data], page, total: r.meta.total })))
      .finally(() => setFeedLoading(false));
  };

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get('/categories', { params: { parentId: 'null' } }),
      api.get('/cms/banners').catch(() => ({ data: { data: [] } })),
      listProducts({ sort: 'discount', limit: 20 }),
      listProducts({ sort: 'price_asc', maxPrice: 999, limit: 15 }),
      listProducts({ sort: 'rating', limit: 12 }),
      listProducts({ sort: 'newest', limit: 12 }),
    ])
      .then(async ([catRes, banRes, dealRes, budgetRes, ratedRes, freshRes]) => {
        if (!alive) return;
        const cats = catRes.data.data;
        setCategories(cats);
        setBanners(banRes.data.data || []);
        setDeals(dealRes.data);
        setBudget(budgetRes.data);
        setRated(ratedRes.data);
        setFresh(freshRes.data);
        setLoading(false);
        const lists = await Promise.all(cats.map((c) => listProducts({ category: c.id, sort: 'discount', limit: 15 }).catch(() => ({ data: [] }))));
        if (alive) setRails(Object.fromEntries(cats.map((c, k) => [c.id, lists[k].data])));
      })
      .catch(() => alive && setLoading(false));
    loadFeed(1);
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    const byCategory = Object.fromEntries(Object.entries(rails).map(([id, list]) => [id, offerStats(list)]));
    return { maxDiscount: offerStats(deals).maxDiscount, byCategory };
  }, [rails, deals]);

  // Full-colour ad slides, every number computed from live data.
  const slides = useMemo(() => {
    const out = [];
    const d = offerStats(deals);
    const headline = banners[0]?.title?.split(' — ')[0];
    if (deals.length) {
      out.push({ key: 'deals', eyebrow: 'Mega Sale', title: headline || `${BRAND.name} Big Savings`, big: d.maxDiscount >= 5 ? `UP TO ${d.maxDiscount}% OFF` : null, sub: `${deals.length}+ deals live today`, cta: 'Grab the deals', href: '/search?sort=discount', theme: AD_THEMES[0], photos: withPhotos(deals, 3) });
    }
    categories.forEach((c, k) => {
      const list = rails[c.id] || [];
      const s = offerStats(list);
      const photos = withPhotos(list, 3);
      if (!photos.length) return;
      out.push({ key: `c${c.id}`, eyebrow: 'Top picks', title: c.name, big: offerLine(s), sub: s.from ? `Starting at just ${inr(s.from)}` : null, cta: `Shop ${c.name.split(' ')[0]}`, href: `/search?category=${c.id}`, theme: AD_THEMES[(k + 1) % AD_THEMES.length], photos });
    });
    if (budget.length) {
      out.push({ key: 'budget', eyebrow: 'Budget store', title: 'Everything under', big: '₹999', sub: `Starting at ${inr(offerStats(budget).from)}`, cta: 'Shop budget buys', href: '/search?maxPrice=999&sort=discount', theme: AD_THEMES[3], photos: withPhotos(budget, 3) });
    }
    return out;
  }, [deals, budget, categories, rails, banners]);

  const quad = useMemo(() => [
    { title: 'Top deals for you', href: '/search?sort=discount', link: 'See all deals', products: withPhotos(deals.slice(4), 4) },
    { title: 'Under ₹999', href: '/search?maxPrice=999&sort=discount', link: 'Shop budget buys', products: withPhotos(budget, 4) },
    { title: 'Customer favourites', href: '/search?sort=rating', link: 'See top rated', products: withPhotos(rated, 4) },
    { title: 'New arrivals', href: '/search?sort=newest', link: 'See what\'s new', products: withPhotos(fresh, 4) },
  ], [deals, budget, rated, fresh]);

  const railProps = { wishlistIds, onToggleWishlist: toggle };
  const catTheme = (k) => AD_THEMES[(k + 2) % AD_THEMES.length];

  return (
    <Box sx={{ bgcolor: '#F3EEE4', pb: 3 }}>
      <CategoryStrip categories={categories} stats={stats} hasHomeDemo={hasHomeDemo} loading={loading} />

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 }, pt: { xs: 1, md: 2 } }}>
        {/* Hero: ad carousel + two offer tiles */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 300px', lg: '1fr 340px' }, gap: { xs: 1, md: 2 }, mb: { xs: 1, md: 2 } }}>
          <AdCarousel slides={slides} loading={loading} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr' }, gridTemplateRows: { md: '1fr 1fr' }, gap: { xs: 1, md: 2 } }}>
            {loading ? (
              <>
                <Skeleton variant="rounded" sx={{ height: { xs: 110, md: '100%' }, borderRadius: 3 }} />
                <Skeleton variant="rounded" sx={{ height: { xs: 110, md: '100%' }, borderRadius: 3 }} />
              </>
            ) : (
              <>
                <OfferTile title="Under ₹999 store" big={budget.length ? `From ${inr(offerStats(budget).from)}` : '₹999'} sub="Budget buys" href="/search?maxPrice=999&sort=discount" theme={AD_THEMES[4]} photos={withPhotos(budget, 2)} />
                <OfferTile title="Lowest prices ever" big={stats.maxDiscount >= 5 ? `${stats.maxDiscount}% OFF` : 'Deals'} sub="On top brands" href="/search?sort=discount" theme={AD_THEMES[5]} photos={withPhotos(deals.slice(3), 2)} />
              </>
            )}
          </Box>
        </Box>

        {/* Offer promises strip */}
        <Paper sx={{ mb: { xs: 1, md: 2 }, borderRadius: 2, px: { xs: 1, md: 2 }, py: { xs: 0.75, md: 1.25 }, display: 'flex', gap: { xs: 1.5, md: 3 }, overflowX: 'auto', justifyContent: { lg: 'space-around' }, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {[
            [LocalOfferRoundedIcon, stats.maxDiscount >= 5 ? `Up to ${stats.maxDiscount}% off` : 'Daily deals', '#C62828'],
            [LocalShippingOutlinedIcon, 'Free delivery above ₹999', '#2E7D32'],
            ...(hasHomeDemo ? [[BoltRoundedIcon, `Home demo in ${homeDemo.zone?.slaMinutes || 60} min`, '#A86A00']] : []),
            [VerifiedOutlinedIcon, 'Verified sellers', '#155E9C'],
            [LockOutlinedIcon, 'Secure payments', '#4B35A8'],
            [ReplayRoundedIcon, 'Easy returns', '#8A1457'],
          ].map(([Icon, label, color]) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexShrink: 0 }}>
              <Icon sx={{ fontSize: { xs: 16, md: 20 }, color }} />
              <Typography sx={{ fontSize: { xs: '0.7rem', md: '0.82rem' }, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</Typography>
            </Box>
          ))}
        </Paper>

        <DealsOfTheDay products={deals} loading={loading} {...railProps} />

        <QuadCards cards={quad} />

        <Box id="home-demo"><HomeDemoShelf wishlistIds={wishlistIds} onToggleWishlist={toggle} /></Box>

        <ProductRail title="Budget Buys under ₹999" subtitle="Big savings, small prices" viewAllHref="/search?maxPrice=999&sort=discount" products={budget} loading={loading} accent="#2E7D32" {...railProps} />

        {/* Category ad + rail, alternating */}
        {categories.map((c, k) => {
          const list = rails[c.id];
          const s = offerStats(list || []);
          return (
            <Box key={c.id}>
              {k % 2 === 0 && list && (
                <AdBanner eyebrow={`${c.name} fest`} title={c.name} big={offerLine(s)} sub={s.from ? `Starting ${inr(s.from)}` : null} href={`/search?category=${c.id}`} theme={catTheme(k)} photos={withPhotos(list, 8)} />
              )}
              <ProductRail
                title={`Best of ${c.name}`} subtitle={offerLine(s) || 'Handpicked for you'} viewAllHref={`/search?category=${c.id}`}
                products={list ? (k % 2 === 0 ? list.slice(8).concat(list.slice(0, 8)) : list) : []} loading={!list} {...railProps}
              />
            </Box>
          );
        })}

        <ProductRail title="New Arrivals" subtitle="Fresh in store" viewAllHref="/search?sort=newest" products={fresh} loading={loading} {...railProps} />

        {/* Recommended feed: dense grid so the page always feels full */}
        <Paper sx={{ p: { xs: 1, md: 2 }, borderRadius: 2, mb: { xs: 1.5, md: 2 } }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1rem', md: '1.15rem' }, mb: 1.5 }}>Recommended for you</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(5, 1fr)', lg: 'repeat(6, 1fr)' }, gap: { xs: '6px', md: '12px' } }}>
            {feed.items.map((p) => (
              <ProductCard key={p.id} product={p} dense wishlisted={wishlistIds.includes(p.id)} onToggleWishlist={() => toggle(p)} />
            ))}
            {feedLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={`s${i}`} variant="rounded" sx={{ aspectRatio: '1 / 1.55', height: 'auto' }} />)}
          </Box>
          {feed.items.length < feed.total && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button variant="outlined" disabled={feedLoading} onClick={() => loadFeed(feed.page + 1)}>Load more products</Button>
            </Box>
          )}
        </Paper>

        {/* Compact seller band */}
        <Box sx={{ borderRadius: 3, p: { xs: 2, md: 3 }, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', background: 'linear-gradient(120deg, #FBF3DE 0%, #F1DDA6 100%)', border: '1px solid rgba(154,114,40,0.25)' }}>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1rem', md: '1.3rem' } }}>Sell on {BRAND.name}</Typography>
            <Typography variant="body2" color="text.secondary">Reach customers across India with one seller dashboard.</Typography>
          </Box>
          <Button component={Link} to="/sell" variant="contained">Become a Seller</Button>
        </Box>
      </Container>
    </Box>
  );
}
