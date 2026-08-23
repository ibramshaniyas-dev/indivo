import { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Tooltip, Chip } from '@mui/material';
import ThreeSixtyRoundedIcon from '@mui/icons-material/ThreeSixtyRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';

const MAX_ANGLE = 35;

/**
 * Interactive tilt/rotate viewer for the primary product image — drag or swipe to spin it in
 * 3D space (CSS perspective + rotateY), with an auto-rotate sweep. This is a single photo given
 * a real 3D interaction, not a claim of multi-angle product photography or a generated 3D model —
 * genuine multi-angle capture is future work once sellers can upload angle sequences.
 */
export default function Product360Viewer({ image }) {
  const [rotation, setRotation] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const dragRef = useRef({ dragging: false, startX: 0, startRotation: 0 });
  const frameRef = useRef(null);
  const directionRef = useRef(1);

  useEffect(() => {
    if (!autoRotate) {
      cancelAnimationFrame(frameRef.current);
      return undefined;
    }
    const step = () => {
      setRotation((prev) => {
        let next = prev + directionRef.current * 0.4;
        if (next >= MAX_ANGLE) directionRef.current = -1;
        if (next <= -MAX_ANGLE) directionRef.current = 1;
        return next;
      });
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [autoRotate]);

  const stopAutoRotate = () => setAutoRotate(false);

  const handlePointerDown = (e) => {
    stopAutoRotate();
    dragRef.current = { dragging: true, startX: e.clientX, startRotation: rotation };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const delta = e.clientX - dragRef.current.startX;
    const next = dragRef.current.startRotation + delta / 4;
    setRotation(Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, next)));
  };
  const handlePointerUp = () => { dragRef.current.dragging = false; };

  return (
    <Box sx={{ position: 'relative' }}>
      <Chip
        icon={<ThreeSixtyRoundedIcon />}
        label="Drag to rotate"
        size="small"
        sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1, bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 600 }}
      />
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, display: 'flex', gap: 0.5 }}>
        <Tooltip title={autoRotate ? 'Pause rotation' : 'Auto rotate'}>
          <IconButton size="small" onClick={() => setAutoRotate((v) => !v)} sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
            {autoRotate ? <PauseRoundedIcon fontSize="small" /> : <PlayArrowRoundedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset">
          <IconButton size="small" onClick={() => { stopAutoRotate(); setRotation(0); }} sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
            <RestartAltRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        sx={{
          aspectRatio: '1 / 1', borderRadius: 3, overflow: 'hidden', bgcolor: 'grey.100',
          perspective: 900, cursor: 'grab', touchAction: 'none', '&:active': { cursor: 'grabbing' },
        }}
      >
        <Box
          sx={{
            width: '100%', height: '100%', transformStyle: 'preserve-3d',
            transform: `rotateY(${rotation}deg)`,
            transition: dragRef.current.dragging ? 'none' : 'transform 0.15s ease-out',
            backgroundImage: image ? `url(${image})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            boxShadow: `${rotation / 2}px 0 24px rgba(22,21,19,0.15)`,
          }}
        />
      </Box>
    </Box>
  );
}
