import { CircularProgress, Stack, Typography } from '@mui/material';

function LoadingState({ message = 'Loading...' }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
        <CircularProgress size={20} color="secondary" />
      <Typography>{message}</Typography>
    </Stack>
  );
}

export default LoadingState;
