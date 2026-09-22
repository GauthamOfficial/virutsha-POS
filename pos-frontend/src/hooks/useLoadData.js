import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getUserData, getSettings } from "../https";
import { clearToken } from "../https/axiosWrapper";
import { removeUser, setUser } from "../redux/slices/userSlice";
import { setSettings } from "../redux/slices/settingsSlice";

// Restores the session and the shop settings once, when the app opens.
const useLoadData = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await getUserData();
        if (cancelled) return;

        const { _id, name, email, phone, role } = data.data;
        dispatch(setUser({ _id, name, email, phone, role }));

        // Settings are only readable once logged in.
        try {
          const settingsRes = await getSettings();
          if (!cancelled) dispatch(setSettings(settingsRes.data.data));
        } catch {
          // Fall back to the built-in defaults.
        }
      } catch {
        if (cancelled) return;
        clearToken();
        dispatch(removeUser());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return isLoading;
};

export default useLoadData;
