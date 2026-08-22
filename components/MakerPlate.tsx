export function MakerPlate() {
  return (
    <aside className="maker-plate maker-plate-fixed" aria-label="About the maker">
      <img
        className="maker-portrait"
        src="/brian-su.png"
        alt="Brian Su"
        width={52}
        height={52}
      />
      <div className="maker-copy">
        <strong>Brian Su</strong>
        <p className="maker-links">
          <a
            href="https://brian-su-website.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Website
          </a>
          <a
            href="https://www.linkedin.com/in/briansu33/"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </p>
      </div>
    </aside>
  );
}
