import { useEffect, useState } from "react";
import { useCategories } from "../hooks/useCatalog";
import "./SideMenu.css";

const categoryHash = (name: string, sub?: string) =>
  `#category-${encodeURIComponent(name)}${
    sub ? `~${encodeURIComponent(sub)}` : ""
  }`;

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function SideMenu({ open, onClose }: SideMenuProps) {
  const [showAll, setShowAll] = useState(false); // "See all" categories
  const [subOpen, setSubOpen] = useState(false); // second panel visible?
  const [subName, setSubName] = useState<string | null>(null);

  // Categories and sub categories come from the Categories table (SQL)
  const categories = useCategories();

  // Close with the Escape key and stop the page scrolling behind the menu
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  // Go back to the main panel after the menu closes
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setSubOpen(false), 300);
    return () => clearTimeout(timer);
  }, [open]);

  // Change the hash, tell ProductList, close the menu
  function go(hash: string) {
    window.history.replaceState(null, "", hash);
    window.dispatchEvent(new Event("hashchange"));
    onClose();
  }

  function openSub(name: string) {
    setSubName(name);
    setSubOpen(true);
  }

  const shown = showAll ? categories : categories.slice(0, 4);
  const activeCategory = categories.find((c) => c.name === subName);

  return (
    <div className={`sidemenu ${open ? "is-open" : ""}`}>
      <div className="sidemenu__overlay" onClick={onClose} />

      <aside
        className="sidemenu__drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <button
          type="button"
          className="sidemenu__close"
          aria-label="Close menu"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="sidemenu__top">
          <span aria-hidden="true">👤</span>
          <strong>Hello, welcome</strong>
        </div>

        <div className="sidemenu__viewport">
          <div
            className="sidemenu__track"
            style={{ transform: subOpen ? "translateX(-50%)" : "none" }}
          >
            {/* ---------- Panel 1: main menu ---------- */}
            <nav className="sidemenu__panel" aria-hidden={subOpen}>
              <section className="sidemenu__section">
                <h3>Trending</h3>
                <button
                  type="button"
                  className="sidemenu__item"
                  onClick={() => go("#deals")}
                >
                  Today's Deals
                </button>
                <button
                  type="button"
                  className="sidemenu__item"
                  onClick={() => go("#products")}
                >
                  All Products
                </button>
              </section>

              <section className="sidemenu__section">
                <h3>Shop by Category</h3>
                {shown.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    className="sidemenu__item"
                    onClick={() => openSub(category.name)}
                  >
                    <span>{category.name}</span>
                    <span className="sidemenu__chev" aria-hidden="true">
                      ›
                    </span>
                  </button>
                ))}

                {categories.length > 4 && (
                  <button
                    type="button"
                    className="sidemenu__item sidemenu__seeall"
                    aria-expanded={showAll}
                    onClick={() => setShowAll((v) => !v)}
                  >
                    <span>{showAll ? "See less" : "See all"}</span>
                    <span
                      className={`sidemenu__chev ${showAll ? "is-up" : "is-down"}`}
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </button>
                )}
              </section>

              <section className="sidemenu__section">
                <h3>Help &amp; Settings</h3>
                <button
                  type="button"
                  className="sidemenu__item"
                  onClick={onClose}
                >
                  Your Account
                </button>
                <button
                  type="button"
                  className="sidemenu__item"
                  onClick={onClose}
                >
                  Your Cart
                </button>
                <button
                  type="button"
                  className="sidemenu__item"
                  onClick={onClose}
                >
                  Customer Service
                </button>
              </section>
            </nav>

            {/* ---------- Panel 2: sub categories ---------- */}
            <nav className="sidemenu__panel" aria-hidden={!subOpen}>
              <button
                type="button"
                className="sidemenu__back"
                onClick={() => setSubOpen(false)}
              >
                <span aria-hidden="true">‹</span> Main Menu
              </button>

              <section className="sidemenu__section sidemenu__section--sub">
                <h3>{subName}</h3>
                {activeCategory && (
                  <>
                    <button
                      type="button"
                      className="sidemenu__item"
                      onClick={() => go(categoryHash(activeCategory.name))}
                    >
                      All in {activeCategory.name}
                    </button>
                    {(activeCategory.children ?? []).map((sub) => (
                      <button
                        key={sub.name}
                        type="button"
                        className="sidemenu__item"
                        onClick={() =>
                          go(categoryHash(activeCategory.name, sub.name))
                        }
                      >
                        <span>{sub.name}</span>
                      </button>
                    ))}
                  </>
                )}
              </section>
            </nav>
          </div>
        </div>
      </aside>
    </div>
  );
}
