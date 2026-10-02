import margherita from "@/assets/pizza-margherita.jpg";

/** Item photos live in src/assets/menu/<item-id>.jpg; replace a file to change its photo. */
const menuPhotos = import.meta.glob<string>("../assets/menu/*.jpg", {
  eager: true,
  import: "default",
});
const photoFor = (id: string): string | undefined =>
  menuPhotos[`../assets/menu/${id}.jpg`];

export type MenuCategory =
  | "simple-veg"
  | "special-1"
  | "special-2"
  | "special-3"
  | "pizza-mania"
  | "burgers"
  | "sandwiches"
  | "wraps"
  | "rolls"
  | "pasta"
  | "snacks"
  | "breads"
  | "shakes"
  | "desserts";

export type PizzaSize = "small" | "medium" | "large";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  /** Single price, or the Regular price for pizzas with sizePrices. */
  price: number;
  /** Present on pizzas sold in Regular / Medium / Large. */
  sizePrices?: Record<PizzaSize, number>;
  category: MenuCategory;
  image?: string;
  tag?: string;
}

export const categoryLabels: Record<MenuCategory, string> = {
  "simple-veg": "Simple Veg Treat",
  "special-1": "Special 1",
  "special-2": "Special 2",
  "special-3": "Special 3",
  "pizza-mania": "Pizza Mania",
  burgers: "Burgers",
  sandwiches: "Sandwiches",
  wraps: "Wraps",
  rolls: "Rolls",
  pasta: "Pasta",
  snacks: "Snacks",
  breads: "Breads",
  shakes: "Shakes",
  desserts: "Dessert",
};

/** Short line shown under a category heading. */
export const categoryNotes: Partial<Record<MenuCategory, string>> = {
  "special-3":
    "Buy 1 Get 1 Free every Saturday on Medium & Large pizzas of Special 1, 2 & 3.",
  "pizza-mania": "Get all six Pizza Mania pizzas for ₹499.",
};

/** Order in which categories appear on the menu and order pages. */
export const menuCategoryOrder: MenuCategory[] = [
  "simple-veg",
  "special-1",
  "special-2",
  "special-3",
  "pizza-mania",
  "burgers",
  "sandwiches",
  "wraps",
  "rolls",
  "pasta",
  "snacks",
  "breads",
  "shakes",
  "desserts",
];

const sized = (small: number, medium: number, large: number) => ({
  price: small,
  sizePrices: { small, medium, large },
});

const special1 = sized(129, 299, 459);
const special2 = sized(149, 349, 499);
const special3 = sized(189, 419, 549);

const items: MenuItem[] = [
  // Simple Veg Treat
  {
    id: "cheese-corns",
    name: "Cheese & Corns",
    description: "Sweet corns",
    category: "simple-veg",
    ...sized(99, 199, 319),
  },
  {
    id: "corn-tomato-pizza",
    name: "Corn Tomato Pizza",
    description: "Sweet corns and tomatoes",
    category: "simple-veg",
    ...sized(109, 209, 329),
  },
  {
    id: "margherita",
    name: "Margherita",
    description: "Only mozzarella cheese",
    category: "simple-veg",
    image: margherita,
    ...sized(119, 229, 349),
  },

  // Special 1
  {
    id: "fresh-veg",
    name: "Fresh Veg",
    description: "Onion, capsicum, tomato",
    category: "special-1",
    ...special1,
  },
  {
    id: "farmhouse",
    name: "Farmhouse",
    description: "Onion, capsicum, tomato, sweetcorn",
    category: "special-1",
    ...special1,
  },
  {
    id: "macroni-pizza",
    name: "Macroni Pizza",
    description: "Onion, capsicum, macroni, golden corns",
    category: "special-1",
    ...special1,
  },
  {
    id: "paneer-makhni-pizza",
    name: "Paneer Makhni Pizza",
    description: "Paneer, capsicum, onion, makhni sauce, extra cheese",
    category: "special-1",
    tag: "Special",
    ...special1,
  },

  // Special 2
  {
    id: "mix-veg-pizza",
    name: "Mix Veg Pizza",
    description:
      "Onion, capsicum, tomato, sweetcorn, black olive, red paprika, jalapeno",
    category: "special-2",
    ...special2,
  },
  {
    id: "spicy-paneer-pizza",
    name: "Spicy Paneer Pizza",
    description: "Onion, paneer, red paprika",
    category: "special-2",
    ...special2,
  },
  {
    id: "indi-tandoori-pizza",
    name: "Indi Tandoori Pizza",
    description: "Onion, capsicum, paneer, red paprika, mint sauce",
    category: "special-2",
    ...special2,
  },
  {
    id: "cheese-delite",
    name: "Cheese Delite",
    description: "Onion, corn, paneer",
    category: "special-2",
    tag: "Special",
    ...special2,
  },

  // Special 3
  {
    id: "chef-veg-wonder",
    name: "Chef Veg Wonder",
    description:
      "Paneer, grilled mushroom, crushed tikki, onion, capsicum, tomato, sweetcorn, black olive, red paprika, jalapeno",
    category: "special-3",
    ...special3,
  },
  {
    id: "paneer-delux-pizza",
    name: "Paneer Delux Pizza",
    description: "Onion, capsicum, tomato, sweetcorn",
    category: "special-3",
    ...special3,
  },
  {
    id: "achari-paneer",
    name: "Achari Paneer",
    description: "Onion, capsicum, paneer, jalapeno",
    category: "special-3",
    ...special3,
  },
  {
    id: "double-cheese-veg-supreme",
    name: "Double Cheese Veg Supreme",
    description:
      "Onion, capsicum, tomato, sweetcorn, black olive, red paprika, jalapeno, extra cheese",
    category: "special-3",
    ...special3,
  },

  // Pizza Mania
  {
    id: "onion-pizza",
    name: "Onion Pizza",
    price: 69,
    category: "pizza-mania",
  },
  {
    id: "tomato-pizza",
    name: "Tomato Pizza",
    price: 79,
    category: "pizza-mania",
  },
  {
    id: "capsicum-pizza",
    name: "Capsicum Pizza",
    price: 79,
    category: "pizza-mania",
  },
  {
    id: "onion-capsicum-pizza",
    name: "Onion Capsicum Pizza",
    price: 99,
    category: "pizza-mania",
  },
  {
    id: "paneer-corn-pizza",
    name: "Paneer Corn Pizza",
    price: 109,
    category: "pizza-mania",
  },
  {
    id: "paneer-onion-pizza",
    name: "Paneer Onion Pizza",
    price: 109,
    category: "pizza-mania",
  },

  // Burgers
  {
    id: "aloo-tikki-burger",
    name: "Aloo Tikki Burger",
    price: 35,
    category: "burgers",
  },
  {
    id: "macroni-cream-burger",
    name: "Macroni Cream Burger",
    price: 39,
    category: "burgers",
  },
  {
    id: "noodle-burger",
    name: "Noodle Burger",
    price: 39,
    category: "burgers",
  },
  { id: "chips-burger", name: "Chips Burger", price: 49, category: "burgers" },
  {
    id: "mexican-paneer-burger",
    name: "Mexican Paneer Burger",
    price: 69,
    category: "burgers",
  },
  {
    id: "maharaja-burger",
    name: "Maharaja Burger",
    price: 99,
    category: "burgers",
  },

  // Sandwiches
  {
    id: "classic-veggie-sandwich",
    name: "Classic Veggie Sandwich",
    price: 99,
    category: "sandwiches",
  },
  {
    id: "mix-veg-sandwich",
    name: "Mix Veg Sandwich",
    price: 119,
    category: "sandwiches",
  },
  {
    id: "cheese-corn-sandwich",
    name: "Cheese & Corn Sandwich",
    price: 119,
    category: "sandwiches",
  },
  {
    id: "paneer-makhni-sandwich",
    name: "Paneer Makhni Sandwich",
    price: 139,
    category: "sandwiches",
  },
  {
    id: "paneer-tikka-sandwich",
    name: "Paneer Tikka Sandwich",
    price: 139,
    category: "sandwiches",
  },
  {
    id: "spicy-paneer-sandwich",
    name: "Spicy Paneer Sandwich",
    price: 149,
    category: "sandwiches",
  },

  // Wraps
  { id: "veggie-wrap", name: "Veggie Wrap", price: 99, category: "wraps" },
  { id: "achari-wrap", name: "Achari Wrap", price: 109, category: "wraps" },
  {
    id: "tandoori-paneer-wrap",
    name: "Tandoori Paneer Wrap",
    price: 129,
    category: "wraps",
  },
  {
    id: "mexican-paneer-wrap",
    name: "Mexican Paneer Wrap",
    price: 129,
    category: "wraps",
  },

  // Rolls
  { id: "mix-veg-roll", name: "Mix Veg Roll", price: 59, category: "rolls" },
  { id: "paneer-roll", name: "Paneer Roll", price: 69, category: "rolls" },
  {
    id: "spicy-paneer-roll",
    name: "Spicy Paneer Roll",
    price: 79,
    category: "rolls",
  },

  // Pasta
  {
    id: "white-sauce-pasta",
    name: "White Sauce Pasta",
    price: 99,
    category: "pasta",
  },
  {
    id: "red-sauce-pasta",
    name: "Red Sauce Pasta",
    price: 109,
    category: "pasta",
  },
  { id: "makhni-pasta", name: "Makhni Pasta", price: 129, category: "pasta" },

  // Snacks
  { id: "zingy-parcel", name: "Zingy Parcel", price: 49, category: "snacks" },
  { id: "paneer-parcel", name: "Paneer Parcel", price: 59, category: "snacks" },
  {
    id: "salted-french-fries",
    name: "Salted French Fries",
    price: 99,
    category: "snacks",
  },
  { id: "masala-fries", name: "Masala Fries", price: 109, category: "snacks" },
  {
    id: "peri-peri-fries",
    name: "Peri Peri Fries",
    price: 119,
    category: "snacks",
  },
  { id: "cheesy-fries", name: "Cheesy Fries", price: 129, category: "snacks" },

  // Breads
  {
    id: "garlic-bread-dip",
    name: "Garlic Bread with Dip",
    price: 129,
    category: "breads",
  },
  {
    id: "calzone-pocket",
    name: "Calzone Pocket (6 Pcs)",
    price: 159,
    category: "breads",
  },

  // Shakes
  { id: "vanilla-shake", name: "Vanilla Shake", price: 79, category: "shakes" },
  {
    id: "chocolate-shake",
    name: "Chocolate Shake",
    price: 89,
    category: "shakes",
  },
  {
    id: "strawberry-shake",
    name: "Strawberry Shake",
    price: 89,
    category: "shakes",
  },
  {
    id: "butterscotch-shake",
    name: "Butterscotch Shake",
    price: 89,
    category: "shakes",
  },
  {
    id: "bubble-gum-shake",
    name: "Bubble Gum Shake",
    price: 99,
    category: "shakes",
  },
  { id: "cold-coffee", name: "Cold Coffee", price: 99, category: "shakes" },
  { id: "oreo-shake", name: "Oreo Shake", price: 109, category: "shakes" },

  // Dessert
  {
    id: "choco-lava-cake",
    name: "Choco Lava Cake",
    price: 79,
    category: "desserts",
  },
];

export const menuItems: MenuItem[] = items.map((item) => ({
  ...item,
  image: item.image ?? photoFor(item.id),
}));

const featuredIds = [
  "margherita",
  "farmhouse",
  "paneer-makhni-pizza",
  "spicy-paneer-pizza",
  "chef-veg-wonder",
  "double-cheese-veg-supreme",
];

/** Pizzas featured on the home page. */
export const signaturePizzas = featuredIds
  .map((id) => menuItems.find((i) => i.id === id))
  .filter((i): i is MenuItem => Boolean(i));

/** True when a category's items come in Regular / Medium / Large. */
export const isSizedCategory = (category: MenuCategory) =>
  menuItems.some((i) => i.category === category && i.sizePrices);

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatPrice = (price: number) => inr.format(price);

export const pizzaSizes: { id: PizzaSize; label: string; short: string }[] = [
  { id: "small", label: "Regular", short: "R" },
  { id: "medium", label: "Medium", short: "M" },
  { id: "large", label: "Large", short: "L" },
];

export const priceForSize = (item: MenuItem, size: PizzaSize) =>
  item.sizePrices?.[size] ?? item.price;

/** "Upgrade your pizza" add-ons, priced per size. */
export const pizzaUpgrades: {
  id: string;
  label: string;
  prices: Record<PizzaSize, number>;
}[] = [
  {
    id: "thin-crust",
    label: "Thin Crust",
    prices: { small: 10, medium: 20, large: 30 },
  },
  {
    id: "cheese-burst",
    label: "Cheese Burst",
    prices: { small: 29, medium: 69, large: 99 },
  },
  {
    id: "extra-cheese",
    label: "Extra Cheese",
    prices: { small: 19, medium: 39, large: 69 },
  },
  {
    id: "extra-topping",
    label: "Extra Topping",
    prices: { small: 9, medium: 29, large: 49 },
  },
];
