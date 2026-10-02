import { Link, createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { PizzaCard } from "@/components/site/PizzaCard";
import {
  categoryLabels,
  categoryNotes,
  menuCategoryOrder,
  menuItems,
} from "@/lib/menu-data";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Pizza Atelier" },
      {
        name: "description",
        content:
          "Explore our veg pizzas in Regular, Medium and Large, plus burgers, sandwiches, wraps, rolls, pasta, snacks and shakes.",
      },
      { property: "og:title", content: "Menu — Pizza Atelier" },
      {
        property: "og:description",
        content:
          "Veg pizzas, burgers, sandwiches, wraps, pasta, snacks and shakes.",
      },
    ],
  }),
  component: MenuPage,
});

const categories = menuCategoryOrder.filter((c) =>
  menuItems.some((i) => i.category === c),
);

function MenuPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">The Menu</p>
        <h1 className="mt-3 font-display text-4xl font-bold md:text-6xl">
          Baked Over Oak
        </h1>
        <p className="mt-4 text-muted-foreground">
          Every dish is made from scratch daily. Add your favorites and order
          online for delivery or pickup.
        </p>
      </div>

      {/* Category shortcuts — scrolls sideways on phones */}
      <nav
        aria-label="Menu categories"
        className="sticky top-16 z-40 md:top-20 -mx-4 mt-10 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur md:mt-14"
      >
        <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <li key={category} className="shrink-0">
              <a
                href={`#${category}`}
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById(category)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-block rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {categoryLabels[category]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {categories.map((category) => {
        const items = menuItems.filter((item) => item.category === category);
        return (
          <section
            key={category}
            id={category}
            className="mt-12 scroll-mt-32 md:mt-16 md:scroll-mt-40"
          >
            <h2 className="font-display text-3xl font-bold">
              {categoryLabels[category]}
            </h2>
            {categoryNotes[category] && (
              <p className="mt-2 text-sm font-medium text-primary">
                {categoryNotes[category]}
              </p>
            )}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-8 lg:grid-cols-3">
              {items.map((item) => (
                <PizzaCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}

      <div className="mt-16 rounded-xl bg-charcoal p-10 text-center text-cream">
        <h2 className="font-display text-2xl font-bold md:text-3xl">
          Ready to order?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-cream/70">
          Review your cart and check out for delivery or pickup — fresh from the
          oven in 30 minutes.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-6 bg-gold text-charcoal hover:bg-gold/90"
        >
          <Link to="/order">Go to Checkout</Link>
        </Button>
      </div>
    </div>
  );
}
