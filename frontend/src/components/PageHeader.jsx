import { Box, Typography } from '@mui/material';

function PageHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.85rem', md: '2.15rem' } }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}

export default PageHeader;
