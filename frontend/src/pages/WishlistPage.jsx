import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Button, Container, Grid, Paper, Typography } from '@mui/material';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import GameCard from '../components/GameCard';
import GameSearch from '../components/GameSearch';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import { getGameDetails, searchGames } from '../services/gameService';
import { addWishlistItem, deleteWishlistItem, getWishlistItems } from '../services/wishlistService';

function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistGames, setWishlistGames] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchError, setSearchError] = useState('');

  const wishlistRawgIds = useMemo(
    () => new Set(wishlistItems.map((item) => item.rawg_id)),
    [wishlistItems]
  );

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

    setWishlistGames(
      details.reduce((accumulator, [rawgId, game]) => {
        accumulator[rawgId] = game;
        return accumulator;
      }, {})
    );
  };

  const loadWishlist = async () => {
    setLoadingWishlist(true);
    setErrorMessage('');

    try {
      const payload = await getWishlistItems();
      const items = payload.items || [];
      setWishlistItems(items);
      await hydrateGameDetails(items);
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to load wishlist right now.'));
    } finally {
      setLoadingWishlist(false);
    }
  };

  useEffect(() => {
    loadWishlist();
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
      await addWishlistItem({ rawg_id: rawgId });
      await loadWishlist();
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to add game to wishlist.'));
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Remove this game from your wishlist?')) {
      return;
    }

    setErrorMessage('');
    try {
      await deleteWishlistItem(itemId);
      await loadWishlist();
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to remove wishlist item.'));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Wishlist"
        subtitle="Keep track of games you want to play next."
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
                  disabled={wishlistRawgIds.has(game.rawg_id)}
                >
                  {wishlistRawgIds.has(game.rawg_id) ? 'Already in Wishlist' : 'Add to Wishlist'}
                </Button>
              </GameCard>
            </Grid>
          ))}
        </Grid>
      ) : null}

      <ErrorMessage message={errorMessage} />

      {loadingWishlist ? <LoadingState message="Loading wishlist..." /> : null}

      {!loadingWishlist && wishlistItems.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Search for games above and add titles to your wishlist."
        />
      ) : null}

      {!loadingWishlist && wishlistItems.length > 0 ? (
        <Grid container spacing={2}>
          {wishlistItems.map((item) => {
            const game = wishlistGames[item.rawg_id];
            return (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <GameCard
                  title={game?.name || `RAWG #${item.rawg_id}`}
                  subtitle={game?.release_date || 'Release date unavailable'}
                  image={game?.cover_image}
                >
                  <Button color="error" variant="outlined" onClick={() => handleDelete(item.id)}>
                    Remove
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Added on {item.date_added ? new Date(item.date_added).toLocaleString() : 'Unknown'}
                  </Typography>
                </GameCard>
              </Grid>
            );
          })}
        </Grid>
      ) : null}
    </Container>
  );
}

export default WishlistPage;
