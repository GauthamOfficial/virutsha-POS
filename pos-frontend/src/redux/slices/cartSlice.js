import { createSlice } from "@reduxjs/toolkit";

/**
 * Every line in the cart keeps BOTH prices for the dish. Nothing in the cart
 * is tied to Local or Foreigner, so flipping the customer type re-prices the
 * whole order instantly without the cashier re-entering a single item.
 */
const initialState = {
  items: [], // { dishId, name, priceLocal, priceForeign, quantity }
  discount: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action) => {
      const { dishId, name, priceLocal, priceForeign, quantity = 1 } = action.payload;

      const existing = state.items.find((item) => item.dishId === dishId);
      if (existing) {
        existing.quantity += quantity;
        // Prices are refreshed in case the admin edited the dish meanwhile.
        existing.priceLocal = priceLocal;
        existing.priceForeign = priceForeign;
      } else {
        state.items.push({ dishId, name, priceLocal, priceForeign, quantity });
      }
    },

    increaseQuantity: (state, action) => {
      const item = state.items.find((i) => i.dishId === action.payload);
      if (item) item.quantity += 1;
    },

    decreaseQuantity: (state, action) => {
      const item = state.items.find((i) => i.dishId === action.payload);
      if (!item) return;

      item.quantity -= 1;
      if (item.quantity <= 0) {
        state.items = state.items.filter((i) => i.dishId !== action.payload);
      }
    },

    setQuantity: (state, action) => {
      const { dishId, quantity } = action.payload;
      const item = state.items.find((i) => i.dishId === dishId);
      if (!item) return;

      const next = Math.max(0, Math.floor(Number(quantity) || 0));
      if (next === 0) {
        state.items = state.items.filter((i) => i.dishId !== dishId);
      } else {
        item.quantity = next;
      }
    },

    removeItem: (state, action) => {
      state.items = state.items.filter((i) => i.dishId !== action.payload);
    },

    setDiscount: (state, action) => {
      const value = Number(action.payload);
      state.discount = Number.isFinite(value) && value > 0 ? value : 0;
    },

    clearCart: () => initialState,
  },
});

// ---- Selectors ----

// The single place that decides which of the two prices applies.
export const unitPriceFor = (item, customerType) =>
  customerType === "Foreigner" ? item.priceForeign : item.priceLocal;

export const selectCartItems = (state) => state.cart.items;

export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectSubtotal = (state) => {
  const { customerType } = state.customer;
  return state.cart.items.reduce(
    (sum, item) => sum + unitPriceFor(item, customerType) * item.quantity,
    0
  );
};

// Full bill maths, mirroring what the backend recalculates when saving.
export const selectBill = (state) => {
  const subtotal = selectSubtotal(state);
  const discount = Math.min(state.cart.discount || 0, subtotal);
  const taxable = subtotal - discount;
  const taxRate = Number(state.settings.data.taxRate) || 0;
  const tax = (taxable * taxRate) / 100;

  return {
    subtotal,
    discount,
    taxRate,
    tax,
    total: taxable + tax,
  };
};

export const {
  addItem,
  increaseQuantity,
  decreaseQuantity,
  setQuantity,
  removeItem,
  setDiscount,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
