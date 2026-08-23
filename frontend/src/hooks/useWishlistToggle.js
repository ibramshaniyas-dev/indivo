import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlistId } from '../store/slices/wishlistSlice';
import { addToWishlist, removeFromWishlist } from '../services/wishlist.service';

export default function useWishlistToggle() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const wishlistIds = useSelector((state) => state.wishlist.productIds);

  const toggle = async (product) => {
    if (!isAuthenticated || user?.userType !== 'CUSTOMER') {
      navigate('/login');
      return;
    }
    const wishlisted = wishlistIds.includes(product.id);
    dispatch(toggleWishlistId(product.id));
    try {
      if (wishlisted) await removeFromWishlist(product.id);
      else await addToWishlist(product.id);
    } catch {
      dispatch(toggleWishlistId(product.id));
    }
  };

  return { wishlistIds, toggle };
}
