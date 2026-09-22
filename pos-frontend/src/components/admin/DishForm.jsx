import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { BiSolidDish } from "react-icons/bi";
import { MdPhotoCamera, MdDelete } from "react-icons/md";
import { addDish, updateDish } from "../../https";
import { errorMessage } from "../../https/axiosWrapper";
import { compressImage } from "../../utils";

const emptyForm = {
  name: "",
  description: "",
  category: "",
  priceLocal: "",
  priceForeign: "",
  image: "",
  isAvailable: true,
};

/**
 * Add / edit a dish: one photo and the two prices side by side, so it is
 * obvious that every dish needs both.
 */
const DishForm = ({ dish, categories, onDone }) => {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const currency = useSelector((state) => state.settings.data.currencySymbol);
  const { localLabel, foreignLabel } = useSelector((state) => state.settings.data);

  const [form, setForm] = useState(emptyForm);
  const [imageBusy, setImageBusy] = useState(false);

  useEffect(() => {
    if (dish) {
      setForm({
        name: dish.name,
        description: dish.description || "",
        category: dish.category?._id || dish.category || "",
        priceLocal: String(dish.priceLocal),
        priceForeign: String(dish.priceForeign),
        image: dish.image || "",
        isAvailable: dish.isAvailable,
      });
    } else {
      setForm({ ...emptyForm, category: categories[0]?._id || "" });
    }
  }, [dish, categories]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: (payload) => (dish ? updateDish({ id: dish._id, ...payload }) : addDish(payload)),
    onSuccess: (res) => {
      enqueueSnackbar(res.data.message, { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onDone();
    },
    onError: (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
  });

  const handlePickImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageBusy(true);
    try {
      // Shrunk in the browser so a big phone photo does not have to travel.
      const dataUrl = await compressImage(file);
      setField("image", dataUrl);
    } catch (error) {
      enqueueSnackbar(error.message, { variant: "error" });
    } finally {
      setImageBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.category) {
      enqueueSnackbar("Add a category first, then the dish.", { variant: "warning" });
      return;
    }

    saveMutation.mutate({
      ...form,
      priceLocal: Number(form.priceLocal),
      priceForeign: Number(form.priceForeign),
    });
  };

  const inputClass =
    "w-full rounded-lg bg-[#1f1f1f] px-4 py-3 text-white outline-none placeholder:text-[#6b6b6b] focus:ring-2 focus:ring-[#f6b100]";
  const labelClass = "mb-2 block text-sm font-medium text-[#ababab]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo */}
      <div>
        <span className={labelClass}>Photo (optional)</span>
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#1f1f1f]">
            {form.image ? (
              <img src={form.image} alt="Dish" className="h-full w-full object-cover" />
            ) : (
              <BiSolidDish className="text-3xl text-[#4a4a4a]" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={imageBusy}
              className="flex items-center gap-2 rounded-lg bg-[#2a2a2a] px-4 py-2 text-sm font-semibold text-[#f5f5f5] transition hover:bg-[#333] disabled:opacity-50"
            >
              <MdPhotoCamera size={18} />
              {imageBusy ? "Processing..." : form.image ? "Change photo" : "Choose photo"}
            </button>

            {form.image && (
              <button
                type="button"
                onClick={() => setField("image", "")}
                className="flex items-center gap-2 text-sm text-[#ababab] transition hover:text-red-400"
              >
                <MdDelete size={16} /> Remove photo
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePickImage}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Dish name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="e.g. Chicken Kottu"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Category</label>
        <select
          value={form.category}
          onChange={(e) => setField("category", e.target.value)}
          className={inputClass}
          required
        >
          {categories.length === 0 && <option value="">No categories yet</option>}
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* The two prices */}
      <div className="rounded-lg border border-[#2a2a2a] p-4">
        <p className="mb-3 text-sm font-semibold text-[#f5f5f5]">Prices ({currency})</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-xs font-medium text-[#f6b100]">
              {localLabel || "Local"} price
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.priceLocal}
              onChange={(e) => setField("priceLocal", e.target.value)}
              placeholder="0"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-[#7fbaff]">
              {foreignLabel || "Foreigner"} price
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.priceForeign}
              onChange={(e) => setField("priceForeign", e.target.value)}
              placeholder="0"
              className={inputClass}
              required
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-[#6b6b6b]">
          The cashier switches between these two with one tap while taking the order.
        </p>
      </div>

      <div>
        <label className={labelClass}>Short description (optional)</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="e.g. Served with gravy"
          className={inputClass}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-[#ababab]">
        <input
          type="checkbox"
          checked={form.isAvailable}
          onChange={(e) => setField("isAvailable", e.target.checked)}
          className="h-4 w-4 accent-[#f6b100]"
        />
        Available today (unavailable dishes are hidden from the order screen)
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="flex-1 rounded-lg bg-[#f6b100] py-3 font-bold text-[#1f1f1f] transition hover:bg-[#ffc528] disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving..." : dish ? "Save changes" : "Add dish"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg bg-[#2a2a2a] px-5 py-3 font-semibold text-[#ababab] transition hover:text-[#f5f5f5]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DishForm;
