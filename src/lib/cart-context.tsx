import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { PizzaSize } from "@/lib/menu-data";

export interface CartItem {
  /** Unique per cart line, e.g. "farmhouse:large:cheese-burst" for a customised pizza. */
  id: string;
  /** Menu item id; absent on carts saved before sizes existed (then equals id). */
  productId?: string;
  size?: PizzaSize;
  /** Labels of pizza upgrades, e.g. ["Cheese Burst"]. */
  extras?: string[];
  name: string;
  /** Unit price, including size and upgrades. */
  price: number;
  qty: number;
}

type NewCartItem = {
  id: string;
  name: string;
  price: number;
  size?: PizzaSize;
  extras?: string[];
};

interface CartContextValue {
  items: CartItem[];
  addItem: (item: NewCartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

// v3: menu replaced with the Pizza Point menu; older carts hold items that no longer exist.
const STORAGE_KEY = "pizza-atelier-cart-v3";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage may be unavailable
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (item: NewCartItem) => {
      const lineId = [item.id, item.size, ...(item.extras ?? [])]
        .filter(Boolean)
        .join(":");
      setItems((prev) => {
        const existing = prev.find((i) => i.id === lineId);
        if (existing) {
          return prev.map((i) =>
            i.id === lineId ? { ...i, qty: i.qty + 1 } : i,
          );
        }
        return [...prev, { ...item, id: lineId, productId: item.id, qty: 1 }];
      });
    };

    const removeItem = (id: string) =>
      setItems((prev) => prev.filter((i) => i.id !== id));

    const updateQty = (id: string, qty: number) => {
      if (qty <= 0) {
        removeItem(id);
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
    };

    const clear = () => setItems([]);

    const count = items.reduce((sum, i) => sum + i.qty, 0);
    const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

    return { items, addItem, removeItem, updateQty, clear, count, total };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
