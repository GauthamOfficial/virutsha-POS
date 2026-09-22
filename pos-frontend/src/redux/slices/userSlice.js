import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  _id: "",
  name: "",
  email: "",
  phone: "",
  role: "",
  isAuth: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { _id, name, phone, email, role } = action.payload;
      state._id = _id;
      state.name = name;
      state.phone = phone;
      state.email = email;
      state.role = role;
      state.isAuth = true;
    },
    removeUser: () => initialState,
  },
});

export const selectIsAdmin = (state) => state.user.role === "Admin";

export const { setUser, removeUser } = userSlice.actions;
export default userSlice.reducer;
