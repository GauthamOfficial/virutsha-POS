/**
 * A date box that opens its calendar when you tap anywhere on it, not just on
 * the small icon at the end. On a touchscreen that icon is an awkward target.
 *
 * `color-scheme: light` matters: without it the browser draws the native
 * calendar icon and popup for a dark theme, which is close to invisible
 * against the cream panel.
 */
const DateField = ({ label, value, onChange, className = "" }) => {
  const openPicker = (event) => {
    const input = event.currentTarget.querySelector("input");
    if (!input) return;

    // showPicker is not in every browser, and throws if the click was not
    // treated as a user gesture. Either way the field still types normally.
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  return (
    <label
      onClick={openPicker}
      className={`flex cursor-pointer items-center gap-2 rounded-xl bg-panel px-4 py-3 text-sm text-muted ${className}`}
    >
      {label && <span className="shrink-0">{label}</span>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer bg-transparent text-ink outline-none [color-scheme:light]"
      />
    </label>
  );
};

export default DateField;
