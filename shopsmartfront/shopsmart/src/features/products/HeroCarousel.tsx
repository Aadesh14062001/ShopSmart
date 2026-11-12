import { useEffect, useState } from "react";
import "./HeroCarousel.css";

interface Slide {
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href: string;

  theme: "orange" | "blue" | "rose" | "green";
  image?: string; // optional: your own banner picture, e.g. "/images/banner1.jpg"
}

const categoryLink = (name: string) => `#category-${encodeURIComponent(name)}`;

// Change the text, links and pictures of the banners here

const SLIDES: Slide[] = [
  {
    eyebrow: "Great Festival Sale",
    title: "Up to 40% off on top deals",
    text: "Phones, laptops, fashion and home essentials at the best prices.",
    cta: "See today's deals",
    href: "#deals",
    theme: "orange",
  },
  {
    eyebrow: "Electronics",
    title: "Latest mobiles, laptops and more",
    text: "Smart TVs, headphones, cameras and accessories in one place.",
    cta: "Shop Electronics",
    href: categoryLink("Electronics"),
    theme: "blue",
  },
  {
    eyebrow: "Lifestyle",
    title: "Fashion that fits your style",
    text: "Dresses, shirts, shoes, bags, watches and jewellery.",
    cta: "Shop Lifestyle",
    href: categoryLink("Lifestyle"),
    theme: "rose",
  },
  {
    eyebrow: "Home & Kitchen",
    title: "Make your home better",
    text: "Cookware, furniture, decor and kitchen appliances.",
    cta: "Shop Home & Kitchen",
    href: categoryLink("Home & Kitchen"),
    theme: "green",
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = (next: number) => setIndex((next + SLIDES.length) % SLIDES.length);

  // Change slide every 5 seconds (stops while the mouse is over the banner)
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section
      className="hero-carousel"
      aria-roledescription="carousel"
      aria-label="Featured offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="hero-carousel__track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((slide, i) => (
          <div
            className="hero-carousel__slide"
            data-theme={slide.theme}
            key={slide.title}
            aria-hidden={i !== index}
          >
            <div className="hero-carousel__text">
              <p className="hero-carousel__eyebrow">{slide.eyebrow}</p>
              <h2>{slide.title}</h2>
              <p>{slide.text}</p>
              <a
                href={slide.href}
                className="hero-carousel__cta"
                tabIndex={i === index ? 0 : -1}
              >
                {slide.cta}
              </a>
            </div>
            {slide.image && (
              <div className="hero-carousel__art" aria-hidden="true">
                <img src={slide.image} alt="" />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="hero-carousel__arrow hero-carousel__arrow--left"
        aria-label="Previous banner"
        onClick={() => go(index - 1)}
      >
        ‹
      </button>
      <button
        type="button"
        className="hero-carousel__arrow hero-carousel__arrow--right"
        aria-label="Next banner"
        onClick={() => go(index + 1)}
      >
        ›
      </button>

      <div className="hero-carousel__dots">
        {SLIDES.map((slide, i) => (
          <button
            type="button"
            key={slide.title}
            className={i === index ? "is-active" : ""}
            aria-label={`Show banner ${i + 1}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
