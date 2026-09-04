describe('GameVault core journey', () => {
  const gameCatalog = {
    3498: {
      rawg_id: 3498,
      name: 'Grand Theft Auto V',
      cover_image: 'https://example.com/gta-v.jpg',
      release_date: '2013-09-17',
      genres: ['Action'],
      platforms: ['PC'],
      developers: ['Rockstar North'],
      publishers: ['Rockstar Games'],
      rating: 4.5,
      description: 'Open world action game.'
    }
  };

  let state;

  const buildStats = (username) => {
    const userLibrary = state.library.filter((item) => item.username === username);
    const userWishlist = state.wishlist.filter((item) => item.username === username);
    const userReviews = state.reviews.filter((item) => item.username === username);

    const byStatus = { Backlog: 0, Playing: 0, Completed: 0, Dropped: 0 };
    let totalHours = 0;

    userLibrary.forEach((item) => {
      byStatus[item.status] += 1;
      totalHours += Number(item.hours_played || 0);
    });

    const ratingDistribution = {};
    userReviews.forEach((review) => {
      const key = String(review.rating);
      ratingDistribution[key] = (ratingDistribution[key] || 0) + 1;
    });

    return {
      total_games: userLibrary.length,
      currently_playing: byStatus.Playing,
      completed_games: byStatus.Completed,
      backlog_games: byStatus.Backlog,
      dropped_games: byStatus.Dropped,
      wishlist_count: userWishlist.length,
      review_count: userReviews.length,
      total_hours_played: totalHours,
      charts: {
        games_by_status: byStatus,
        library_vs_wishlist: {
          library: userLibrary.length,
          wishlist: userWishlist.length
        },
        rating_distribution: ratingDistribution
      }
    };
  };

  beforeEach(() => {
    state = {
      users: [],
      library: [],
      wishlist: [],
      reviews: [],
      nextId: 1
    };

    cy.intercept('POST', '**/api/auth/register', (req) => {
      const { username, password } = req.body;

      if (!username || !password) {
        req.reply(400, { error: 'Username and password are required' });
        return;
      }

      if (state.users.find((user) => user.username === username)) {
        req.reply(409, { error: 'Username already exists' });
        return;
      }

      state.users.push({
        username,
        password,
        created_at: new Date().toISOString()
      });

      req.reply(201, { message: 'User registered successfully' });
    });

    cy.intercept('POST', '**/api/auth/login', (req) => {
      const { username, password } = req.body;
      const user = state.users.find((entry) => entry.username === username);

      if (!user || user.password !== password) {
        req.reply(401, { error: 'Invalid username or password' });
        return;
      }

      req.reply(200, { message: 'Login successful', username });
    });

    cy.intercept('GET', '**/api/auth/profile*', (req) => {
      const username = req.headers['x-username'];
      const user = state.users.find((entry) => entry.username === username);

      if (!user) {
        req.reply(404, { error: 'User not found' });
        return;
      }

      req.reply(200, { username: user.username, created_at: user.created_at });
    });

    cy.intercept('GET', '**/api/dashboard/stats', (req) => {
      const username = req.headers['x-username'];
      if (!username) {
        req.reply(401, { error: 'Authentication required' });
        return;
      }
      req.reply(200, buildStats(username));
    });

    cy.intercept('GET', '**/api/games/search*', (req) => {
      const query = (req.query.query || '').toLowerCase();
      const items = Object.values(gameCatalog).filter((game) => game.name.toLowerCase().includes(query));
      req.reply(200, { items });
    });

    cy.intercept({ method: 'GET', url: /\/api\/games\/\d+(\?.*)?$/ }, (req) => {
      const rawgId = Number(req.url.split('/').pop()?.split('?')[0]);
      const game = gameCatalog[rawgId];

      if (!game) {
        req.reply(404, { error: 'Game not found' });
        return;
      }

      req.reply(200, game);
    });

    cy.intercept('GET', '**/api/library', (req) => {
      const username = req.headers['x-username'];
      const items = state.library.filter((item) => item.username === username);
      req.reply(200, { items });
    });

    cy.intercept('POST', '**/api/library', (req) => {
      const username = req.headers['x-username'];
      const payload = req.body;

      const duplicate = state.library.find(
        (item) => item.username === username && item.rawg_id === payload.rawg_id
      );

      if (duplicate) {
        req.reply(409, { error: 'Game already exists in your library' });
        return;
      }

      const item = {
        id: String(state.nextId++),
        username,
        rawg_id: payload.rawg_id,
        status: payload.status,
        hours_played: payload.hours_played,
        date_added: new Date().toISOString()
      };

      state.library.push(item);
      req.reply(201, item);
    });

    cy.intercept('PUT', '**/api/library/*', (req) => {
      const username = req.headers['x-username'];
      const itemId = req.url.split('/').pop();
      const item = state.library.find((entry) => entry.id === itemId && entry.username === username);

      if (!item) {
        req.reply(404, { error: 'Library item not found' });
        return;
      }

      item.status = req.body.status;
      item.hours_played = req.body.hours_played;
      req.reply(200, item);
    });

    cy.intercept('DELETE', '**/api/library/*', (req) => {
      const username = req.headers['x-username'];
      const itemId = req.url.split('/').pop();
      state.library = state.library.filter((entry) => !(entry.id === itemId && entry.username === username));
      req.reply(200, { message: 'Library item removed' });
    });

    cy.intercept('GET', '**/api/wishlist', (req) => {
      const username = req.headers['x-username'];
      const items = state.wishlist.filter((item) => item.username === username);
      req.reply(200, { items });
    });

    cy.intercept('POST', '**/api/wishlist', (req) => {
      const username = req.headers['x-username'];
      const payload = req.body;

      const duplicate = state.wishlist.find(
        (item) => item.username === username && item.rawg_id === payload.rawg_id
      );

      if (duplicate) {
        req.reply(409, { error: 'Game already exists in your wishlist' });
        return;
      }

      const item = {
        id: String(state.nextId++),
        username,
        rawg_id: payload.rawg_id,
        date_added: new Date().toISOString()
      };

      state.wishlist.push(item);
      req.reply(201, item);
    });

    cy.intercept('DELETE', '**/api/wishlist/*', (req) => {
      const username = req.headers['x-username'];
      const itemId = req.url.split('/').pop();
      state.wishlist = state.wishlist.filter((entry) => !(entry.id === itemId && entry.username === username));
      req.reply(200, { message: 'Wishlist item removed' });
    });

    cy.intercept('GET', '**/api/reviews', (req) => {
      const username = req.headers['x-username'];
      const items = state.reviews.filter((item) => item.username === username);
      req.reply(200, { items });
    });

    cy.intercept('POST', '**/api/reviews', (req) => {
      const username = req.headers['x-username'];
      const payload = req.body;

      const duplicate = state.reviews.find(
        (item) => item.username === username && item.rawg_id === payload.rawg_id
      );

      if (duplicate) {
        req.reply(409, { error: 'Review already exists for this game' });
        return;
      }

      const now = new Date().toISOString();
      const item = {
        id: String(state.nextId++),
        username,
        rawg_id: payload.rawg_id,
        rating: payload.rating,
        review_text: payload.review_text,
        date_created: now,
        date_updated: now
      };

      state.reviews.push(item);
      req.reply(201, item);
    });

    cy.intercept('PUT', '**/api/reviews/*', (req) => {
      const username = req.headers['x-username'];
      const reviewId = req.url.split('/').pop();
      const review = state.reviews.find((entry) => entry.id === reviewId && entry.username === username);

      if (!review) {
        req.reply(404, { error: 'Review not found' });
        return;
      }

      review.rating = req.body.rating;
      review.review_text = req.body.review_text;
      review.date_updated = new Date().toISOString();
      req.reply(200, review);
    });

    cy.intercept('DELETE', '**/api/reviews/*', (req) => {
      const username = req.headers['x-username'];
      const reviewId = req.url.split('/').pop();
      state.reviews = state.reviews.filter((entry) => !(entry.id === reviewId && entry.username === username));
      req.reply(200, { message: 'Review removed' });
    });
  });

  it('registers, logs in, performs CRUD journey, and enforces route protection', () => {
    cy.visit('/register');
    cy.get('[data-testid="register-username"]').type('cypressUser');
    cy.get('[data-testid="register-password"]').type('Password123!');
    cy.get('[data-testid="register-confirm-password"]').type('Password123!');
    cy.get('[data-testid="register-submit"]').click();
    cy.contains('User registered successfully').should('exist');

    cy.visit('/login');
    cy.get('[data-testid="login-username"]').type('cypressUser');
    cy.get('[data-testid="login-password"]').type('Password123!');
    cy.get('[data-testid="login-submit"]').click();
    cy.url().should('include', '/dashboard');

    cy.window().then((win) => {
      expect(win.localStorage.getItem('gamevault_username')).to.eq('cypressUser');
    });

    cy.get('[data-testid="nav-library"]').click();
    cy.get('[data-testid="game-search-input"]').type('Grand Theft');
    cy.get('[data-testid="game-search-submit"]').click();
    cy.contains('Add to Library').first().click();
    cy.contains('Already in Library').should('exist');

    cy.contains('Save').first().click();

    cy.get('[data-testid="nav-wishlist"]').click();
    cy.get('[data-testid="game-search-input"]').clear().type('Grand Theft');
    cy.get('[data-testid="game-search-submit"]').click();
    cy.contains('Add to Wishlist').first().click();
    cy.contains('Already in Wishlist').should('exist');

    cy.get('[data-testid="nav-reviews"]').click();
    cy.get('[data-testid="game-search-input"]').clear().type('Grand Theft');
    cy.get('[data-testid="game-search-submit"]').click();
    cy.contains('Add Review').first().click();
    cy.contains('Delete').first().should('exist');

    cy.get('[data-testid="nav-dashboard"]').click();
    cy.url().should('include', '/dashboard');

    cy.get('[data-testid="nav-logout"]').click();
    cy.url().should('include', '/login');

    cy.window().then((win) => {
      expect(win.localStorage.getItem('gamevault_username')).to.eq(null);
    });

    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');

    cy.visit('/wishlist');
    cy.url().should('include', '/login');
  });
});
