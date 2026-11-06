import CheckroomRoundedIcon from '@mui/icons-material/CheckroomRounded';
import ManRoundedIcon from '@mui/icons-material/ManRounded';
import WomanRoundedIcon from '@mui/icons-material/WomanRounded';
import ChildCareRoundedIcon from '@mui/icons-material/ChildCareRounded';
import TextureRoundedIcon from '@mui/icons-material/TextureRounded';
import SpaRoundedIcon from '@mui/icons-material/SpaRounded';
import FaceRetouchingNaturalRoundedIcon from '@mui/icons-material/FaceRetouchingNaturalRounded';
import WatchRoundedIcon from '@mui/icons-material/WatchRounded';
import DirectionsWalkRoundedIcon from '@mui/icons-material/DirectionsWalkRounded';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import ChairOutlinedIcon from '@mui/icons-material/ChairOutlined';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import BackpackOutlinedIcon from '@mui/icons-material/BackpackOutlined';
import WalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';

// Works for both category names and product names. Ordered: most specific first, so
// "Kids Denim Dungaree" → kids, "Leather Watch Strap" → watch, "Silk Tie" → clothing, "Silk Fabric" → fabric.
const RULES = [
  [/\bkid|child|baby/i, ChildCareRoundedIcon],
  [/perfume|fragrance|attar|\boud\b|cologne|parfum|toilette|musk/i, SpaRoundedIcon],
  [/serum|oil|lotion|gel|face\s?wash/i, WaterDropOutlinedIcon],
  [/beauty|skin|cosmetic|cream|mask|personal care/i, FaceRetouchingNaturalRoundedIcon],
  [/fabric|textile|handloom|shirting/i, TextureRoundedIcon],
  [/shoe|sneaker|loafer|heel|flats|jutti|sandal|footwear|boot/i, DirectionsWalkRoundedIcon],
  [/watch/i, WatchRoundedIcon],
  [/sunglass|eyewear|spectacle/i, VisibilityOutlinedIcon],
  [/wallet|purse/i, WalletOutlinedIcon],
  [/backpack/i, BackpackOutlinedIcon],
  [/handbag|\bbag\b|clutch|tote/i, ShoppingBagOutlinedIcon],
  [/jewel|\bgold\b|diamond|cufflink|ring|necklace|earring/i, DiamondOutlinedIcon],
  [/home|decor|living|furnish/i, ChairOutlinedIcon],
  [/accessor|belt|\btie\b/i, WatchRoundedIcon],
  [/women|saree|lehenga|anarkali|churidar|dress|kurti/i, WomanRoundedIcon],
  [/fashion|cloth|wear|apparel|shirt|t-shirt|jeans|kurta|blazer|jacket|trouser|dungaree|polo/i, CheckroomRoundedIcon],
  [/\bmen/i, ManRoundedIcon],
  // Bare material names (category "Cotton", "Silk"…) — last, so "Cotton Shirt" stays clothing.
  [/cotton|silk|linen|wool|velvet|rayon|chanderi|banarasi|kanchipuram/i, TextureRoundedIcon],
];

export function getCategoryIcon(name = '') {
  return RULES.find(([re]) => re.test(name))?.[1] || CategoryRoundedIcon;
}

export default function CategoryIcon({ name, ...props }) {
  const Icon = getCategoryIcon(name);
  return <Icon {...props} />;
}
