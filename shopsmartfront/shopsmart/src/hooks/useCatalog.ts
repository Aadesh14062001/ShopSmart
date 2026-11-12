import { useEffect, useState } from "react";

/* ---------- Shapes of the data coming from your .NET API ---------- */

// From GET /api/Categories (main categories, each with its sub categories)
export interface Category {
  id: number;
  name: string;
  imageUrl: string | null;
  children: Category[];
}

// From GET /api/Products
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  mrp?: number | null; // original price (M.R.P). Optional.
  stockQuantity: number;
  imageUrl: string | null;
  categoryId: number | null; // the sub category (or main category) of the product
  isActive: boolean;
}

// A product plus the names we work out from the category tree
export interface CatalogProduct extends Product {
  mainName: string; // Electronics
  subName: string; // Laptops
}

const PRODUCTS_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/Products"; // Same server, /api/Products. You can also set VITE_API_URL in .env

// Same server, /api/Categories. You can also set VITE_CATEGORIES_URL in .env
const CATEGORIES_URL: string =
  import.meta.env.VITE_CATEGORIES_URL ??
  PRODUCTS_URL.replace(/\/Products\/?$/i, "/Categories");

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/* ---------- Only the category tree (used by the side menu) ---------- */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getJson<Category[]>(CATEGORIES_URL)
      .then(setCategories)
      .catch(() => {
        /* the menu simply stays empty if the API is down */
      });
  }, []);

  return categories;
}

/* ---------- Categories + products (used by the home page) ---------- */
export function useCatalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [cats, rows] = await Promise.all([
          getJson<Category[]>(CATEGORIES_URL),
          getJson<Product[]>(PRODUCTS_URL),
        ]);

        // categoryId -> main name, sub name
        const where = new Map<
          number,
          { mainName: string; subName: string }
        >();
        cats.forEach((main) => {
          where.set(main.id, { mainName: main.name, subName: "Others" });
          (main.children ?? []).forEach((sub) =>
            where.set(sub.id, { mainName: main.name, subName: sub.name }),
          );
        });

        // Products with no category (or an inactive one) are not shown
        const list: CatalogProduct[] = rows
          .filter((p) => p.isActive && p.categoryId != null)
          .filter((p) => where.has(p.categoryId as number))
          .map((p) => ({ ...p, ...where.get(p.categoryId as number)! }));

        setCategories(cats);
        setProducts(list);
      } catch {
        setError(
          "Could not load products. Check whether your .NET API is running.",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return { categories, products, loading, error };
}