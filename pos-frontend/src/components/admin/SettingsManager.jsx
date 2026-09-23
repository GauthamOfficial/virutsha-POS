import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { updateSettings } from "../../https";
import { errorMessage } from "../../https/axiosWrapper";
import { setSettings } from "../../redux/slices/settingsSlice";

const Field = ({ label, hint, children }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-muted">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
  </div>
);

const SettingsManager = () => {
  const dispatch = useDispatch();
  const current = useSelector((state) => state.settings.data);
  const [form, setForm] = useState(current);

  useEffect(() => {
    setForm(current);
  }, [current]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (res) => {
      dispatch(setSettings(res.data.data));
      enqueueSnackbar("Settings saved.", { variant: "success" });
    },
    onError: (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
  });

  const inputClass =
    "w-full rounded-lg bg-shell px-4 py-3 text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-terracotta";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate(form);
      }}
      className="max-w-2xl space-y-6"
    >
      {/* Receipt header */}
      <div className="rounded-xl bg-panel p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          What prints on the bill
        </h3>
        <div className="space-y-4">
          <Field label="Restaurant name">
            <input
              type="text"
              value={form.restaurantName}
              onChange={(e) => setField("restaurantName", e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Address">
            <input
              type="text"
              value={form.addressLine}
              onChange={(e) => setField("addressLine", e.target.value)}
              placeholder="e.g. 42 Galle Road, Unawatuna"
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="e.g. 091 223 4567"
              className={inputClass}
            />
          </Field>
          <Field label="Footer message">
            <input
              type="text"
              value={form.receiptFooter}
              onChange={(e) => setField("receiptFooter", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* Pricing labels */}
      <div className="rounded-xl bg-panel p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Two-price labels
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name for the lower price list">
            <input
              type="text"
              value={form.localLabel}
              onChange={(e) => setField("localLabel", e.target.value)}
              placeholder="Local"
              className={inputClass}
            />
          </Field>
          <Field label="Name for the higher price list">
            <input
              type="text"
              value={form.foreignLabel}
              onChange={(e) => setField("foreignLabel", e.target.value)}
              placeholder="Foreigner"
              className={inputClass}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-faint">
          These are the words on the switch the cashier taps and on the printed bill.
        </p>
      </div>

      {/* Money */}
      <div className="rounded-xl bg-panel p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Money
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Currency symbol" hint="Shown before every amount.">
            <input
              type="text"
              value={form.currencySymbol}
              onChange={(e) => setField("currencySymbol", e.target.value)}
              placeholder="Rs"
              className={inputClass}
            />
          </Field>
          <Field label="Currency code">
            <input
              type="text"
              value={form.currencyCode}
              onChange={(e) => setField("currencyCode", e.target.value)}
              placeholder="LKR"
              className={inputClass}
            />
          </Field>
          <Field
            label="Tax / service charge (%)"
            hint="Leave at 0 to print no tax line at all."
          >
            <input
              type="number"
              min="0"
              step="any"
              value={form.taxRate}
              onChange={(e) => setField("taxRate", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Name for that charge">
            <input
              type="text"
              value={form.taxLabel}
              onChange={(e) => setField("taxLabel", e.target.value)}
              placeholder="Service Charge"
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <button
        type="submit"
        disabled={saveMutation.isPending}
        className="rounded-lg bg-terracotta px-8 py-3 font-bold text-shell transition hover:bg-terracotta-deep disabled:opacity-50"
      >
        {saveMutation.isPending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
};

export default SettingsManager;
