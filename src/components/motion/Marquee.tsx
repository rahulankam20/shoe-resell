type MarqueeProps = {
  items: string[];
  className?: string;
  reverse?: boolean;
};

export default function Marquee({ items, className = '', reverse = false }: MarqueeProps) {
  const loop = [...items, ...items];

  return (
    <div className={`sv-marquee ${reverse ? 'is-reverse' : ''} ${className}`.trim()} aria-hidden="true">
      <div className="sv-marquee-track">
        {loop.map((item, index) => (
          <span key={`${item}-${index}`}>
            {item}
            <i />
          </span>
        ))}
      </div>
    </div>
  );
}
