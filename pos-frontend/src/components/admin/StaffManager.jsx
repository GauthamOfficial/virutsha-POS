import { useState } from "react";
import { useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { FaPlus, FaUserCircle } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { getStaff, register, updateStaff, deleteStaff } from "../../https";
import { errorMessage } from "../../https/axiosWrapper";
import Modal from "../shared/Modal";

const emptyForm = { name: "", email: "", phone: "", password: "", role: "Cashier" };

const StaffManager = () => {
  const queryClient = useQueryClient();
  const currentUserId = useSelector((state) => state.user._id);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: res, isLoading } = useQuery({ queryKey: ["staff"], queryFn: getStaff });
  const staff = res?.data?.data ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["staff"] });

  const addMutation = useMutation({
    mutationFn: register,
    onSuccess: (response) => {
      enqueueSnackbar(response.data.message, { variant: "success" });
      setAdding(false);
      setForm(emptyForm);
      refresh();
    },
    onError: (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: updateStaff,
    onSuccess: () => {
      enqueueSnackbar("Staff updated.", { variant: "success" });
      refresh();
    },
    onError: (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      enqueueSnackbar("Staff removed.", { variant: "success" });
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
  });

  const inputClass =
    "w-full rounded-lg bg-shell px-4 py-3 text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-terracotta";

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Cashiers can take orders and see bills. Admins can also edit the menu and see reports.
        </p>
        <button
          onClick={() => setAdding(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-terracotta px-5 py-3 font-bold text-shell transition hover:bg-terracotta-deep"
        >
          <FaPlus size={14} /> Add Staff
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-panel">
        {isLoading ? (
          <p className="py-10 text-center text-muted">Loading staff...</p>
        ) : (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-raised text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3 text-center">Active</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => {
                const isSelf = person._id === currentUserId;
                return (
                  <tr key={person._id} className="border-t border-line">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FaUserCircle className="text-xl text-faint" />
                        <span className="font-semibold text-ink">
                          {person.name}
                          {isSelf && <span className="ml-2 text-xs text-faint">(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-muted">{person.email}</td>
                    <td className="p-3">
                      <select
                        value={person.role}
                        disabled={isSelf}
                        onChange={(e) =>
                          updateMutation.mutate({ id: person._id, role: e.target.value })
                        }
                        className="rounded-lg bg-raised px-3 py-1.5 text-ink outline-none disabled:opacity-50"
                      >
                        <option value="Cashier">Cashier</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={person.isActive}
                        disabled={isSelf}
                        onChange={(e) =>
                          updateMutation.mutate({ id: person._id, isActive: e.target.checked })
                        }
                        className="h-4 w-4 accent-terracotta disabled:opacity-50"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setDeleteTarget(person)}
                        disabled={isSelf}
                        title={isSelf ? "You cannot remove yourself" : "Remove"}
                        className="rounded-lg bg-raised p-2 text-muted transition hover:text-danger disabled:opacity-30 disabled:hover:text-muted"
                      >
                        <MdDelete size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Add Staff">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
            className={inputClass}
            required
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email (used to log in)"
            className={inputClass}
            required
          />
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone"
            className={inputClass}
            required
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password (at least 6 characters)"
            className={inputClass}
            minLength={6}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            {["Cashier", "Admin"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm({ ...form, role })}
                className={`rounded-lg px-4 py-3 font-semibold transition ${
                  form.role === role
                    ? "bg-terracotta text-shell"
                    : "bg-shell text-muted hover:text-ink"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={addMutation.isPending}
            className="w-full rounded-lg bg-terracotta py-3 font-bold text-shell transition hover:bg-terracotta-deep disabled:opacity-50"
          >
            {addMutation.isPending ? "Creating..." : "Create account"}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Remove staff"
      >
        <p className="text-sm text-muted">
          Remove <span className="font-semibold text-ink">{deleteTarget?.name}</span>? Bills
          they already took stay on record.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => deleteMutation.mutate(deleteTarget._id)}
            disabled={deleteMutation.isPending}
            className="flex-1 rounded-lg bg-danger py-3 font-semibold text-white transition hover:bg-danger/90 disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Removing..." : "Remove"}
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

export default StaffManager;
