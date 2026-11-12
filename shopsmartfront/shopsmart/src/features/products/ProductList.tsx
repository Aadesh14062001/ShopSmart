import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import HeroCarousel from "./HeroCarousel";
import { useCatalog, type CatalogProduct as Product } from "../../hooks/useCatalog";
import "./ProductList.css";


const getMain = (p: Product) => p.mainName;
const getSub = (p: Product) => p.subName;

// Discount % between M.R.P and selling price (0 if there is no M.R.P)
const discountOf = (p: Product) =>
  p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;

const PRICE_RANGES = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under ₹1,000", min: 0, max: 1000 },
  { label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
  { label: "₹5,000 – ₹20,000", min: 5000, max: 20000 },
  { label: "Over ₹20,000", min: 20000, max: Infinity },
];

type SortKey = "featured" | "low" | "high";

const formatPrice = (value: number) =>
  value.toLocaleString("en-IN", { maximumFractionDigits: 0 });

/* ---------- Image that never shows a broken icon ---------- */
function SafeImage({
  src,
  alt,
  fallback,
}: {
  src: string | null;
  alt: string;
  fallback: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <span className="img-fallback">{fallback}</span>;
  }
  return (
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
  );
}

/* ---------- Horizontal row with left / right arrows ---------- */
function ScrollRow({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="scrollrow">
      <button
        type="button"
        className="scrollrow__btn scrollrow__btn--left"
        aria-label="Scroll left"
        onClick={() => scroll(-1)}
      >
        ‹
      </button>
      <div className="scrollrow__track" ref={trackRef}>
        {children}
      </div>
      <button
        type="button"
        className="scrollrow__btn scrollrow__btn--right"
        aria-label="Scroll right"
        onClick={() => scroll(1)}
      >
        ›
      </button>
    </div>
  );
}

/* ---------- One product card (Amazon style) ---------- */
function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stockQuantity <= 0;
  const lowStock = !outOfStock && product.stockQuantity <= 5;
  const off = discountOf(product);

  return (
    <article className="pcard">
      <div className="pcard__image">
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          fallback={product.name.charAt(0)}
        />
      </div>

      <h4 className="pcard__title">{product.name}</h4>
      <p className="pcard__desc">{product.description}</p>

      <div className="pcard__priceRow">
        {off > 0 && <span className="pcard__off">-{off}%</span>}
        <span className="pcard__price">
          <sup>₹</sup>
          {formatPrice(product.price)}
        </span>
      </div>
      {off > 0 && product.mrp && (
        <p className="pcard__mrp">
          M.R.P: <s>₹{formatPrice(product.mrp)}</s>
        </p>
      )}

      {outOfStock ? (
        <p className="stock stock--out">Currently unavailable</p>
      ) : lowStock ? (
        <p className="stock stock--low">
          Only {product.stockQuantity} left in stock
        </p>
      ) : (
        <p className="stock stock--in">In stock</p>
      )}

      <button
        type="button"
        className="btn-cart"
        disabled={outOfStock}
        onClick={() => alert(`${product.name} added to cart`)}
      >
        Add to cart
      </button>
    </article>
  );
}

/* ---------- Orange "deals" card with 4 product tiles ---------- */
function DealCard({
  title,
  products,
  onOpen,
}: {
  title: string;
  products: Product[];
  onOpen: (sub?: string) => void;
}) {
  return (
    <article className="deal-card">
      <button type="button" className="deal-card__head" onClick={() => onOpen()}>
        <h3>{title}</h3>
        <span aria-hidden="true">›</span>
      </button>

      <div className="deal-card__grid">
        {products.map((p) => {
          const off = discountOf(p);
          return (
            <button
              type="button"
              key={p.id}
              className="deal-tile"
              onClick={() => onOpen(getSub(p))}
            >
              <span className="deal-tile__img">
                <SafeImage
                  src={p.imageUrl}
                  alt={p.name}
                  fallback={p.name.charAt(0)}
                />
              </span>
              {off > 0 && <span className="deal-tile__off">{off}% off</span>}
              <span className="deal-tile__name">{p.name}</span>
              <span className="deal-tile__price">₹{formatPrice(p.price)}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

export default function ProductList() {
  // Categories and products both come from the API (SQL tables)
  const { categories, products, loading, error } = useCatalog();

  // null = home page
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState("All");
  const [priceIndex, setPriceIndex] = useState(0);
  const [sort, setSort] = useState<SortKey>("featured");


  // Built from the Categories table (order, names) and the products in each
  const tree = useMemo(
    () =>
      categories
        .map((main) => {
          const subs = (main.children ?? [])
            .map((sub) => {
              const items = products.filter((p) => p.categoryId === sub.id);
              return {
                id: sub.id,
                name: sub.name,
                count: items.length,
                image:
                  sub.imageUrl ??
                  items.find((p) => p.imageUrl)?.imageUrl ??
                  null,
              };
            })
            .filter((sub) => sub.count > 0);

          const items = products.filter((p) => p.mainName === main.name);
          return {
            name: main.name,
            total: items.length,
            products: items,
            maxOff: Math.max(0, ...items.map(discountOf)),
            subs,
          };
        })
        .filter((c) => c.total > 0),
    [categories, products],
  );

  const current = tree.find((c) => c.name === activeCategory) ?? null;

  const visibleProducts = useMemo(() => {
    if (!current) return [];
    const range = PRICE_RANGES[priceIndex];
    const list = products.filter(
      (p) =>
        getMain(p) === current.name &&
        (activeSub === "All" || getSub(p) === activeSub) &&
        p.price >= range.min &&
        p.price < range.max,
    );
    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, current, activeSub, priceIndex, sort]);

  function openCategory(name: string, sub = "All") {
    setActiveCategory(name);
    setActiveSub(sub);
    setPriceIndex(0);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  function goHome() {
    setActiveCategory(null);
    window.history.replaceState(null, "", "#products");
  }

  // Navbar and hero links use hashes: #category-Electronics, #deals, #products
  useEffect(() => {
    function applyHash() {
      const hash = decodeURIComponent(window.location.hash);
      if (hash.startsWith("#category-")) {
        // #category-Electronics  or  #category-Electronics~Laptops
        const [name, sub] = hash.slice("#category-".length).split("~");
        if (tree.some((c) => c.name === name)) openCategory(name, sub ?? "All");
      } else if (hash === "#products") {
        setActiveCategory(null);
      } else if (hash === "#deals") {
        setActiveCategory(null);
        setTimeout(
          () =>
            document
              .getElementById("deals")
              ?.scrollIntoView({ behavior: "smooth" }),
          60,
        );
      }
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  if (loading) {
    return (
      <>
        <HeroCarousel />
        <section className="shop shop--home" id="products">
          <div className="home-cards">
            {[1, 2, 3, 4].map((i) => (
              <div className="skeleton" key={i} />
            ))}
          </div>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <section className="shop" id="products">
        <p className="shop__error" role="alert">
          {error}
        </p>
      </section>
    );
  }

  /* ================= HOME ================= */
  if (!current) {
    return (
      <>
        <HeroCarousel />

        <section className="shop shop--home" id="products">
          {/* 1. Category cards with sub category pictures */}
          <div className="home-cards">
            {tree.map((category) => (
              <article className="cat-card" key={category.name}>
                <h3>
                  {category.maxOff > 0
                    ? `Up to ${category.maxOff}% off | ${category.name}`
                    : `Shop ${category.name}`}
                </h3>

                <div className="cat-card__grid">
                  {category.subs.slice(0, 4).map((sub) => (
                    <button
                      key={sub.name}
                      type="button"
                      className="cat-card__item"
                      onClick={() => openCategory(category.name, sub.name)}
                    >
                      <span className="cat-card__img">
                        <SafeImage
                          src={sub.image}
                          alt={sub.name}
                          fallback={sub.name.charAt(0)}
                        />
                      </span>
                      <span className="cat-card__label">{sub.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="link"
                  onClick={() => openCategory(category.name)}
                >
                  See all in {category.name}
                </button>
              </article>
            ))}
          </div>

          {/* 2. Orange deal cards */}
          <h2 className="section-title" id="deals">
            Deals for you
          </h2>
          <div className="deals-grid">
            {tree.map((category) => (
              <DealCard
                key={category.name}
                title={`${category.name} deals`}
                products={[...category.products]
                  .sort((a, b) => discountOf(b) - discountOf(a))
                  .slice(0, 4)}
                onOpen={(sub) => openCategory(category.name, sub)}
              />
            ))}
          </div>

          {/* 3. One scrolling row per category */}
          {tree.map((category) => (
            <div className="row" key={category.name}>
              <div className="row__head">
                <h3>Best of {category.name}</h3>
                <button
                  type="button"
                  className="link"
                  onClick={() => openCategory(category.name)}
                >
                  See all
                </button>
              </div>
              <ScrollRow>
                {category.products.slice(0, 12).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </ScrollRow>
            </div>
          ))}
        </section>
      </>
    );
  }

  /* ================= CATEGORY PAGE ================= */
  return (
    <section className="shop" id="products">
      <nav className="crumbs" aria-label="Breadcrumb">
        <button type="button" className="link" onClick={goHome}>
          All categories
        </button>
        <span>›</span>
        <strong>{current.name}</strong>
        {activeSub !== "All" && (
          <>
            <span>›</span>
            <strong>{activeSub}</strong>
          </>
        )}
      </nav>

      <div className="results">
        <aside className="filters">
          <h4>Department</h4>
          <ul>
            <li>
              <button type="button" className="link" onClick={goHome}>
                ‹ All categories
              </button>
            </li>
            <li className="filters__current">
              {current.name}
            </li>
            <li>
              <button
                type="button"
                className={`filters__sub ${activeSub === "All" ? "is-active" : ""}`}
                onClick={() => setActiveSub("All")}
              >
                All <span>({current.total})</span>
              </button>
            </li>
            {current.subs.map((sub) => (
              <li key={sub.name}>
                <button
                  type="button"
                  className={`filters__sub ${activeSub === sub.name ? "is-active" : ""}`}
                  onClick={() => setActiveSub(sub.name)}
                >
                  {sub.name} <span>({sub.count})</span>
                </button>
              </li>
            ))}
          </ul>

          <h4>Price</h4>
          <ul>
            {PRICE_RANGES.map((range, index) => (
              <li key={range.label}>
                <label className="filters__radio">
                  <input
                    type="radio"
                    name="price"
                    checked={priceIndex === index}
                    onChange={() => setPriceIndex(index)}
                  />
                  {range.label}
                </label>
              </li>
            ))}
          </ul>
        </aside>

        <div className="results__main">
          <div className="results__bar">
            <p>
              <strong>{visibleProducts.length}</strong> result
              {visibleProducts.length === 1 ? "" : "s"} for{" "}
              <em>{activeSub === "All" ? current.name : activeSub}</em>
            </p>

            <label className="results__sort">
              Sort by:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="featured">Featured</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
              </select>
            </label>
          </div>

          {visibleProducts.length === 0 ? (
            <p className="empty">
              No results. Try a different price range or sub category.
            </p>
          ) : (
            <div className="grid">
              {visibleProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}