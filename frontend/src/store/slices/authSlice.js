import { createSlice } from '@reduxjs/toolkit';
import { getStoredUser } from '../../services/auth.service';

const initialState = {
  user: getStoredUser(),
  isAuthenticated: Boolean(getStoredUser()),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
