import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MdInsights, MdFileDownload } from "react-icons/md";
import { getSalesReport } from "../https";
import { formatMoney, formatDate, todayISO } from "../utils";
import PageHeading from "../components/shared/PageHeading";
import EmptyState from "../components/shared/EmptyState";
import SalesChart from "../components/reports/SalesChart";

const periods = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" },
];

const Figure = ({ label, value, hint, accent = "#f5f5f5" }) => (
  <div className="rounded-xl bg-[#1a1a1a] p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-[#ababab]">{label}</p>
    <p className="mt-2 text-2xl font-bold" style={{ color: accent }}>
      {value}
    </p>
    {hint && <p className="mt-1 text-xs text-[#6b6b6b]">{hint}</p>}
  </div>
);

const SplitRow = ({ label, orders, revenue, total, currency, color }) => {
  const share = total > 0 ? Math.round((revenue / total) * 100) : 0;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[#f5f5f5]">{label}</span>
        <span className="text-[#ababab]">
          {orders} bill{orders === 1 ? "" : "s"} ·{" "}
          <span className="font-semibold text-[#f5f5f5]">
            {formatMoney(revenue, currency)}
          </span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#2a2a2a]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${share}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

const Reports = () => {
  const currency = useSelector((state) => state.settings.data.currencySymbol);
  const shopName = useSelector((state) => state.settings.data.restaurantName);

  const [period, setPeriod] = useState("daily");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());

  useEffect(() => {
    document.title = "POS | Sales Reports";
  }, []);

  const { data: res, isLoading } = useQuery({
    queryKey: ["sales", { period, from, to }],
    queryFn: () =>
      getSalesReport(period === "custom" ? { period, from, to } : { period }),
    placeholderData: keepPreviousData,
  });

  const report = res?.data?.data;
  const totals = report?.totals;

  // A plain CSV so the figures can be opened in Excel or handed to an accountant.
  const downloadCsv = () => {
    if (!report) return;

    const rows = [
      [shopName],
      [`Sales report: ${report.range.label}`],
      [`${formatDate(report.range.from)} to ${formatDate(report.range.to)}`],
      [],
      ["Bills", totals.orders],
      ["Items sold", totals.itemsSold],
      ["Subtotal", totals.subtotal],
      ["Discounts", totals.discount],
      ["Tax", totals.tax],
      ["Total income", totals.revenue],
      ["Average bill", totals.averageBill],
      [],
      ["Payment", "Bills", "Income"],
      ["Cash", report.byPayment.Cash.orders, report.byPayment.Cash.revenue],
      ["Card", report.byPayment.Card.orders, report.byPayment.Card.revenue],
      [],
      ["Price list", "Bills", "Income"],
      ["Local", report.byCustomerType.Local.orders, report.byCustomerType.Local.revenue],
      [
        "Foreigner",
        report.byCustomerType.Foreigner.orders,
        report.byCustomerType.Foreigner.revenue,
      ],
      [],
      ["Period", "Bills", "Income"],
      ...report.series.map((s) => [s.label, s.orders, s.revenue]),
      [],
      ["Top dishes", "Quantity", "Income"],
      ...report.topDishes.map((d) => [d.name, d.quantity, d.revenue]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-${period}-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mx-auto max-w-6xl pb-10">
      <PageHeading
        title="Sales Reports"
        subtitle={report ? `${formatDate(report.range.from)} — ${formatDate(report.range.to)}` : ""}
      >
        <button
          onClick={downloadCsv}
          disabled={!report || totals?.orders === 0}
          className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-[#ababab] transition hover:text-[#f5f5f5] disabled:opacity-40"
        >
          <MdFileDownload size={18} /> Export CSV
        </button>
      </PageHeading>

      {/* Period picker */}
      <div className="flex flex-wrap items-center gap-2 px-4 md:px-8">
        {periods.map((option) => (
          <button
            key={option.value}
            onClick={() => setPeriod(option.value)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              period === option.value
                ? "bg-[#f6b100] text-[#1f1f1f]"
                : "bg-[#1a1a1a] text-[#ababab] hover:text-[#f5f5f5]"
            }`}
          >
            {option.label}
          </button>
        ))}

        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-sm text-[#f5f5f5] outline-none [color-scheme:dark]"
            />
            <span className="text-[#ababab]">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-sm text-[#f5f5f5] outline-none [color-scheme:dark]"
            />
          </div>
        )}
      </div>

      <div className="mt-5 px-4 md:px-8">
        {isLoading || !report ? (
          <p className="py-10 text-center text-[#ababab]">Working out the figures...</p>
        ) : totals.orders === 0 ? (
          <EmptyState
            icon={<MdInsights />}
            title="No sales in this period"
            message="Pick a different period, or save a bill to see figures here."
          />
        ) : (
          <>
            {/* Headline figures */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Figure
                label="Total income"
                value={formatMoney(totals.revenue, currency)}
                hint={report.range.label}
                accent="#f6b100"
              />
              <Figure label="Bills" value={totals.orders} hint={`${totals.itemsSold} items sold`} />
              <Figure
                label="Average bill"
                value={formatMoney(totals.averageBill, currency)}
                accent="#02ca3a"
              />
              <Figure
                label="Discounts given"
                value={formatMoney(totals.discount, currency)}
                hint={totals.tax > 0 ? `Tax ${formatMoney(totals.tax, currency)}` : undefined}
                accent="#ff7a7a"
              />
            </div>

            {/* Trend */}
            <div className="mt-4 rounded-xl bg-[#1a1a1a] p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#ababab]">
                Income over time
              </h3>
              <SalesChart series={report.series} currency={currency} />
            </div>

            {/* Splits */}
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl bg-[#1a1a1a] p-4">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#ababab]">
                  Local vs Foreigner
                </h3>
                <SplitRow
                  label="Local"
                  {...report.byCustomerType.Local}
                  total={totals.revenue}
                  currency={currency}
                  color="#f6b100"
                />
                <SplitRow
                  label="Foreigner"
                  {...report.byCustomerType.Foreigner}
                  total={totals.revenue}
                  currency={currency}
                  color="#4d9bff"
                />
              </div>

              <div className="rounded-xl bg-[#1a1a1a] p-4">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#ababab]">
                  Cash vs Card
                </h3>
                <SplitRow
                  label="Cash"
                  {...report.byPayment.Cash}
                  total={totals.revenue}
                  currency={currency}
                  color="#02ca3a"
                />
                <SplitRow
                  label="Card"
                  {...report.byPayment.Card}
                  total={totals.revenue}
                  currency={currency}
                  color="#025cca"
                />
              </div>
            </div>

            {/* Best sellers */}
            <div className="mt-4 overflow-hidden rounded-xl bg-[#1a1a1a]">
              <h3 className="px-4 pb-2 pt-4 text-sm font-semibold uppercase tracking-wide text-[#ababab]">
                Best selling dishes
              </h3>
              <table className="w-full text-left text-sm">
                <thead className="bg-[#262626] text-xs uppercase tracking-wide text-[#ababab]">
                  <tr>
                    <th className="p-3">Dish</th>
                    <th className="p-3 text-right">Sold</th>
                    <th className="p-3 text-right">Income</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topDishes.map((dish) => (
                    <tr key={dish.name} className="border-t border-[#2a2a2a] text-[#f5f5f5]">
                      <td className="p-3">{dish.name}</td>
                      <td className="p-3 text-right text-[#ababab]">{dish.quantity}</td>
                      <td className="p-3 text-right font-semibold">
                        {formatMoney(dish.revenue, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Reports;
