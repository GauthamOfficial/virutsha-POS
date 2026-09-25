import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { FaSearch, FaPlus } from "react-icons/fa";
import { BiSolidDish } from "react-icons/bi";
import { getCategories, getDishes } from "../../https";
import { addItem, selectCartItems } from "../../redux/slices/cartSlice";
import { formatMoney } from "../../utils";
import EmptyState from "../shared/EmptyState";

const MenuGrid = () => {
  const dispatch = useDispatch();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const customerType = useSelector((state) => state.customer.customerType);
  const currency = useSelector((state) => state.settings.data.currencySymbol);
  const cartItems = useSelector(selectCartItems);

  const { data: categoryRes } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: dishRes, isLoading } = useQuery({
    queryKey: ["dishes"],
    queryFn: () => getDishes(),
  });

  const categories = categoryRes?.data?.data ?? [];

  const dishes = useMemo(
    () => (dishRes?.data?.data ?? []).filter((dish) => dish.isAvailable),
    [dishRes]
  );

  const visibleDishes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return dishes.filter((dish) => {
      const matchesCategory =
        activeCategory === "all" || String(dish.category?._id) === activeCategory;
      const matchesSearch = !term || dish.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [dishes, activeCategory, search]);

  const quantityInCart = (dishId) =>
    cartItems.find((item) => item.dishId === dishId)?.quantity ?? 0;

  const handleAdd = (dish) => {
    dispatch(
      addItem({
        dishId: dish._id,
        name: dish.name,
        priceLocal: dish.priceLocal,
        priceForeign: dish.priceForeign,
        quantity: 1,
      })
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="px-4 md:px-6">
        <div className="flex items-center gap-3 rounded-xl bg-panel px-4 py-3">
          <FaSearch className="text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a dish..."
            className="w-full bg-transparent text-ink outline-none placeholder:text-faint"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto px-4 py-4 scrollbar-hide md:px-6">
        <button
          onClick={() => setActiveCategory("all")}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeCategory === "all"
              ? "bg-terracotta text-shell"
              : "bg-panel text-muted hover:text-ink"
          }`}
        >
          All Items
        </button>

        {categories.map((category) => {
          const isActive = activeCategory === String(category._id);
          return (
            <button
              key={category._id}
              onClick={() => setActiveCategory(String(category._id))}
              style={isActive ? { backgroundColor: category.bgColor, color: "#fff" } : undefined}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                isActive ? "" : "bg-panel text-muted hover:text-ink"
              }`}
            >
              {category.icon} {category.name}
            </button>
          );
        })}
      </div>

      {/* Dishes */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide md:px-6">
        {isLoading ? (
          <p className="py-10 text-center text-muted">Loading the menu...</p>
        ) : visibleDishes.length === 0 ? (
          <EmptyState
            icon={<BiSolidDish />}
            title="No dishes here"
            message={
              dishes.length === 0
                ? "The menu is empty. An Admin can add dishes from the Manage page."
                : "Nothing matches that search."
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {visibleDishes.map((dish) => {
              const price = customerType === "Foreigner" ? dish.priceForeign : dish.priceLocal;
              const inCart = quantityInCart(dish._id);

              return (
                <button
                  key={dish._id}
                  onClick={() => handleAdd(dish)}
                  className="group relative flex flex-col overflow-hidden rounded-xl bg-panel text-left transition hover:bg-raised focus:outline-none focus:ring-2 focus:ring-terracotta"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-raised">
                    {dish.image ? (
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl text-faint/60">
                        <BiSolidDish />
                      </div>
                    )}

                    {inCart > 0 && (
                      <span className="absolute right-2 top-2 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-forest px-2 text-sm font-bold text-shell">
                        {inCart}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-2 p-3">
                    <h3 className="text-sm font-semibold leading-snug text-ink">
                      {dish.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-mustard-deep">
                        {formatMoney(price, currency)}
                      </span>
                      <span className="rounded-lg bg-forest-soft p-1.5 text-forest transition group-hover:bg-forest group-hover:text-shell">
                        <FaPlus size={12} />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuGrid;
