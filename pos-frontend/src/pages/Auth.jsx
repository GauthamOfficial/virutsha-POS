import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import Wordmark from "../components/shared/Wordmark";
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
    "w-full rounded-lg border border-line bg-panel px-4 py-4 text-ink outline-none placeholder:text-faint focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

  // Helps the type hold up over the busier parts of the rock. Contrast already
  // passes without it, so this is polish rather than a crutch.
  const overPhoto = { textShadow: "0 1px 12px rgba(46,13,3,0.45)" };

  return (
    <div className="flex min-h-screen w-full">
      {/* Brand side - hidden on small screens so the form gets the room.
          Sigiriya rendered as a terracotta duotone. No logo, since the real
          one is still being drawn.

          `isolate` keeps the blend below from reaching the rest of the page. */}
      <div className="relative isolate hidden w-1/2 flex-col justify-between overflow-hidden bg-terracotta p-12 lg:flex">
        {/* Lifted and desaturated first, so the darker parts of the rock
            survive the multiply below instead of crushing to black. */}
        <img
          src="/sigiriya.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ filter: "saturate(0.5) brightness(1.35) contrast(0.92)" }}
        />

        {/* Brand-colours the photo instead of hiding it. Multiply keeps every
            bit of the photo's detail, and because it can never return anything
            lighter than the terracotta itself, the cream text is guaranteed at
            least 6.95:1 no matter what the photograph contains. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-terracotta mix-blend-multiply"
        />

        {/* Warm washes. Kept gentle: at full strength the mustard one lifts the
            background enough to pull the body copy under 4.5:1. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(45rem 45rem at 10% 0%, rgba(202,132,14,0.22), transparent 60%), radial-gradient(40rem 40rem at 100% 100%, rgba(27,58,32,0.5), transparent 60%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#F7E8CB 1px, transparent 1px), linear-gradient(90deg, #F7E8CB 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative" style={overPhoto}>
          <Wordmark size="lg" tone="cream" />
        </div>

        <div className="relative" style={overPhoto}>
          <h1 className="font-display text-4xl leading-tight text-shell">
            Good food brings
            <br />
            <span className="text-mustard-light">people together</span>.
          </h1>
          <p className="mt-4 max-w-sm text-shell/90">
            Spices ground fresh each morning, rice slow-cooked, chai poured the proper
            way. Traditional taste and warm hospitality, in the shadow of Sigiriya.
          </p>
        </div>

        <p className="relative text-sm text-shell/90" style={overPhoto}>
          Authentic Tamil Flavours · Biriyani · Dosa · Idli · Chai
        </p>
      </div>

      {/* Form side */}
      <div className="flex w-full flex-col justify-center bg-shell px-6 py-10 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <Wordmark size="md" />
          </div>

          {checkingSetup ? (
            <p className="mt-10 text-center text-muted">Connecting to the server...</p>
          ) : (
            <>
              <h2 className="mb-2 mt-8 text-center font-display text-3xl text-terracotta">
                {needsSetup ? "Welcome, let's set up" : "Sign in"}
              </h2>
              <p className="mb-8 text-center text-sm text-muted">
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
                  className="w-full rounded-lg bg-terracotta py-4 text-lg font-bold text-shell transition hover:bg-terracotta-deep disabled:opacity-50"
                >
                  {busy ? "Please wait..." : needsSetup ? "Create owner account" : "Sign in"}
                </button>
              </form>

              {!needsSetup && (
                <p className="mt-6 text-center text-xs text-faint">
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
