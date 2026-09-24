import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { MdPercent } from "react-icons/md";
import {
  decreaseQuantity,
  increaseQuantity,
  lineAmountsFor,
  removeItem,
  setItemDiscount,
} from "../../redux/slices/cartSlice";
import { formatMoney } from "../../utils";

// The percentages a shop reaches for most often. Anything else goes in the box.
const quickPercents = [5, 10, 15, 20, 25, 50];

const CartLine = ({ item }) => {
  const dispatch = useDispatch();
  const customerType = useSelector((state) => state.customer.customerType);
  const currency = useSelector((state) => state.settings.data.currencySymbol);

  const [showDiscount, setShowDiscount] = useState(false);

  const line = lineAmountsFor(item, customerType);
  const hasDiscount = line.percent > 0;

  const apply = (value) => dispatch(setItemDiscount({ dishId: item.dishId, percent: value }));

  return (
    <li className="rounded-lg bg-shell p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{item.name}</p>
          <p className="text-xs text-muted">{formatMoney(line.unitPrice, currency)} each</p>
        </div>

        <div className="whitespace-nowrap text-right">
          {hasDiscount ? (
            <>
              {/* Original price stays visible so the discount is never silent. */}
              <p className="text-xs text-faint line-through">
                {formatMoney(line.gross, currency)}
              </p>
              <p className="text-sm font-bold text-ink">{formatMoney(line.net, currency)}</p>
            </>
          ) : (
            <p className="text-sm font-bold text-ink">{formatMoney(line.gross, currency)}</p>
          )}
        </div>
      </div>

      {hasDiscount && (
        <p className="mt-1 inline-block rounded bg-mustard-soft px-2 py-0.5 text-xs font-semibold text-mustard-deep">
          {line.percent}% off, saves {formatMoney(line.discount, currency)}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch(removeItem(item.dishId))}
            className="p-1 text-muted transition hover:text-danger"
            aria-label={`Remove ${item.name}`}
          >
            <RiDeleteBin2Fill size={18} />
          </button>

          <button
            onClick={() => setShowDiscount((open) => !open)}
            aria-pressed={showDiscount}
            aria-label={`Discount on ${item.name}`}
            title="Discount this item"
            className={`rounded-lg p-1 transition ${
              hasDiscount || showDiscount
                ? "bg-mustard-soft text-mustard-deep"
                : "text-muted hover:text-ink"
            }`}
          >
            <MdPercent size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-raised px-3 py-1">
          <button
            onClick={() => dispatch(decreaseQuantity(item.dishId))}
            className="text-xl font-bold text-mustard-deep"
            aria-label="Decrease quantity"
          >
            &minus;
          </button>
          <span className="min-w-[1.5rem] text-center font-semibold text-ink">
            {item.quantity}
          </span>
          <button
            onClick={() => dispatch(increaseQuantity(item.dishId))}
            className="text-xl font-bold text-mustard-deep"
            aria-label="Increase quantity"
          >
            &#43;
          </button>
        </div>
      </div>

      {showDiscount && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex flex-wrap gap-1.5">
            {quickPercents.map((percent) => (
              <button
                key={percent}
                onClick={() => apply(percent)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  line.percent === percent
                    ? "bg-mustard text-ink"
                    : "bg-raised text-muted hover:text-ink"
                }`}
              >
                {percent}%
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              value={item.discountPercent || ""}
              onChange={(e) => apply(e.target.value)}
              placeholder="Other %"
              className="w-24 rounded-md bg-raised px-2 py-1 text-sm text-ink outline-none placeholder:text-faint"
            />
            {hasDiscount && (
              <button
                onClick={() => apply(0)}
                className="text-xs font-semibold text-muted transition hover:text-danger"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
};

export default CartLine;
