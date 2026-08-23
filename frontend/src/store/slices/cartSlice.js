import { createSlice } from '@reduxjs/toolkit';

const initialState = { items: [], sellerGroups: [], subtotal: 0, itemCount: 0, hasIssues: false, loaded: false };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart(state, action) {
      return { ...action.payload, loaded: true };
    },
    resetCart() {
      return initialState;
    },
  },
});

export const { setCart, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
