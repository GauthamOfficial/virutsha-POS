import { useDispatch, useSelector } from "react-redux";
import { MdHome, MdFlight } from "react-icons/md";
import { setCustomerType } from "../../redux/slices/customerSlice";

/**
 * The Local / Foreigner switch.
 *
 * Flipping it re-prices every item already in the cart, because the cart keeps
 * both prices and the totals are worked out from this choice. The cashier can
 * therefore switch at any point in the order - even after ringing everything
 * up - and the bill simply updates.
 */
const CustomerTypeToggle = ({ size = "normal" }) => {
  const dispatch = useDispatch();
  const customerType = useSelector((state) => state.customer.customerType);
  const { localLabel, foreignLabel } = useSelector((state) => state.settings.data);

  const options = [
    { value: "Local", label: localLabel || "Local", icon: <MdHome /> },
    { value: "Foreigner", label: foreignLabel || "Foreigner", icon: <MdFlight /> },
  ];

  const padding = size === "large" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm";

  return (
    <div
      className="inline-flex rounded-xl border border-line bg-panel p-1"
      role="group"
      aria-label="Customer pricing type"
    >
      {options.map((option) => {
        const isActive = customerType === option.value;
        // Mustard for local, dark green for visitors - two brand colours that
        // stay apart for colour-blind readers, not just two shades of one.
        const activeStyle =
          option.value === "Foreigner"
            ? "bg-forest text-shell"
            : "bg-mustard text-ink";

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => dispatch(setCustomerType(option.value))}
            className={`flex items-center gap-2 rounded-lg font-bold transition ${padding} ${
              isActive ? activeStyle : "text-muted hover:text-ink"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default CustomerTypeToggle;
