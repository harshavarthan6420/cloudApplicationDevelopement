import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import {
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
import { createReview, deleteReview, getReviews, updateReview } from '../services/reviewService';

const RATING_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);

function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [reviewGames, setReviewGames] = useState({});
  const [reviewEdits, setReviewEdits] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [newReviewValues, setNewReviewValues] = useState({});
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchError, setSearchError] = useState('');

  const mapError = (error, fallback) => {
    if (error instanceof AxiosError && error.response?.data?.error) {
      return error.response.data.error;
    }
    return fallback;
  };

  const hydrateReviewGames = async (items) => {
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

    setReviewGames(
      details.reduce((accumulator, [rawgId, game]) => {
        accumulator[rawgId] = game;
        return accumulator;
      }, {})
    );
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    setErrorMessage('');

    try {
      const payload = await getReviews();
      const items = payload.items || [];
      setReviews(items);
      setReviewEdits(
        items.reduce((accumulator, item) => {
          accumulator[item.id] = {
            rating: item.rating,
            review_text: item.review_text || ''
          };
          return accumulator;
        }, {})
      );
      await hydrateReviewGames(items);
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to load reviews right now.'));
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
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
      const items = payload.items || [];
      setSearchResults(items);
      if (!items.length) {
        setSearchError('No games found for that search.');
      }
    } catch (error) {
      setSearchResults([]);
      setSearchError(mapError(error, 'Unable to search games right now.'));
    } finally {
      setSearching(false);
    }
  };

  const handleCreateReview = async (rawgId) => {
    const draft = newReviewValues[rawgId] || { rating: 8, review_text: '' };
    try {
      await createReview({
        rawg_id: rawgId,
        rating: Number(draft.rating),
        review_text: draft.review_text
      });
      await loadReviews();
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to create review.'));
    }
  };

  const handleUpdateReview = async (review) => {
    const draft = reviewEdits[review.id];
    try {
      await updateReview(review.id, {
        rating: Number(draft.rating),
        review_text: draft.review_text
      });
      await loadReviews();
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to update review.'));
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) {
      return;
    }

    try {
      await deleteReview(reviewId);
      await loadReviews();
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to delete review.'));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Reviews"
        subtitle="Search games and add a personal rating and review."
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
          {searchResults.map((game) => {
            const draft = newReviewValues[game.rawg_id] || { rating: 8, review_text: '' };
            return (
              <Grid item xs={12} sm={6} md={4} key={game.rawg_id}>
                <GameCard
                  title={game.name || 'Unknown title'}
                  subtitle={game.release_date || 'Release date unavailable'}
                  image={game.cover_image}
                >
                  <TextField
                    select
                    label="Rating"
                    value={draft.rating}
                    onChange={(event) =>
                      setNewReviewValues((previous) => ({
                        ...previous,
                        [game.rawg_id]: {
                          ...draft,
                          rating: event.target.value
                        }
                      }))
                    }
                  >
                    {RATING_OPTIONS.map((rating) => (
                      <MenuItem key={rating} value={rating}>
                        {rating}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    multiline
                    minRows={2}
                    label="Review"
                    value={draft.review_text}
                    onChange={(event) =>
                      setNewReviewValues((previous) => ({
                        ...previous,
                        [game.rawg_id]: {
                          ...draft,
                          review_text: event.target.value
                        }
                      }))
                    }
                  />
                  <Button variant="contained" onClick={() => handleCreateReview(game.rawg_id)}>
                    Add Review
                  </Button>
                </GameCard>
              </Grid>
            );
          })}
        </Grid>
      ) : null}

      <ErrorMessage message={errorMessage} />

      {loadingReviews ? <LoadingState message="Loading your reviews..." /> : null}

      {!loadingReviews && reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Search for a game and add your first review."
        />
      ) : null}

      {!loadingReviews && reviews.length > 0 ? (
        <Grid container spacing={2}>
          {reviews.map((review) => {
            const game = reviewGames[review.rawg_id];
            const draft = reviewEdits[review.id] || { rating: review.rating, review_text: review.review_text || '' };

            return (
              <Grid item xs={12} sm={6} md={4} key={review.id}>
                <GameCard
                  title={game?.name || `RAWG #${review.rawg_id}`}
                  subtitle={game?.release_date || 'Release date unavailable'}
                  image={game?.cover_image}
                >
                  <TextField
                    select
                    label="Rating"
                    value={draft.rating}
                    onChange={(event) =>
                      setReviewEdits((previous) => ({
                        ...previous,
                        [review.id]: {
                          ...draft,
                          rating: event.target.value
                        }
                      }))
                    }
                  >
                    {RATING_OPTIONS.map((rating) => (
                      <MenuItem key={rating} value={rating}>
                        {rating}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Review"
                    multiline
                    minRows={3}
                    value={draft.review_text}
                    onChange={(event) =>
                      setReviewEdits((previous) => ({
                        ...previous,
                        [review.id]: {
                          ...draft,
                          review_text: event.target.value
                        }
                      }))
                    }
                  />

                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={() => handleUpdateReview(review)}>
                      Save
                    </Button>
                    <Button color="error" variant="outlined" onClick={() => handleDeleteReview(review.id)}>
                      Delete
                    </Button>
                  </Stack>
                </GameCard>
              </Grid>
            );
          })}
        </Grid>
      ) : null}
    </Container>
  );
}

export default ReviewsPage;
