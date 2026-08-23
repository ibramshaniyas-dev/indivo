import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], sellerCount: 0 },
  reducers: {
    setCart(state, action) {
      state.items = action.payload.items;
      state.sellerCount = new Set(action.payload.items.map((item) => item.sellerId)).size;
    },
  },
});

export const { setCart } = cartSlice.actions;
export default cartSlice.reducer;
