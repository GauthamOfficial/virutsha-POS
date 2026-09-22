import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { FaPlus } from "react-icons/fa";
import { MdEdit, MdDelete, MdCategory } from "react-icons/md";
import { getCategories, addCategory, updateCategory, deleteCategory } from "../../https";
import { errorMessage } from "../../https/axiosWrapper";
import Modal from "../shared/Modal";
import EmptyState from "../shared/EmptyState";

const colorChoices = [
  "#b73e3e", "#5b45b0", "#7f167f", "#735f32",
  "#1d2569", "#285430", "#025cca", "#8a5a1f",
];

const iconChoices = ["🍛", "🍚", "🥘", "🍜", "🥟", "🍢", "🍹", "☕", "🍰", "🥗", "🐟", "🍗"];

const emptyForm = { name: "", icon: "🍽️", bgColor: "#5b45b0", sortOrder: 0 };

const CategoryManager = () => {
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(null); // category object, or "new"
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: res, isLoading } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const categories = res?.data?.data ?? [];

  useEffect(() => {
    if (editing && editing !== "new") {
      setForm({
        name: editing.name,
        icon: editing.icon,
        bgColor: editing.bgColor,
        sortOrder: editing.sortOrder,
      });
    } else {
      setForm({ ...emptyForm, sortOrder: categories.length });
    }
    // categories.length only matters when opening a fresh form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["dishes"] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing === "new" ? addCategory(payload) : updateCategory({ id: editing._id, ...payload }),
    onSuccess: (response) => {
      enqueueSnackbar(response.data.message, { variant: "success" });
      setEditing(null);
      refresh();
    },
    onError: (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      enqueueSnackbar("Category deleted.", { variant: "success" });
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
  });

  const inputClass =
    "w-full rounded-lg bg-[#1f1f1f] px-4 py-3 text-white outline-none placeholder:text-[#6b6b6b] focus:ring-2 focus:ring-[#f6b100]";

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-xl bg-[#f6b100] px-5 py-3 font-bold text-[#1f1f1f] transition hover:bg-[#ffc528]"
        >
          <FaPlus size={14} /> Add Category
        </button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="py-10 text-center text-[#ababab]">Loading categories...</p>
        ) : categories.length === 0 ? (
          <EmptyState
            icon={<MdCategory />}
            title="No categories yet"
            message="Categories group the menu - for example Rice & Curry, Short Eats, Beverages."
            action={
              <button
                onClick={() => setEditing("new")}
                className="mt-2 rounded-lg bg-[#f6b100] px-5 py-2.5 font-bold text-[#1f1f1f]"
              >
                Add the first category
              </button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category._id}
                className="flex items-center justify-between rounded-xl p-4"
                style={{ backgroundColor: category.bgColor }}
              >
                <div>
                  <p className="text-lg font-semibold text-white">
                    {category.icon} {category.name}
                  </p>
                  <p className="text-sm text-white/70">
                    {category.dishCount} dish{category.dishCount === 1 ? "" : "es"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(category)}
                    title="Edit"
                    className="rounded-lg bg-black/25 p-2 text-white transition hover:bg-black/40"
                  >
                    <MdEdit size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(category)}
                    title="Delete"
                    className="rounded-lg bg-black/25 p-2 text-white transition hover:bg-black/40"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add Category" : "Edit Category"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-[#ababab]">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Rice & Curry"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#ababab]">Icon</label>
            <div className="flex flex-wrap gap-2">
              {iconChoices.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`rounded-lg px-3 py-2 text-xl transition ${
                    form.icon === icon ? "bg-[#f6b100]" : "bg-[#1f1f1f] hover:bg-[#2a2a2a]"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#ababab]">Colour</label>
            <div className="flex flex-wrap gap-2">
              {colorChoices.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, bgColor: color })}
                  style={{ backgroundColor: color }}
                  aria-label={`Colour ${color}`}
                  className={`h-9 w-9 rounded-lg transition ${
                    form.bgColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 rounded-lg bg-[#f6b100] py-3 font-bold text-[#1f1f1f] transition hover:bg-[#ffc528] disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : editing === "new" ? "Add category" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg bg-[#2a2a2a] px-5 py-3 font-semibold text-[#ababab]"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete category"
      >
        <p className="text-sm text-[#ababab]">
          Delete <span className="font-semibold text-[#f5f5f5]">{deleteTarget?.name}</span>? A
          category can only be deleted once it has no dishes in it.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => deleteMutation.mutate(deleteTarget._id)}
            disabled={deleteMutation.isPending}
            className="flex-1 rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg bg-[#2a2a2a] px-5 py-3 font-semibold text-[#ababab]"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManager;
