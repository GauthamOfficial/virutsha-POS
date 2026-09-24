import { createSlice } from "@reduxjs/toolkit";

/**
 * Every line in the cart keeps BOTH prices for the dish. Nothing in the cart
 * is tied to Local or Foreigner, so flipping the customer type re-prices the
 * whole order instantly without the cashier re-entering a single item.
 */
const initialState = {
  items: [], // { dishId, name, priceLocal, priceForeign, quantity, discountPercent }
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
        state.items.push({ dishId, name, priceLocal, priceForeign, quantity, discountPercent: 0 });
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

    // Percentage off one line only. Kept separate from the bill-wide
    // discount below, which is a flat amount off the whole order.
    setItemDiscount: (state, action) => {
      const { dishId, percent } = action.payload;
      const item = state.items.find((i) => i.dishId === dishId);
      if (!item) return;

      const value = Number(percent);
      if (!Number.isFinite(value) || value <= 0) {
        item.discountPercent = 0;
        return;
      }
      item.discountPercent = Math.min(100, Math.round(value * 100) / 100);
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

// What one line is worth before and after its own percentage discount.
export const lineAmountsFor = (item, customerType) => {
  const unitPrice = unitPriceFor(item, customerType);
  const gross = unitPrice * item.quantity;
  const percent = Math.min(100, Math.max(0, Number(item.discountPercent) || 0));
  const discount = (gross * percent) / 100;

  return { unitPrice, percent, gross, discount, net: gross - discount };
};

export const selectSubtotal = (state) => {
  const { customerType } = state.customer;
  return state.cart.items.reduce(
    (sum, item) => sum + lineAmountsFor(item, customerType).gross,
    0
  );
};

// Full bill maths, mirroring what the backend recalculates when saving.
export const selectBill = (state) => {
  const { customerType } = state.customer;

  let subtotal = 0;
  let itemDiscount = 0;
  for (const item of state.cart.items) {
    const line = lineAmountsFor(item, customerType);
    subtotal += line.gross;
    itemDiscount += line.discount;
  }

  // The bill-wide discount comes off what is left after the per-line ones.
  const afterItemDiscounts = subtotal - itemDiscount;
  const discount = Math.min(state.cart.discount || 0, afterItemDiscounts);

  const taxable = afterItemDiscounts - discount;
  const taxRate = Number(state.settings.data.taxRate) || 0;
  const tax = (taxable * taxRate) / 100;

  return {
    subtotal,
    itemDiscount,
    discount,
    taxRate,
    tax,
    total: taxable + tax,
  };
};

export const {
  addItem,
  setItemDiscount,
  increaseQuantity,
  decreaseQuantity,
  setQuantity,
  removeItem,
  setDiscount,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
