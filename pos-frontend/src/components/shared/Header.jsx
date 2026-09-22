import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { FaUserCircle } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import { MdPointOfSale, MdReceiptLong, MdInsights, MdSettings, MdHome } from "react-icons/md";
import logo from "../../assets/logo.svg";
import { logout } from "../../https";
import { clearToken } from "../../https/axiosWrapper";
import { removeUser } from "../../redux/slices/userSlice";
import { resetSettings } from "../../redux/slices/settingsSlice";
import { clearCart } from "../../redux/slices/cartSlice";

const navItems = [
  { to: "/", label: "Home", icon: <MdHome size={20} />, end: true },
  { to: "/new-order", label: "New Order", icon: <MdPointOfSale size={20} /> },
  { to: "/bills", label: "Bills", icon: <MdReceiptLong size={20} /> },
  { to: "/reports", label: "Reports", icon: <MdInsights size={20} />, adminOnly: true },
  { to: "/admin", label: "Manage", icon: <MdSettings size={20} />, adminOnly: true },
];

const Header = () => {
  const user = useSelector((state) => state.user);
  const shopName = useSelector((state) => state.settings.data.restaurantName);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Clear the session locally whether or not the server replied, so a
      // dropped connection can never leave someone logged in.
      clearToken();
      dispatch(removeUser());
      dispatch(resetSettings());
      dispatch(clearCart());
      navigate("/auth", { replace: true });
    },
  });

  const visibleItems = navItems.filter((item) => !item.adminOnly || user.role === "Admin");

  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 bg-[#1a1a1a] px-4 py-3 md:px-8">
      <div
        onClick={() => navigate("/")}
        className="flex cursor-pointer items-center gap-2"
      >
        <img src={logo} className="h-9 w-9 rounded-full" alt="logo" />
        <h1 className="text-lg font-semibold tracking-wide text-[#f5f5f5]">
          {shopName || "Virutsha"}
        </h1>
      </div>

      <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto scrollbar-hide md:order-none md:w-auto md:gap-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#f6b100] text-[#1f1f1f]"
                  : "text-[#ababab] hover:bg-[#262626] hover:text-[#f5f5f5]"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <FaUserCircle className="text-3xl text-[#f5f5f5]" />
        <div className="hidden flex-col items-start sm:flex">
          <span className="text-sm font-semibold text-[#f5f5f5]">{user.name}</span>
          <span className="text-xs text-[#ababab]">{user.role}</span>
        </div>
        <button
          onClick={() => logoutMutation.mutate()}
          title="Log out"
          className="rounded-lg p-2 text-[#ababab] transition hover:bg-[#262626] hover:text-red-400"
        >
          <IoLogOut size={24} />
        </button>
      </div>
    </header>
  );
};

export default Header;
