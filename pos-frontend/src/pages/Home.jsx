import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { MdPointOfSale, MdReceiptLong, MdInsights } from "react-icons/md";
import { BsCashCoin } from "react-icons/bs";
import { getOverview } from "../https";
import { formatMoney, formatTime, greetingFor } from "../utils";
import EmptyState from "../components/shared/EmptyState";
import Invoice from "../components/invoice/Invoice";

const StatCard = ({ label, orders, revenue, currency, accent }) => (
  <div className="rounded-xl bg-[#1a1a1a] p-5">
    <p className="text-sm font-medium text-[#ababab]">{label}</p>
    <p className="mt-2 text-2xl font-bold" style={{ color: accent }}>
      {formatMoney(revenue, currency)}
    </p>
    <p className="mt-1 text-xs text-[#6b6b6b]">
      {orders} bill{orders === 1 ? "" : "s"}
    </p>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const settings = useSelector((state) => state.settings.data);
  const currency = settings.currencySymbol;

  const [clock, setClock] = useState(new Date());
  const [viewingOrder, setViewingOrder] = useState(null);

  useEffect(() => {
    document.title = "POS | Home";
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: res, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: getOverview,
    refetchInterval: 60000,
  });

  const overview = res?.data?.data;
  const recentOrders = overview?.recentOrders ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 md:px-8">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide text-[#f5f5f5]">
            {greetingFor(clock)}, {user.name}
          </h1>
          <p className="mt-1 text-sm text-[#ababab]">{settings.restaurantName}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-wide text-[#f5f5f5]">{formatTime(clock)}</p>
          <p className="text-sm text-[#ababab]">
            {clock.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Primary action */}
      <button
        onClick={() => navigate("/new-order")}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-[#f6b100] py-5 text-xl font-bold text-[#1f1f1f] transition hover:bg-[#ffc528]"
      >
        <MdPointOfSale size={28} /> Start a New Order
      </button>

      {/* Sales at a glance */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {isLoading ? (
          <p className="text-[#ababab]">Loading today&apos;s figures...</p>
        ) : (
          <>
            <StatCard
              label="Today"
              orders={overview?.today.orders ?? 0}
              revenue={overview?.today.revenue ?? 0}
              currency={currency}
              accent="#f6b100"
            />
            <StatCard
              label="This week"
              orders={overview?.week.orders ?? 0}
              revenue={overview?.week.revenue ?? 0}
              currency={currency}
              accent="#02ca3a"
            />
            <StatCard
              label="This month"
              orders={overview?.month.orders ?? 0}
              revenue={overview?.month.revenue ?? 0}
              currency={currency}
              accent="#4d9bff"
            />
          </>
        )}
      </div>

      {/* Shortcuts */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => navigate("/bills")}
          className="flex items-center gap-3 rounded-xl bg-[#1a1a1a] p-4 text-left transition hover:bg-[#262626]"
        >
          <MdReceiptLong size={26} className="text-[#ababab]" />
          <div>
            <p className="font-semibold text-[#f5f5f5]">All Bills</p>
            <p className="text-xs text-[#ababab]">Search and reprint any bill</p>
          </div>
        </button>

        {user.role === "Admin" && (
          <button
            onClick={() => navigate("/reports")}
            className="flex items-center gap-3 rounded-xl bg-[#1a1a1a] p-4 text-left transition hover:bg-[#262626]"
          >
            <MdInsights size={26} className="text-[#ababab]" />
            <div>
              <p className="font-semibold text-[#f5f5f5]">Sales Reports</p>
              <p className="text-xs text-[#ababab]">Daily, weekly and monthly income</p>
            </div>
          </button>
        )}
      </div>

      {/* Latest bills */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-[#f5f5f5]">Latest Bills</h2>
      {recentOrders.length === 0 ? (
        <EmptyState
          icon={<BsCashCoin />}
          title="No bills yet today"
          message="Bills will appear here as soon as the first order is saved."
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-[#1a1a1a]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#262626] text-xs uppercase tracking-wide text-[#ababab]">
              <tr>
                <th className="p-3">Bill</th>
                <th className="p-3">Time</th>
                <th className="hidden p-3 sm:table-cell">Pricing</th>
                <th className="hidden p-3 sm:table-cell">Paid by</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order._id}
                  onClick={() => setViewingOrder(order)}
                  className="cursor-pointer border-t border-[#2a2a2a] text-[#f5f5f5] transition hover:bg-[#262626]"
                >
                  <td className="p-3 font-semibold">#{order.invoiceNo}</td>
                  <td className="p-3 text-[#ababab]">{formatTime(order.createdAt)}</td>
                  <td className="hidden p-3 sm:table-cell">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        order.customerType === "Foreigner"
                          ? "bg-[#12335c] text-[#7fbaff]"
                          : "bg-[#3d3212] text-[#f6b100]"
                      }`}
                    >
                      {order.customerType}
                    </span>
                  </td>
                  <td className="hidden p-3 text-[#ababab] sm:table-cell">
                    {order.paymentMethod}
                  </td>
                  <td className="p-3 text-right font-bold">
                    {formatMoney(order.bills.total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingOrder && (
        <Invoice order={viewingOrder} onClose={() => setViewingOrder(null)} />
      )}
    </section>
  );
};

export default Home;
