import { useEffect, useState } from 'react';
import { Box, Container, Typography, CircularProgress } from '@mui/material';
import { useParams } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import api from '../../services/api';

export default function CmsPage({ slug: slugProp }) {
  const params = useParams();
  const slug = slugProp || params.slug;
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/cms/pages/${slug}`)
      .then((res) => setPage(res.data.data))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  if (!page) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <EmptyState icon={ArticleRoundedIcon} title="Page not found" description="This page hasn't been published yet." />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h4" gutterBottom>{page.title}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
        {page.content}
      </Typography>
    </Container>
  );
}
