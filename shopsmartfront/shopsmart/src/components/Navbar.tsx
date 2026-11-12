import "./Navbar.css";

const CATEGORIES = [
  "Electronics",
  "Lifestyle",
  "Beauty",
  "Home & Kitchen",
  "Grocery",
  "Sports & Fitness",
  "Books & Stationery",
  "Toys & Baby",
];

// A link like #category-Electronics opens that category in ProductList
const categoryLink = (name: string) => `#category-${encodeURIComponent(name)}`;
async function handleLogout() {
  debugger;
  try {
    const response = await fetch("http://localhost:8080/api/Auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      alert("Logout failed. Please try again.");
      return;
    }

    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Unable to connect to ShopSmart.");
  }
}

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__main">
        <a href="#products" className="navbar__logo">
          ShopSmart<span>.</span>
        </a>

        <div className="navbar__delivery">
          <span className="navbar__small-text">Delivering to</span>
          <strong>Your location</strong>
        </div>

        <form
          className="navbar__search"
          onSubmit={(event) => event.preventDefault()}
        >
          <select aria-label="Product category" defaultValue="all">
            <option value="all">All</option>
            {CATEGORIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <input
            type="search"
            placeholder="Search ShopSmart"
            aria-label="Search products"
          />

          <button type="submit" aria-label="Search">
            🔍
          </button>
        </form>

        <button className="navbar__account" type="button">
          <span className="navbar__small-text">Hello, welcome</span>
          <strong>Account</strong>
        </button>

        <button className="navbar__cart" type="button">
          🛒 <strong>Cart</strong>
        </button>
      </div>

      <button className="navbar__logout" type="button" onClick={handleLogout}>
        Logout
      </button>

      <nav className="navbar__categories" aria-label="Main navigation">
        <a href="#products">All Products</a>
        <a href="#deals">Today's Deals</a>
        {CATEGORIES.map((name) => (
          <a key={name} href={categoryLink(name)}>
            {name}
          </a>
        ))}
      </nav>
    </header>
  );
}

export default Navbar;
