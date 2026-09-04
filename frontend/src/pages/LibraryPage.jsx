import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  Box,
  Button,
  Container,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import GameCard from '../components/GameCard';
import GameSearch from '../components/GameSearch';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import { getGameDetails, searchGames } from '../services/gameService';
import {
  addLibraryItem,
  deleteLibraryItem,
  getLibraryItems,
  updateLibraryItem
} from '../services/libraryService';

const STATUS_OPTIONS = ['Backlog', 'Playing', 'Completed', 'Dropped'];

function LibraryPage() {
  const [libraryItems, setLibraryItems] = useState([]);
  const [libraryGames, setLibraryGames] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchError, setSearchError] = useState('');
  const [editValues, setEditValues] = useState({});

  const libraryRawgIds = useMemo(() => new Set(libraryItems.map((item) => item.rawg_id)), [libraryItems]);

  const mapError = (error, fallback) => {
    if (error instanceof AxiosError && error.response?.data?.error) {
      return error.response.data.error;
    }
    return fallback;
  };

  const hydrateGameDetails = async (items) => {
    const uniqueIds = [...new Set(items.map((item) => item.rawg_id))];
    const details = await Promise.all(
      uniqueIds.map(async (rawgId) => {
        try {
          const game = await getGameDetails(rawgId);
          return [rawgId, game];
        } catch (_error) {
          return [rawgId, null];
        }
      })
    );

    const detailMap = details.reduce((accumulator, [rawgId, game]) => {
      accumulator[rawgId] = game;
      return accumulator;
    }, {});

    setLibraryGames(detailMap);
  };

  const loadLibrary = async () => {
    setLoadingLibrary(true);
    setErrorMessage('');

    try {
      const payload = await getLibraryItems();
      const items = payload.items || [];
      setLibraryItems(items);
      setEditValues(
        items.reduce((accumulator, item) => {
          accumulator[item.id] = {
            status: item.status,
            hours_played: item.hours_played
          };
          return accumulator;
        }, {})
      );
      await hydrateGameDetails(items);
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to load your library right now.'));
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const handleSearch = async (query) => {
    if (!query) {
      setSearchError('Please enter a game name to search.');
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setSearchError('');
    try {
      const payload = await searchGames(query);
      setSearchResults(payload.items || []);
      if (!payload.items?.length) {
        setSearchError('No games found for that search.');
      }
    } catch (error) {
      setSearchResults([]);
      setSearchError(mapError(error, 'Unable to search games right now.'));
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (rawgId) => {
    setErrorMessage('');
    try {
      await addLibraryItem({ rawg_id: rawgId, status: 'Backlog', hours_played: 0 });
      await loadLibrary();
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to add game to library.'));
    }
  };

  const handleSave = async (item) => {
    const values = editValues[item.id];
    setErrorMessage('');
    try {
      await updateLibraryItem(item.id, {
        status: values.status,
        hours_played: Number(values.hours_played)
      });
      await loadLibrary();
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to update library item.'));
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Remove this game from your library?')) {
      return;
    }

    setErrorMessage('');
    try {
      await deleteLibraryItem(item.id);
      await loadLibrary();
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to remove game from library.'));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Library"
        subtitle="Search RAWG games and track your personal play status and hours."
      />

      <Paper sx={{ p: 2.5, mb: 3 }}>
        <GameSearch onSearch={handleSearch} loading={searching} />
        {searchError ? (
          <Typography color="error" sx={{ mt: 1.5 }}>
            {searchError}
          </Typography>
        ) : null}
      </Paper>

      {searchResults.length > 0 ? (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {searchResults.map((game) => (
            <Grid item xs={12} sm={6} md={4} key={game.rawg_id}>
              <GameCard
                title={game.name || 'Unknown title'}
                subtitle={game.release_date || 'Release date unavailable'}
                image={game.cover_image}
              >
                <Button
                  variant="contained"
                  onClick={() => handleAdd(game.rawg_id)}
                  disabled={libraryRawgIds.has(game.rawg_id)}
                >
                  {libraryRawgIds.has(game.rawg_id) ? 'Already in Library' : 'Add to Library'}
                </Button>
              </GameCard>
            </Grid>
          ))}
        </Grid>
      ) : null}

      <ErrorMessage message={errorMessage} />

      {loadingLibrary ? <LoadingState message="Loading your library..." /> : null}

      {!loadingLibrary && libraryItems.length === 0 ? (
        <EmptyState
          title="Your library is empty"
          description="Search for games above and add your first title to begin tracking progress."
        />
      ) : null}

      {!loadingLibrary && libraryItems.length > 0 ? (
        <Grid container spacing={2}>
          {libraryItems.map((item) => {
            const game = libraryGames[item.rawg_id];
            return (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <GameCard
                  title={game?.name || `RAWG #${item.rawg_id}`}
                  subtitle={game?.release_date || 'Release date unavailable'}
                  image={game?.cover_image}
                >
                  <TextField
                    select
                    label="Status"
                    value={editValues[item.id]?.status || 'Backlog'}
                    onChange={(event) =>
                      setEditValues((previous) => ({
                        ...previous,
                        [item.id]: {
                          ...previous[item.id],
                          status: event.target.value
                        }
                      }))
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    type="number"
                    label="Hours Played"
                    inputProps={{ min: 0 }}
                    value={editValues[item.id]?.hours_played ?? 0}
                    onChange={(event) =>
                      setEditValues((previous) => ({
                        ...previous,
                        [item.id]: {
                          ...previous[item.id],
                          hours_played: event.target.value
                        }
                      }))
                    }
                  />

                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={() => handleSave(item)}>
                      Save
                    </Button>
                    <Button color="error" variant="outlined" onClick={() => handleDelete(item)}>
                      Remove
                    </Button>
                  </Stack>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Added on {item.date_added ? new Date(item.date_added).toLocaleString() : 'Unknown'}
                    </Typography>
                  </Box>
                </GameCard>
              </Grid>
            );
          })}
        </Grid>
      ) : null}
    </Container>
  );
}

export default LibraryPage;
