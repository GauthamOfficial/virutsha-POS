import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import logo from "../assets/logo.svg";
import { login, register, getSetupStatus, getSettings } from "../https";
import { errorMessage, storeToken } from "../https/axiosWrapper";
import { setUser } from "../redux/slices/userSlice";
import { setSettings } from "../redux/slices/settingsSlice";

const Auth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  useEffect(() => {
    document.title = "POS | Sign in";
  }, []);

  // A brand new installation has no users, so it asks to create the owner
  // account instead of showing a login form nobody can pass.
  const { data: setupRes, isLoading: checkingSetup } = useQuery({
    queryKey: ["setup-status"],
    queryFn: getSetupStatus,
    retry: 1,
  });

  const needsSetup = setupRes?.data?.data?.needsSetup ?? false;

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (res) => {
      const { token, data } = res.data;
      storeToken(token);

      const { _id, name, email, phone, role } = data;
      dispatch(setUser({ _id, name, email, phone, role }));

      try {
        const settingsRes = await getSettings();
        dispatch(setSettings(settingsRes.data.data));
      } catch {
        // Defaults will do until the next load.
      }

      navigate("/", { replace: true });
    },
    onError: (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
  });

  const setupMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      enqueueSnackbar("Owner account created. Signing you in...", { variant: "success" });
      loginMutation.mutate({ email: form.email, password: form.password });
    },
    onError: (error) => enqueueSnackbar(errorMessage(error), { variant: "error" }),
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (needsSetup) {
      setupMutation.mutate({ ...form, role: "Admin" });
    } else {
      loginMutation.mutate({ email: form.email, password: form.password });
    }
  };

  const busy = loginMutation.isPending || setupMutation.isPending;

  const inputClass =
    "w-full rounded-lg bg-[#1f1f1f] px-4 py-4 text-white outline-none placeholder:text-[#6b6b6b] focus:ring-2 focus:ring-[#f6b100]";

  return (
    <div className="flex min-h-screen w-full">
      {/* Brand side - hidden on small screens so the form gets the room.
          Drawn rather than photographed, so the page stays light on a slow
          connection and there is no image to ship. */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-shell p-12 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(60rem 60rem at 15% 0%, rgba(246,177,0,0.16), transparent 55%), radial-gradient(50rem 50rem at 100% 100%, rgba(2,92,202,0.18), transparent 55%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#f5f5f5 1px, transparent 1px), linear-gradient(90deg, #f5f5f5 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <img src={logo} alt="" className="relative h-14 w-14" />

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight text-ink">
            Two price lists.
            <br />
            <span className="text-brand">One tap</span> between them.
          </h1>
          <p className="mt-4 max-w-sm text-muted">
            Ring up the order once. Switch between local and visitor pricing whenever you
            need to — the bill follows.
          </p>
        </div>

        <p className="relative text-sm text-faint">Virutsha POS</p>
      </div>

      {/* Form side */}
      <div className="flex w-full flex-col justify-center bg-panel px-6 py-10 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col items-center gap-2">
            <img src={logo} alt="Virutsha POS" className="h-16 w-16" />
          </div>

          {checkingSetup ? (
            <p className="mt-10 text-center text-[#ababab]">Connecting to the server...</p>
          ) : (
            <>
              <h2 className="mb-2 mt-8 text-center text-3xl font-semibold text-yellow-400">
                {needsSetup ? "Welcome — let's set up" : "Sign in"}
              </h2>
              <p className="mb-8 text-center text-sm text-[#ababab]">
                {needsSetup
                  ? "This is the first time the system has been opened. Create the owner account."
                  : "Enter your staff login to start taking orders."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {needsSetup && (
                  <>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="Your name"
                      className={inputClass}
                      required
                    />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder="Phone number"
                      className={inputClass}
                      required
                    />
                  </>
                )}

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="Email"
                  autoComplete="username"
                  className={inputClass}
                  required
                />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder={needsSetup ? "Choose a password (6+ characters)" : "Password"}
                  autoComplete={needsSetup ? "new-password" : "current-password"}
                  minLength={needsSetup ? 6 : undefined}
                  className={inputClass}
                  required
                />

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-yellow-400 py-4 text-lg font-bold text-gray-900 transition hover:bg-yellow-300 disabled:opacity-50"
                >
                  {busy ? "Please wait..." : needsSetup ? "Create owner account" : "Sign in"}
                </button>
              </form>

              {!needsSetup && (
                <p className="mt-6 text-center text-xs text-[#6b6b6b]">
                  New staff accounts are created by an Admin from the Manage page.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
