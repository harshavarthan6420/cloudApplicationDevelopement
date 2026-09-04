import { Paper, Typography } from '@mui/material';

function EmptyState({ title, description }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, borderStyle: 'dashed' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      ) : null}
    </Paper>
  );
}

export default EmptyState;
