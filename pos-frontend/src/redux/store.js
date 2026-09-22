import { configureStore } from "@reduxjs/toolkit";
import customerReducer from "./slices/customerSlice";
import cartReducer from "./slices/cartSlice";
import userReducer from "./slices/userSlice";
import settingsReducer from "./slices/settingsSlice";

const store = configureStore({
  reducer: {
    customer: customerReducer,
    cart: cartReducer,
    user: userReducer,
    settings: settingsReducer,
  },
  devTools: import.meta.env.MODE !== "production",
});

export default store;
