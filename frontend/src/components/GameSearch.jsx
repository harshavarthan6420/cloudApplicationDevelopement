import { useState } from 'react';
import { Button, Stack, TextField } from '@mui/material';

function GameSearch({ onSearch, loading }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(query.trim());
  };

  return (
    <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={1.5} onSubmit={handleSubmit}>
      <TextField
        label="Search RAWG Games"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        inputProps={{ 'data-testid': 'game-search-input' }}
        fullWidth
      />
      <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 120 }} data-testid="game-search-submit">
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </Stack>
  );
}

export default GameSearch;
