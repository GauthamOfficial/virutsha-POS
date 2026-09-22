import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FaMoneyBillWave, FaCreditCard, FaTrash } from "react-icons/fa";
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
      <aside className="flex h-full flex-col rounded-xl bg-[#1a1a1a]">
        {/* Pricing switch - kept at the top of the bill so it is impossible to miss */}
        <div className="border-b border-[#2a2a2a] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#ababab]">
              Pricing
            </span>
            {items.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-xs text-[#ababab] transition hover:text-red-400"
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
            <p className="flex h-full min-h-[120px] items-center justify-center text-center text-sm text-[#6b6b6b]">
              Tap a dish to start the bill.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => {
                const unitPrice = unitPriceFor(item, customer.customerType);
                return (
                  <li key={item.dishId} className="rounded-lg bg-[#1f1f1f] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#f5f5f5]">{item.name}</p>
                        <p className="text-xs text-[#ababab]">
                          {formatMoney(unitPrice, currency)} each
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-sm font-bold text-[#f5f5f5]">
                        {formatMoney(unitPrice * item.quantity, currency)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => dispatch(removeItem(item.dishId))}
                        className="text-[#ababab] transition hover:text-red-400"
                        aria-label={`Remove ${item.name}`}
                      >
                        <RiDeleteBin2Fill size={18} />
                      </button>

                      <div className="flex items-center gap-4 rounded-lg bg-[#2a2a2a] px-3 py-1">
                        <button
                          onClick={() => dispatch(decreaseQuantity(item.dishId))}
                          className="text-xl font-bold text-[#f6b100]"
                          aria-label="Decrease quantity"
                        >
                          &minus;
                        </button>
                        <span className="min-w-[1.5rem] text-center font-semibold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => dispatch(increaseQuantity(item.dishId))}
                          className="text-xl font-bold text-[#f6b100]"
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
        <div className="border-t border-[#2a2a2a] px-4 py-2">
          <button
            onClick={() => setShowDetails((prev) => !prev)}
            className="w-full text-left text-xs font-semibold text-[#ababab] transition hover:text-[#f5f5f5]"
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
                className="w-full rounded-lg bg-[#1f1f1f] px-3 py-2 text-sm text-white outline-none placeholder:text-[#6b6b6b]"
              />
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) => dispatch(setCustomerDetails({ phone: e.target.value }))}
                placeholder="Phone (optional)"
                className="w-full rounded-lg bg-[#1f1f1f] px-3 py-2 text-sm text-white outline-none placeholder:text-[#6b6b6b]"
              />
              <div className="flex items-center gap-2">
                <label className="shrink-0 text-xs text-[#ababab]">Discount</label>
                <input
                  type="number"
                  min="0"
                  value={typedDiscount || ""}
                  onChange={(e) => dispatch(setDiscount(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-lg bg-[#1f1f1f] px-3 py-2 text-sm text-white outline-none placeholder:text-[#6b6b6b]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-[#2a2a2a] p-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-[#ababab]">
              <span>Subtotal</span>
              <span>{formatMoney(bill.subtotal, currency)}</span>
            </div>

            {bill.discount > 0 && (
              <div className="flex justify-between text-[#02ca3a]">
                <span>Discount</span>
                <span>− {formatMoney(bill.discount, currency)}</span>
              </div>
            )}

            {bill.taxRate > 0 && (
              <div className="flex justify-between text-[#ababab]">
                <span>
                  {settings.taxLabel} ({bill.taxRate}%)
                </span>
                <span>{formatMoney(bill.tax, currency)}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-[#2a2a2a] pt-2 text-lg font-bold text-[#f5f5f5]">
              <span>Total</span>
              <span>{formatMoney(bill.total, currency)}</span>
            </div>
          </div>

          {/* Payment method - cash drawer or the card machine */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod("Cash")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                paymentMethod === "Cash"
                  ? "bg-[#02ca3a] text-[#0d2a13]"
                  : "bg-[#1f1f1f] text-[#ababab] hover:text-[#f5f5f5]"
              }`}
            >
              <FaMoneyBillWave /> Cash
            </button>
            <button
              onClick={() => setPaymentMethod("Card")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                paymentMethod === "Card"
                  ? "bg-[#025cca] text-white"
                  : "bg-[#1f1f1f] text-[#ababab] hover:text-[#f5f5f5]"
              }`}
            >
              <FaCreditCard /> Card
            </button>
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
                className="w-full rounded-lg bg-[#1f1f1f] px-3 py-2 text-sm text-white outline-none placeholder:text-[#6b6b6b]"
              />
              <div className="whitespace-nowrap text-sm">
                <span className="text-[#ababab]">Change </span>
                <span className="font-bold text-[#f6b100]">
                  {formatMoney(changeDue, currency)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleSaveBill}
            disabled={items.length === 0 || orderMutation.isPending}
            className="mt-4 w-full rounded-lg bg-[#f6b100] py-3 text-lg font-bold text-[#1f1f1f] transition hover:bg-[#ffc528] disabled:cursor-not-allowed disabled:bg-[#3a3a3a] disabled:text-[#6b6b6b]"
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
