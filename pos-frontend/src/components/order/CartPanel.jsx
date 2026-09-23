import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FaMoneyBillWave, FaCreditCard, FaTrash, FaQrcode } from "react-icons/fa";
import {
  clearCart,
  decreaseQuantity,
  increaseQuantity,
  removeItem,
  selectBill,
  selectCartItems,
  setDiscount,
  unitPriceFor,
} from "../../redux/slices/cartSlice";
import { resetCustomer, setCustomerDetails } from "../../redux/slices/customerSlice";
import { addOrder } from "../../https";
import { errorMessage } from "../../https/axiosWrapper";
import { formatMoney } from "../../utils";
import CustomerTypeToggle from "./CustomerTypeToggle";
import Invoice from "../invoice/Invoice";

// The three ways the shop takes money. Each keeps its own colour so the
// same colour means the same thing on the reports.
const paymentMethods = [
  {
    value: "Cash",
    label: "Cash",
    icon: <FaMoneyBillWave size={18} />,
    activeClass: "bg-forest",
  },
  {
    value: "Card",
    label: "Card",
    icon: <FaCreditCard size={18} />,
    activeClass: "bg-terracotta",
  },
  {
    value: "QR",
    label: "QR Scan",
    icon: <FaQrcode size={18} />,
    activeClass: "bg-mustard-deep",
  },
];

const CartPanel = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const items = useSelector(selectCartItems);
  const bill = useSelector(selectBill);
  // The raw typed value, not the capped one, so the box does not rewrite
  // what the cashier is halfway through typing.
  const typedDiscount = useSelector((state) => state.cart.discount);
  const customer = useSelector((state) => state.customer);
  const settings = useSelector((state) => state.settings.data);
  const currency = settings.currencySymbol;

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const cashGiven = Number(cashReceived) || 0;
  const changeDue = paymentMethod === "Cash" && cashGiven > bill.total ? cashGiven - bill.total : 0;

  const orderMutation = useMutation({
    mutationFn: addOrder,
    onSuccess: (res) => {
      const order = res.data.data;

      // Show the receipt first, then wipe the screen ready for the next customer.
      setCompletedOrder(order);
      dispatch(clearCart());
      dispatch(resetCustomer());
      setCashReceived("");
      setPaymentMethod("Cash");
      setShowDetails(false);

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });

      enqueueSnackbar(`Bill #${order.invoiceNo} saved`, { variant: "success" });
    },
    onError: (error) => {
      enqueueSnackbar(errorMessage(error), { variant: "error" });
    },
  });

  const handleSaveBill = () => {
    if (items.length === 0) {
      enqueueSnackbar("Add at least one item first.", { variant: "warning" });
      return;
    }

    orderMutation.mutate({
      customerType: customer.customerType,
      customerDetails: {
        name: customer.name,
        phone: customer.phone,
        guests: customer.guests,
      },
      items: items.map((item) => ({ dish: item.dishId, quantity: item.quantity })),
      paymentMethod,
      discount: bill.discount,
      amountPaid: paymentMethod === "Cash" && cashGiven > 0 ? cashGiven : bill.total,
    });
  };

  const handleClear = () => {
    if (items.length === 0) return;
    dispatch(clearCart());
    dispatch(resetCustomer());
    setCashReceived("");
  };

  return (
    <>
      <aside className="flex h-full flex-col rounded-xl bg-panel">
        {/* Pricing switch - kept at the top of the bill so it is impossible to miss */}
        <div className="border-b border-line p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Pricing
            </span>
            {items.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-xs text-muted transition hover:text-danger"
              >
                <FaTrash size={10} /> Clear
              </button>
            )}
          </div>
          <CustomerTypeToggle />
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {items.length === 0 ? (
            <p className="flex h-full min-h-[120px] items-center justify-center text-center text-sm text-faint">
              Tap a dish to start the bill.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => {
                const unitPrice = unitPriceFor(item, customer.customerType);
                return (
                  <li key={item.dishId} className="rounded-lg bg-shell p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ink">{item.name}</p>
                        <p className="text-xs text-muted">
                          {formatMoney(unitPrice, currency)} each
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-sm font-bold text-ink">
                        {formatMoney(unitPrice * item.quantity, currency)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => dispatch(removeItem(item.dishId))}
                        className="text-muted transition hover:text-danger"
                        aria-label={`Remove ${item.name}`}
                      >
                        <RiDeleteBin2Fill size={18} />
                      </button>

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
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Optional customer details */}
        <div className="border-t border-line px-4 py-2">
          <button
            onClick={() => setShowDetails((prev) => !prev)}
            className="w-full text-left text-xs font-semibold text-muted transition hover:text-ink"
          >
            {showDetails ? "− Hide" : "+ Add"} customer name / discount (optional)
          </button>

          {showDetails && (
            <div className="mt-3 space-y-2 pb-2">
              <input
                type="text"
                value={customer.name}
                onChange={(e) => dispatch(setCustomerDetails({ name: e.target.value }))}
                placeholder="Customer name"
                className="w-full rounded-lg bg-shell px-3 py-2 text-sm text-ink outline-none placeholder:text-faint"
              />
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) => dispatch(setCustomerDetails({ phone: e.target.value }))}
                placeholder="Phone (optional)"
                className="w-full rounded-lg bg-shell px-3 py-2 text-sm text-ink outline-none placeholder:text-faint"
              />
              <div className="flex items-center gap-2">
                <label className="shrink-0 text-xs text-muted">Discount</label>
                <input
                  type="number"
                  min="0"
                  value={typedDiscount || ""}
                  onChange={(e) => dispatch(setDiscount(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-lg bg-shell px-3 py-2 text-sm text-ink outline-none placeholder:text-faint"
                />
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-line p-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatMoney(bill.subtotal, currency)}</span>
            </div>

            {bill.discount > 0 && (
              <div className="flex justify-between text-forest">
                <span>Discount</span>
                <span>− {formatMoney(bill.discount, currency)}</span>
              </div>
            )}

            {bill.taxRate > 0 && (
              <div className="flex justify-between text-muted">
                <span>
                  {settings.taxLabel} ({bill.taxRate}%)
                </span>
                <span>{formatMoney(bill.tax, currency)}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-line pt-2 text-lg font-bold text-ink">
              <span>Total</span>
              <span>{formatMoney(bill.total, currency)}</span>
            </div>
          </div>

          {/* How they paid: the cash drawer, the card machine, or a QR scan */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {paymentMethods.map((method) => {
              const isActive = paymentMethod === method.value;
              return (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  aria-pressed={isActive}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-3 text-sm font-semibold transition ${
                    isActive
                      ? `${method.activeClass} text-shell`
                      : "bg-shell text-muted hover:text-ink"
                  }`}
                >
                  {method.icon}
                  {method.label}
                </button>
              );
            })}
          </div>

          {/* Change calculator - only useful for cash */}
          {paymentMethod === "Cash" && items.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="Cash received"
                className="w-full rounded-lg bg-shell px-3 py-2 text-sm text-ink outline-none placeholder:text-faint"
              />
              <div className="whitespace-nowrap text-sm">
                <span className="text-muted">Change </span>
                <span className="font-bold text-mustard-deep">
                  {formatMoney(changeDue, currency)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleSaveBill}
            disabled={items.length === 0 || orderMutation.isPending}
            className="mt-4 w-full rounded-lg bg-terracotta py-3 text-lg font-bold text-shell transition hover:bg-terracotta-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-faint"
          >
            {orderMutation.isPending
              ? "Saving..."
              : `Save Bill · ${formatMoney(bill.total, currency)}`}
          </button>
        </div>
      </aside>

      {completedOrder && (
        <Invoice order={completedOrder} onClose={() => setCompletedOrder(null)} />
      )}
    </>
  );
};

export default CartPanel;
