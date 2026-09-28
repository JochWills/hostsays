/** Five stars, filled to the nearest half. Only render when there are 3+ reviews. */
export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="flex gap-0.5 text-gold" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          aria-hidden="true"
          className={`fill-current ${i > rounded + 0.01 ? "opacity-30" : ""}`}
        >
          <path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" />
        </svg>
      ))}
    </span>
  );
}
