import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { BiSolidDish } from "react-icons/bi";
import { FaPlus, FaSearch } from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";
import { getCategories, getDishes, deleteDish } from "../../https";
import { errorMessage } from "../../https/axiosWrapper";
import { formatMoney } from "../../utils";
import Modal from "../shared/Modal";
import EmptyState from "../shared/EmptyState";
import DishForm from "./DishForm";

const DishManager = () => {
  const queryClient = useQueryClient();
  const currency = useSelector((state) => state.settings.data.currencySymbol);
  const { localLabel, foreignLabel } = useSelector((state) => state.settings.data);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editing, setEditing] = useState(null); // dish object, or "new"
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: categoryRes } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: dishRes, isLoading } = useQuery({ queryKey: ["dishes"], queryFn: () => getDishes() });

  const categories = categoryRes?.data?.data ?? [];
  const dishes = useMemo(() => dishRes?.data?.data ?? [], [dishRes]);

  const visibleDishes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return dishes.filter((dish) => {
      const matchesCategory =
        categoryFilter === "all" || String(dish.category?._id) === categoryFilter;
      const matchesSearch = !term || dish.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [dishes, search, categoryFilter]);

  const deleteMutation = useMutation({
    mutationFn: deleteDish,
    onSuccess: () => {
      enqueueSnackbar("Dish deleted.", { variant: "success" });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[200px] flex-1 items-center gap-3 rounded-xl bg-panel px-4 py-3">
          <FaSearch className="text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes"
            className="w-full bg-transparent text-ink outline-none placeholder:text-faint"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl bg-panel px-4 py-3 text-sm text-ink outline-none"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-xl bg-terracotta px-5 py-3 font-bold text-shell transition hover:bg-terracotta-deep"
        >
          <FaPlus size={14} /> Add Dish
        </button>
      </div>

      {/* List */}
      <div className="mt-4">
        {isLoading ? (
          <p className="py-10 text-center text-muted">Loading dishes...</p>
        ) : visibleDishes.length === 0 ? (
          <EmptyState
            icon={<BiSolidDish />}
            title={dishes.length === 0 ? "No dishes yet" : "Nothing matches"}
            message={
              dishes.length === 0
                ? "Add your first dish with a photo and both prices."
                : "Try a different search or category."
            }
            action={
              dishes.length === 0 && (
                <button
                  onClick={() => setEditing("new")}
                  className="mt-2 rounded-lg bg-terracotta px-5 py-2.5 font-bold text-shell"
                >
                  Add the first dish
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl bg-panel">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-raised text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">Dish</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">{localLabel || "Local"}</th>
                  <th className="p-3 text-right">{foreignLabel || "Foreigner"}</th>
                  <th className="p-3 text-center">Available</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDishes.map((dish) => (
                  <tr key={dish._id} className="border-t border-line">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-raised">
                          {dish.image ? (
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <BiSolidDish className="text-faint" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{dish.name}</p>
                          {dish.description && (
                            <p className="text-xs text-faint">{dish.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted">{dish.category?.name}</td>
                    <td className="p-3 text-right font-semibold text-mustard-deep">
                      {formatMoney(dish.priceLocal, currency)}
                    </td>
                    <td className="p-3 text-right font-semibold text-forest">
                      {formatMoney(dish.priceForeign, currency)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          dish.isAvailable
                            ? "bg-forest-soft text-forest"
                            : "bg-danger-soft text-danger"
                        }`}
                      >
                        {dish.isAvailable ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditing(dish)}
                          title="Edit"
                          className="rounded-lg bg-raised p-2 text-muted transition hover:text-ink"
                        >
                          <MdEdit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(dish)}
                          title="Delete"
                          className="rounded-lg bg-raised p-2 text-muted transition hover:text-danger"
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add Dish" : "Edit Dish"}
      >
        <DishForm
          dish={editing === "new" ? null : editing}
          categories={categories}
          onDone={() => setEditing(null)}
        />
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete dish"
      >
        <p className="text-sm text-muted">
          Delete <span className="font-semibold text-ink">{deleteTarget?.name}</span>? Past
          bills keep their record of it.
        </p>
        <p className="mt-2 text-xs text-faint">
          To hide it only for today, edit the dish and untick &ldquo;Available&rdquo; instead.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => deleteMutation.mutate(deleteTarget._id)}
            disabled={deleteMutation.isPending}
            className="flex-1 rounded-lg bg-danger py-3 font-semibold text-white transition hover:bg-danger/90 disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg bg-raised px-5 py-3 font-semibold text-muted"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DishManager;
