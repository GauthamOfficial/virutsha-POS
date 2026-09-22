import { createSlice } from "@reduxjs/toolkit";

const CUSTOMER_TYPE_KEY = "virutsha_pos_customer_type";

// Remembering the last choice means a shop serving mostly tourists does not
// have to flip the switch on every single bill.
const readStoredType = () => {
  try {
    const saved = localStorage.getItem(CUSTOMER_TYPE_KEY);
    return saved === "Foreigner" ? "Foreigner" : "Local";
  } catch {
    return "Local";
  }
};

const initialState = {
  customerType: readStoredType(),
  name: "",
  phone: "",
  guests: 1,
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setCustomerType: (state, action) => {
      const type = action.payload === "Foreigner" ? "Foreigner" : "Local";
      state.customerType = type;
      try {
        localStorage.setItem(CUSTOMER_TYPE_KEY, type);
      } catch {
        // Not critical if the browser blocks storage.
      }
    },

    setCustomerDetails: (state, action) => {
      const { name, phone, guests } = action.payload;
      if (name !== undefined) state.name = name;
      if (phone !== undefined) state.phone = phone;
      if (guests !== undefined) state.guests = Math.max(1, Number(guests) || 1);
    },

    // Clears the person but deliberately keeps the Local/Foreigner choice,
    // which usually stays the same for the next customer in the queue.
    resetCustomer: (state) => {
      state.name = "";
      state.phone = "";
      state.guests = 1;
    },
  },
});

export const { setCustomerType, setCustomerDetails, resetCustomer } = customerSlice.actions;
export default customerSlice.reducer;
