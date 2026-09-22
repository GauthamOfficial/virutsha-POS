import { useMemo, useState } from "react";
import { formatMoney } from "../../utils";

// One series, so no legend is needed - the heading above the chart names it.
// This amber sits in the dark-mode lightness band and clears 3:1 against the
// #1a1a1a card, unlike the brighter #f6b100 used for buttons.
const SERIES_COLOR = "#b88100";
const SURFACE = "#1a1a1a";

// Round the axis top up to a clean number so the ticks read 0 / 5,000 / 10,000.
const niceCeiling = (value) => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  return magnitude * (steps.find((step) => value <= magnitude * step) ?? 10);
};

const SalesChart = ({ series = [], currency = "Rs" }) => {
  const [hovered, setHovered] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const { max, ticks, peakIndex } = useMemo(() => {
    const values = series.map((point) => point.revenue);
    const highest = Math.max(0, ...values);
    const ceiling = niceCeiling(highest);

    return {
      max: ceiling,
      ticks: [0, ceiling / 2, ceiling],
      peakIndex: highest > 0 ? values.indexOf(highest) : -1,
    };
  }, [series]);

  if (series.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setShowTable((prev) => !prev)}
          className="text-xs font-semibold text-[#ababab] underline-offset-2 transition hover:text-[#f5f5f5] hover:underline"
        >
          {showTable ? "Show chart" : "Show as table"}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-72 overflow-y-auto scrollbar-hide">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#1a1a1a] text-xs uppercase tracking-wide text-[#ababab]">
              <tr>
                <th className="py-2">Period</th>
                <th className="py-2 text-right">Bills</th>
                <th className="py-2 text-right">Income</th>
              </tr>
            </thead>
            <tbody>
              {series.map((point) => (
                <tr key={point.key} className="border-t border-[#2a2a2a] text-[#f5f5f5]">
                  <td className="py-2">{point.label}</td>
                  <td className="py-2 text-right text-[#ababab]">{point.orders}</td>
                  <td className="py-2 text-right font-semibold">
                    {formatMoney(point.revenue, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-3">
          {/* Y axis */}
          <div className="flex h-56 w-16 shrink-0 flex-col justify-between py-0 text-right text-[11px] text-[#6b6b6b]">
            {[...ticks].reverse().map((tick) => (
              <span key={tick}>{Math.round(tick).toLocaleString("en-LK")}</span>
            ))}
          </div>

          {/* Plot */}
          <div className="relative min-w-0 flex-1">
            {/* Recessive hairline gridlines */}
            <div className="pointer-events-none absolute inset-0 flex h-56 flex-col justify-between">
              {ticks.map((tick) => (
                <div key={tick} className="h-px w-full bg-[#2f2f2f]" />
              ))}
            </div>

            {/* Columns. gap-[2px] is the surface gap that separates neighbours. */}
            <div className="relative flex h-56 items-end gap-[2px]">
              {series.map((point, index) => {
                const heightPct = max > 0 ? (point.revenue / max) * 100 : 0;
                const isHovered = hovered === index;

                return (
                  <div
                    key={point.key}
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    className="group relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center"
                  >
                    {/* Peak gets a direct label; the rest rely on the axis and tooltip. */}
                    {index === peakIndex && point.revenue > 0 && (
                      <span
                        className="pointer-events-none absolute whitespace-nowrap text-[10px] font-semibold text-[#ababab]"
                        style={{ bottom: `calc(${heightPct}% + 4px)` }}
                      >
                        {formatMoney(point.revenue, currency)}
                      </span>
                    )}

                    <div
                      className="w-full max-w-[24px] rounded-t transition-opacity"
                      style={{
                        height: `${heightPct}%`,
                        minHeight: point.revenue > 0 ? "2px" : "0",
                        backgroundColor: SERIES_COLOR,
                        opacity: hovered === null || isHovered ? 1 : 0.45,
                      }}
                    />

                    {/* Tooltip */}
                    {isHovered && (
                      <div
                        className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs shadow-lg"
                        style={{ backgroundColor: "#2a2a2a", border: `1px solid ${SURFACE}` }}
                      >
                        <p className="font-semibold text-[#f5f5f5]">{point.label}</p>
                        <p className="text-[#ababab]">
                          {formatMoney(point.revenue, currency)}
                        </p>
                        <p className="text-[#6b6b6b]">
                          {point.orders} bill{point.orders === 1 ? "" : "s"}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* X axis. Labels thin out when there are too many to read. */}
            <div className="mt-2 flex gap-[2px]">
              {series.map((point, index) => {
                const step = Math.ceil(series.length / 12);
                const show = index % step === 0;

                return (
                  <span
                    key={point.key}
                    className="min-w-0 flex-1 truncate text-center text-[10px] text-[#6b6b6b]"
                  >
                    {show ? point.label : ""}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesChart;
