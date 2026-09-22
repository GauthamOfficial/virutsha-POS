import { createSlice } from "@reduxjs/toolkit";

const defaultSettings = {
  restaurantName: "Virutsha Restaurant",
  addressLine: "",
  phone: "",
  currencySymbol: "Rs",
  currencyCode: "LKR",
  taxRate: 0,
  taxLabel: "Service Charge",
  receiptFooter: "Thank you! Please come again.",
  localLabel: "Local",
  foreignLabel: "Foreigner",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState: { data: defaultSettings, loaded: false },
  reducers: {
    setSettings: (state, action) => {
      state.data = { ...defaultSettings, ...action.payload };
      state.loaded = true;
    },
    resetSettings: (state) => {
      state.data = defaultSettings;
      state.loaded = false;
    },
  },
});

export const selectCurrency = (state) => state.settings.data.currencySymbol || "Rs";

export const { setSettings, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
