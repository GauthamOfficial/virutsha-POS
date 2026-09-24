import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { FaSearch, FaPrint, FaBan } from "react-icons/fa";
import { MdReceiptLong } from "react-icons/md";
import { getOrders, voidOrder } from "../https";
import { errorMessage } from "../https/axiosWrapper";
import { formatMoney, formatDateAndTime, todayISO, paymentLabel } from "../utils";
import PageHeading from "../components/shared/PageHeading";
import EmptyState from "../components/shared/EmptyState";
import Invoice from "../components/invoice/Invoice";
import Modal from "../components/shared/Modal";
import DateField from "../components/shared/DateField";

const Bills = () => {
  const isAdmin = useSelector((state) => state.user.role === "Admin");
  const currency = useSelector((state) => state.settings.data.currencySymbol);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [page, setPage] = useState(1);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState("");

  useEffect(() => {
    document.title = "POS | Bills";
  }, []);

  const { data: res, isLoading } = useQuery({
    queryKey: ["orders", { search, from, to, page }],
    queryFn: () =>
      getOrders({
        search: search || undefined,
        from: from ? `${from}T00:00:00.000` : undefined,
        to: to ? `${to}T23:59:59.999` : undefined,
        page,
        limit: 25,
      }),
    placeholderData: keepPreviousData,
  });

  const orders = res?.data?.data ?? [];
  const meta = res?.data?.meta;

  const voidMutation = useMutation({
    mutationFn: voidOrder,
    onSuccess: () => {
      enqueueSnackbar("Bill voided.", { variant: "success" });
      setVoidTarget(null);
      setVoidReason("");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
  });

  const resetToToday = () => {
    setFrom(todayISO());
    setTo(todayISO());
    setSearch("");
    setPage(1);
  };

  return (
    <section className="mx-auto max-w-6xl pb-10">
      <PageHeading title="Bills" subtitle="Every bill that has been saved. Tap one to reprint it.">
        <button
          onClick={resetToToday}
          className="rounded-lg bg-panel px-4 py-2 text-sm font-semibold text-muted transition hover:text-ink"
        >
          Today
        </button>
      </PageHeading>

      {/* Filters */}
      <div className="grid gap-3 px-4 md:grid-cols-[2fr_1fr_1fr] md:px-8">
        <div className="flex items-center gap-3 rounded-xl bg-panel px-4 py-3">
          <FaSearch className="text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Bill number, customer name or phone"
            className="w-full bg-transparent text-ink outline-none placeholder:text-faint"
          />
        </div>

        <DateField
          label="From"
          value={from}
          onChange={(next) => {
            setFrom(next);
            setPage(1);
          }}
        />

        <DateField
          label="To"
          value={to}
          onChange={(next) => {
            setTo(next);
            setPage(1);
          }}
        />
      </div>

      {/* Results */}
      <div className="mt-4 px-4 md:px-8">
        {isLoading ? (
          <p className="py-10 text-center text-muted">Loading bills...</p>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<MdReceiptLong />}
            title="No bills found"
            message="Try widening the date range or clearing the search."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl bg-panel">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-raised text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">Bill</th>
                  <th className="p-3">Date &amp; time</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Pricing</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Paid by</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className={`border-t border-line transition hover:bg-raised ${
                      order.isVoided ? "opacity-50" : ""
                    }`}
                  >
                    <td className="p-3 font-semibold text-ink">
                      #{order.invoiceNo}
                      {order.isVoided && (
                        <span className="ml-2 rounded bg-danger px-1.5 py-0.5 text-[10px] font-bold text-shell">
                          VOID
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-muted">{formatDateAndTime(order.createdAt)}</td>
                    <td className="p-3 text-ink">{order.customerDetails?.name}</td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          order.customerType === "Foreigner"
                            ? "bg-forest-soft text-forest"
                            : "bg-mustard-soft text-mustard-deep"
                        }`}
                      >
                        {order.customerType}
                      </span>
                    </td>
                    <td className="p-3 text-muted">{order.items.length}</td>
                    <td className="p-3 text-muted">{paymentLabel(order.paymentMethod)}</td>
                    <td className="p-3 text-right font-bold text-ink">
                      {formatMoney(order.bills.total, currency)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingOrder(order)}
                          title="View and reprint"
                          className="rounded-lg bg-raised p-2 text-muted transition hover:text-ink"
                        >
                          <FaPrint size={14} />
                        </button>
                        {isAdmin && !order.isVoided && (
                          <button
                            onClick={() => setVoidTarget(order)}
                            title="Void this bill"
                            className="rounded-lg bg-raised p-2 text-muted transition hover:text-danger"
                          >
                            <FaBan size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paging */}
        {meta && meta.pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg bg-panel px-4 py-2 text-sm text-muted disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-muted">
              Page {meta.page} of {meta.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={page >= meta.pages}
              className="rounded-lg bg-panel px-4 py-2 text-sm text-muted disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {viewingOrder && <Invoice order={viewingOrder} onClose={() => setViewingOrder(null)} />}

      <Modal
        isOpen={Boolean(voidTarget)}
        onClose={() => setVoidTarget(null)}
        title={`Void bill #${voidTarget?.invoiceNo}`}
      >
        <p className="text-sm text-muted">
          The bill stays on record but stops counting towards sales. This cannot be undone.
        </p>
        <input
          type="text"
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          placeholder="Reason (optional)"
          className="mt-4 w-full rounded-lg bg-shell px-4 py-3 text-ink outline-none placeholder:text-faint"
        />
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => voidMutation.mutate({ id: voidTarget._id, reason: voidReason })}
            disabled={voidMutation.isPending}
            className="flex-1 rounded-lg bg-danger py-3 font-semibold text-white transition hover:bg-danger/90 disabled:opacity-50"
          >
            {voidMutation.isPending ? "Voiding..." : "Void bill"}
          </button>
          <button
            onClick={() => setVoidTarget(null)}
            className="rounded-lg bg-raised px-5 py-3 font-semibold text-muted"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </section>
  );
};

export default Bills;
