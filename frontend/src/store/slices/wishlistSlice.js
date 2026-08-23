import { createSlice } from '@reduxjs/toolkit';

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { productIds: [], loaded: false },
  reducers: {
    setWishlist(state, action) {
      state.productIds = action.payload.map((p) => p.id);
      state.loaded = true;
    },
    toggleWishlistId(state, action) {
      const id = action.payload;
      state.productIds = state.productIds.includes(id)
        ? state.productIds.filter((p) => p !== id)
        : [...state.productIds, id];
    },
    resetWishlist() {
      return { productIds: [], loaded: false };
    },
  },
});

export const { setWishlist, toggleWishlistId, resetWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
