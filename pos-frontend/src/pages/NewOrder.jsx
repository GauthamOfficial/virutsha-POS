import { useEffect } from "react";
import { useSelector } from "react-redux";
import MenuGrid from "../components/order/MenuGrid";
import CartPanel from "../components/order/CartPanel";
import CustomerTypeToggle from "../components/order/CustomerTypeToggle";
import { selectCartCount } from "../redux/slices/cartSlice";

const NewOrder = () => {
  const cartCount = useSelector(selectCartCount);
  const customerType = useSelector((state) => state.customer.customerType);
  const { localLabel, foreignLabel } = useSelector((state) => state.settings.data);

  useEffect(() => {
    document.title = "POS | New Order";
  }, []);

  const activeLabel =
    customerType === "Foreigner" ? foreignLabel || "Foreigner" : localLabel || "Local";

  return (
    <section className="flex min-h-[calc(100vh-4.5rem)] flex-col lg:h-[calc(100vh-4.5rem)] lg:flex-row lg:overflow-hidden">
      {/* Menu side */}
      <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-1 pt-5 md:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-wide text-[#f5f5f5]">New Order</h1>
            <p className="mt-1 text-sm text-[#ababab]">
              Showing <span className="font-semibold text-[#f6b100]">{activeLabel}</span> prices
            </p>
          </div>

          {/* The same switch as in the bill panel, so it is reachable from
              wherever the cashier happens to be looking. */}
          <CustomerTypeToggle />
        </div>

        <div className="flex-1 lg:overflow-hidden">
          <MenuGrid />
        </div>
      </div>

      {/* Bill side */}
      <div className="w-full shrink-0 border-t border-[#2a2a2a] p-3 lg:w-[380px] lg:border-l lg:border-t-0 lg:py-4 lg:pr-4">
        <div className="lg:h-full">
          <CartPanel />
        </div>
      </div>

      {/* Running count for small screens, where the bill sits below the menu */}
      {cartCount > 0 && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[#f6b100] px-5 py-2 text-sm font-bold text-[#1f1f1f] shadow-lg lg:hidden">
          {cartCount} item{cartCount > 1 ? "s" : ""} in bill
        </div>
      )}
    </section>
  );
};

export default NewOrder;
