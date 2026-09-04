import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="home">
      <header>
        <h1 className="home-title">GameVault</h1>
        <p className="home-subtitle">
          A simple place to track your game collection, wishlist and reviews.
        </p>
      </header>

      <nav className="home-links" aria-label="Main sections">
        <Link className="home-link" to="/dashboard">
          Dashboard
          <span>Collection stats and charts</span>
        </Link>
        <Link className="home-link" to="/library">
          Library
          <span>Browse and manage your games</span>
        </Link>
        <Link className="home-link" to="/wishlist">
          Wishlist
          <span>Sign in to save games for later</span>
        </Link>
        <Link className="home-link" to="/reviews">
          Reviews
          <span>Ratings and written reviews</span>
        </Link>
        <Link className="home-link" to="/profile">
          Profile
          <span>Your account details</span>
        </Link>
      </nav>

      <p className="home-note">
        Sign in to manage your collection. Please{' '}
        <Link to="/login">log in</Link> or <Link to="/register">register</Link> to access
        your library, wishlist, reviews, and dashboard.
      </p>
    </div>
  );
}

export default HomePage;
