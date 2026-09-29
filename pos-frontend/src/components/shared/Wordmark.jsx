import { useSelector } from "react-redux";
import { splitName } from "../../utils";

/**
 * The restaurant name set as type, standing in for the logo until the real one
 * exists. Once the logo is ready it drops in beside this, or replaces it,
 * without the rest of the layout moving.
 *
 * The first word carries the brand face; whatever follows sits beneath it in
 * letterspaced capitals. Splitting on the name from Settings rather than
 * hardcoding "VISA" means renaming the shop still produces a sensible mark.
 */
const sizes = {
  sm: { main: "text-xl", sub: "text-[9px] tracking-[0.3em]" },
  md: { main: "text-3xl", sub: "text-[10px] tracking-[0.35em]" },
  lg: { main: "text-6xl", sub: "text-xs tracking-[0.4em]" },
};

const Wordmark = ({ name, size = "md", tone = "ink", className = "" }) => {
  // Follows the name in Settings, so renaming the shop updates every mark.
  const shopName = useSelector((state) => state.settings.data.restaurantName);
  const scale = sizes[size] ?? sizes.md;
  const { lead, rest } = splitName(name ?? shopName);

  // `cream` is for use on a terracotta or green fill; `ink` for the page.
  const leadTone = tone === "cream" ? "text-shell" : "text-terracotta";
  const restTone = tone === "cream" ? "text-shell/90" : "text-mustard-deep";

  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className={`font-brand italic tracking-tight ${scale.main} ${leadTone}`}>
        {lead.toUpperCase()}
      </span>
      {rest && (
        <span className={`mt-1 font-sans font-semibold uppercase ${scale.sub} ${restTone}`}>
          {rest}
        </span>
      )}
    </span>
  );
};

export default Wordmark;
