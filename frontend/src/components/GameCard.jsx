import { Card, CardContent, CardMedia, Stack, Typography } from '@mui/material';

function GameCard({ title, subtitle, image, children }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {image ? <CardMedia component="img" sx={{ height: { xs: 210, sm: 230 }, objectFit: 'cover' }} image={image} alt={title} /> : null}
      <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2.25 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
          {children ? <Stack spacing={1.25} sx={{ mt: 'auto', pt: 2 }}>{children}</Stack> : null}
      </CardContent>
    </Card>
  );
}

export default GameCard;
