import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import EmptyState from '../../components/EmptyState';

export default function ComingSoon({ title = 'This module' }) {
  return (
    <EmptyState
      icon={ConstructionRoundedIcon}
      title={`${title} — coming soon`}
      description="This module is on the build roadmap and isn't wired up yet."
    />
  );
}
