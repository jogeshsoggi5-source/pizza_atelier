import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Flame, Leaf, Quote, Star, Truck, Wheat } from "lucide-react";

import storyChef from "@/assets/story-chef.jpg";
import galleryPrep from "@/assets/gallery-prep.jpg";
import galleryIngredients from "@/assets/gallery-ingredients.jpg";
import galleryInterior from "@/assets/gallery-interior.jpg";
import galleryOven from "@/assets/gallery-oven.jpg";
import galleryCustomers from "@/assets/gallery-customers.jpg";
import { Button } from "@/components/ui/button";
import { PizzaCard } from "@/components/site/PizzaCard";
import { HeroSlideshow } from "@/components/site/HeroSlideshow";
import { signaturePizzas } from "@/lib/menu-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pizza Atelier — Artisan Wood-Fired Pizza in Brooklyn" },
      {
        name: "description",
        content:
          "Crafted like art. Baked with passion. Handmade wood-fired pizzas with fresh, locally sourced ingredients. Explore the menu or order online.",
      },
      {
        property: "og:title",
        content: "Pizza Atelier — Artisan Wood-Fired Pizza",
      },
      {
        property: "og:description",
        content:
          "Handmade wood-fired pizzas with authentic ingredients and traditional techniques.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Wheat,
    title: "Fresh Dough Daily",
    text: "48-hour fermented dough, mixed and shaped by hand every morning.",
  },
  {
    icon: Flame,
    title: "Wood-Fired Oven",
    text: "Baked at 450°C in our copper-domed oven for a perfect leopard char.",
  },
  {
    icon: Leaf,
    title: "Organic Ingredients",
    text: "Locally sourced produce and imported Italian essentials, always fresh.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    text: "From our oven to your door, hot and fresh in 30 minutes or less.",
  },
  {
    icon: Star,
    title: "Rated by Thousands",
    text: "4.9 stars across thousands of reviews from pizza lovers like you.",
  },
];

const reviews = [
  {
    name: "Sofia Marchetti",
    role: "Food Blogger",
    text: "The Truffle Mushroom is genuinely the best pizza I've had outside of Naples. The crust alone is worth the trip.",
  },
  {
    name: "James Okafor",
    role: "Regular Guest",
    text: "Pizza Atelier turned our Friday nights into a ritual. Beautiful space, warm service, and that Burrata Deluxe... incredible.",
  },
  {
    name: "Elena Rossi",
    role: "Local Chef",
    text: "You can taste the craftsmanship in every bite. The dough, the char, the balance of toppings — this is pizza as art.",
  },
];

function Index() {
  const [heroCaption, setHeroCaption] = useState("Wood-Fired Pizza");

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <HeroSlideshow onSlideChange={setHeroCaption} />
        <div className="overlay-hero absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center">
          <p
            key={heroCaption}
            className="eyebrow animate-slide-up tracking-widest"
          >
            {heroCaption} • Handcrafted • Brooklyn
          </p>
          <h1 className="animate-slide-up-delay-1 mt-6 font-display text-5xl font-bold leading-tight text-cream md:text-8xl md:leading-tight">
            <span className="block">Crafted Like Art.</span>
            <span className="italic text-gold">Baked with Passion.</span>
          </h1>
          <div className="animate-slide-up-delay-3 mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="px-8 text-base">
              <Link to="/menu">Explore Menu</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-gold px-8 text-base text-charcoal hover:bg-gold/90"
            >
              <Link to="/order">Order Online</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Signature Pizzas */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow">From the Atelier</p>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
            Signature Pizzas
          </h2>
          <p className="mt-4 text-muted-foreground">
            A few favourites from our oven, in Regular, Medium and Large.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-8 lg:grid-cols-3">
          {signaturePizzas.map((pizza) => (
            <PizzaCard key={pizza.id} item={pizza} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/menu">View Full Menu</Link>
          </Button>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-muted">
        <div className="container mx-auto grid items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div className="relative">
            <img
              src={storyChef}
              alt="Pizza Atelier chef holding a finished pizza in front of the wood-fired oven"
              loading="lazy"
              width={960}
              height={1088}
              className="w-full rounded-xl object-cover shadow-card"
            />
            <div className="absolute -bottom-5 -right-5 hidden rounded-xl bg-primary px-6 py-4 text-primary-foreground shadow-card md:block">
              <p className="font-display text-3xl font-bold">12+</p>
              <p className="text-xs uppercase tracking-widest">
                Years of Craft
              </p>
            </div>
          </div>
          <div>
            <p className="eyebrow">Our Story</p>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              Every Pizza Is a Masterpiece
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              At Pizza Atelier, every pizza is treated as a masterpiece.
              Inspired by Italian craftsmanship, our chefs combine premium
              ingredients with creative recipes to create unforgettable flavors.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              From dough fermented for 48 hours to San Marzano tomatoes crushed
              by hand, we obsess over every detail — so all you have to do is
              enjoy the moment.
            </p>
            <Button asChild variant="outline" className="mt-8">
              <Link to="/about">Read Our Full Story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-charcoal text-cream">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-xl text-center">
            <p className="eyebrow">Why Pizza Atelier</p>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              The Atelier Difference
            </h2>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-gold">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/65">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow">Guest Reviews</p>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
            Loved by Thousands
          </h2>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {reviews.map((review) => (
            <figure
              key={review.name}
              className="rounded-xl bg-card p-7 shadow-card"
            >
              <Quote className="h-7 w-7 text-gold" />
              <div className="mt-4 flex gap-1" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                "{review.text}"
              </blockquote>
              <figcaption className="mt-5">
                <p className="font-semibold">{review.name}</p>
                <p className="text-xs text-muted-foreground">{review.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Gallery preview */}
      <section className="container mx-auto px-4 pb-20 md:pb-28">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow">Behind the Scenes</p>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
            Inside the Atelier
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          <img
            src={galleryOven}
            alt="Wood-fired oven with flames"
            loading="lazy"
            width={800}
            height={800}
            className="hover-lift col-span-2 row-span-2 h-full w-full rounded-xl object-cover"
          />
          <img
            src={galleryPrep}
            alt="Chef preparing pizza dough"
            loading="lazy"
            width={800}
            height={800}
            className="hover-lift h-full w-full rounded-xl object-cover"
          />
          <img
            src={galleryIngredients}
            alt="Fresh Italian ingredients"
            loading="lazy"
            width={800}
            height={800}
            className="hover-lift h-full w-full rounded-xl object-cover"
          />
          <img
            src={galleryInterior}
            alt="Restaurant interior"
            loading="lazy"
            width={800}
            height={800}
            className="hover-lift h-full w-full rounded-xl object-cover"
          />
          <img
            src={galleryCustomers}
            alt="Guests enjoying pizza together"
            loading="lazy"
            width={800}
            height={800}
            className="hover-lift h-full w-full rounded-xl object-cover"
          />
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/gallery">View Gallery</Link>
          </Button>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-16 text-center md:py-20">
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Hungry Yet?
          </h2>
          <p className="max-w-md text-primary-foreground/85">
            Order online for delivery or pickup — or reserve a table and watch
            the fire work its magic.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-gold px-8 text-charcoal hover:bg-gold/90"
            >
              <Link to="/order">Order Online</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-cream/50 bg-transparent px-8 text-cream hover:bg-cream/10 hover:text-cream"
            >
              <Link to="/reservations">Reserve a Table</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
