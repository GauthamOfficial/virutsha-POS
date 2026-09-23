/**
 * The name set as type, standing in for the logo until the real one exists.
 *
 * Deliberately no symbol or icon: once the logo is ready it drops in beside
 * this, or replaces it, without the rest of the layout moving.
 */
const sizes = {
  sm: { main: "text-lg", sub: "text-[9px] tracking-[0.3em]" },
  md: { main: "text-2xl", sub: "text-[10px] tracking-[0.35em]" },
  lg: { main: "text-5xl", sub: "text-xs tracking-[0.4em]" },
};

const Wordmark = ({ size = "md", tone = "ink", className = "" }) => {
  const scale = sizes[size] ?? sizes.md;

  // `cream` is for use on a terracotta or green fill; `ink` for the page.
  const mainTone = tone === "cream" ? "text-shell" : "text-terracotta";
  const subTone = tone === "cream" ? "text-shell/75" : "text-mustard-deep";

  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className={`font-display font-normal tracking-wide ${scale.main} ${mainTone}`}>
        VISA
      </span>
      <span className={`mt-1 font-sans font-semibold uppercase ${scale.sub} ${subTone}`}>
        Tamil Kitchen
      </span>
    </span>
  );
};

export default Wordmark;
