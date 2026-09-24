import { useRef } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { FaCheck, FaPrint } from "react-icons/fa6";
import { formatMoney, formatDateAndTime, paymentLabel } from "../../utils";

/**
 * The printable bill. Laid out for an 80mm thermal roll, but it prints fine on
 * A4 too - the receipt just sits at the top of the page.
 */
const Invoice = ({ order, onClose }) => {
  const receiptRef = useRef(null);
  const settings = useSelector((state) => state.settings.data);
  const currency = settings.currencySymbol;

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=380,height=700");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Bill #${order.invoiceNo}</title>
    <style>
      @page { size: 80mm auto; margin: 4mm; }
      * { box-sizing: border-box; }
      body {
        font-family: "Courier New", monospace;
        font-size: 12px;
        color: #000;
        margin: 0;
        padding: 4px;
        width: 72mm;
      }
      h1 { font-size: 16px; text-align: center; margin: 0 0 2px; }
      .center { text-align: center; }
      .muted { color: #333; font-size: 11px; }
      .divider { border-top: 1px dashed #000; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 2px 0; vertical-align: top; }
      .right { text-align: right; white-space: nowrap; }
      .total-row td { font-size: 14px; font-weight: bold; padding-top: 4px; }
      /* Both numbers on one line. A touch smaller than the address so the
         whole thing clears 72mm without wrapping mid-number. */
      .phone-line { color: #333; font-size: 10px; white-space: nowrap; margin: 0; }
      .services-title { font-size: 11px; font-weight: bold; margin: 0 0 1px; }
      .services-body { font-size: 11px; margin: 0; }
      /* Deliberately a step larger than the lines above it. */
      .footer-note { font-size: 14px; font-weight: bold; margin: 6px 0 0; }
      .badge {
        display: inline-block;
        border: 1px solid #000;
        padding: 1px 6px;
        font-size: 11px;
        margin-top: 4px;
      }
    </style>
  </head>
  <body>${receiptRef.current.innerHTML}</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();

    // Give the browser a moment to lay the page out before printing.
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-4 shadow-xl scrollbar-hide"
      >
        <div className="mb-3 flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 160 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 shadow"
          >
            <FaCheck className="text-2xl text-white" />
          </motion.div>
        </div>

        {/* Everything inside this div is what gets printed */}
        <div ref={receiptRef} className="font-mono text-[13px] text-black">
          <h1 className="text-center text-base font-bold">
            {settings.restaurantName || "Restaurant"}
          </h1>
          {settings.addressLine && (
            <p className="center muted text-center text-[11px]">{settings.addressLine}</p>
          )}
          {settings.phone && (
            <p className="center phone-line text-center text-[11px]">
              Tel: {settings.phone}
            </p>
          )}

          <div className="divider my-2 border-t border-dashed border-black" />

          <table className="w-full">
            <tbody>
              <tr>
                <td>Bill No</td>
                <td className="right text-right font-bold">#{order.invoiceNo}</td>
              </tr>
              <tr>
                <td>Date</td>
                <td className="right text-right">{formatDateAndTime(order.createdAt)}</td>
              </tr>
              {order.customerDetails?.name && order.customerDetails.name !== "Walk-in" && (
                <tr>
                  <td>Customer</td>
                  <td className="right text-right">{order.customerDetails.name}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="divider my-2 border-t border-dashed border-black" />

          <table className="w-full">
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    {item.name}
                    <br />
                    <span className="muted text-[11px]">
                      {item.quantity} x {formatMoney(item.unitPrice, currency)}
                    </span>
                    {item.discountPercent > 0 && (
                      <>
                        <br />
                        <span className="muted text-[11px]">
                          less {item.discountPercent}%
                        </span>
                      </>
                    )}
                  </td>
                  <td className="right text-right align-bottom">
                    {item.discountPercent > 0 && (
                      <>
                        <span className="muted text-[11px]">
                          {formatMoney(item.grossAmount, currency)}
                        </span>
                        <br />
                      </>
                    )}
                    {formatMoney(item.amount, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divider my-2 border-t border-dashed border-black" />

          <table className="w-full">
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td className="right text-right">{formatMoney(order.bills.subtotal, currency)}</td>
              </tr>

              {order.bills.itemDiscount > 0 && (
                <tr>
                  <td>Item discounts</td>
                  <td className="right text-right">
                    − {formatMoney(order.bills.itemDiscount, currency)}
                  </td>
                </tr>
              )}

              {order.bills.discount > 0 && (
                <tr>
                  <td>Bill discount</td>
                  <td className="right text-right">
                    − {formatMoney(order.bills.discount, currency)}
                  </td>
                </tr>
              )}

              {order.bills.tax > 0 && (
                <tr>
                  <td>
                    {settings.taxLabel} ({order.bills.taxRate}%)
                  </td>
                  <td className="right text-right">{formatMoney(order.bills.tax, currency)}</td>
                </tr>
              )}

              <tr className="total-row">
                <td className="pt-1 text-[15px] font-bold">TOTAL</td>
                <td className="right pt-1 text-right text-[15px] font-bold">
                  {formatMoney(order.bills.total, currency)}
                </td>
              </tr>

              <tr>
                <td>Paid by</td>
                <td className="right text-right">{paymentLabel(order.paymentMethod)}</td>
              </tr>

              {order.paymentMethod === "Cash" && order.changeGiven > 0 && (
                <>
                  <tr>
                    <td>Cash</td>
                    <td className="right text-right">
                      {formatMoney(order.amountPaid, currency)}
                    </td>
                  </tr>
                  <tr>
                    <td>Change</td>
                    <td className="right text-right">
                      {formatMoney(order.changeGiven, currency)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          <div className="divider my-2 border-t border-dashed border-black" />

          {settings.otherServices && (
            <div className="services mb-2">
              <p className="center services-title text-center text-[11px] font-bold">
                {settings.otherServicesTitle || "Our Other Services"}
              </p>
              <p className="center services-body text-center text-[11px]">
                {settings.otherServices}
              </p>
            </div>
          )}

          <p className="center footer-note text-center text-[13px] font-bold">
            {settings.receiptFooter}
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-terracotta py-3 font-semibold text-white transition hover:bg-terracotta-deep"
          >
            <FaPrint /> Print Bill
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Invoice;
