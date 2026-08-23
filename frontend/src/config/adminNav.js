import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import PercentRoundedIcon from '@mui/icons-material/PercentRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import WebRoundedIcon from '@mui/icons-material/WebRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';

// `permission` is a `module.action` code — null means always visible to any authenticated admin.
// A group with zero visible items is hidden entirely.
export const ADMIN_NAV = [
  {
    section: null,
    items: [{ label: 'Dashboard', icon: DashboardRoundedIcon, to: '/dashboard', permission: null }],
  },
  {
    section: 'Marketplace',
    items: [
      { label: 'Sellers', icon: StorefrontRoundedIcon, to: '/sellers', permission: 'sellers.view' },
    ],
  },
  {
    section: 'Customers',
    items: [
      { label: 'Customers', icon: PeopleAltRoundedIcon, to: '/customers', permission: 'customers.view' },
    ],
  },
  {
    section: 'Catalog',
    items: [
      { label: 'Products', icon: Inventory2RoundedIcon, to: '/products', permission: 'products.view' },
      { label: 'Product Approvals', icon: Inventory2RoundedIcon, to: '/products?status=PENDING_REVIEW', permission: 'products.approve' },
      { label: 'Categories', icon: CategoryRoundedIcon, to: '/categories', permission: 'categories.view' },
      { label: 'Brands', icon: LocalOfferRoundedIcon, to: '/brands', permission: 'brands.view' },
      { label: 'Attributes', icon: TuneRoundedIcon, to: '/attributes', permission: 'attributes.view' },
    ],
  },
  {
    section: 'Orders',
    items: [
      { label: 'All Orders', icon: ReceiptLongRoundedIcon, to: '/orders', permission: 'orders.view' },
      { label: 'Returns', icon: ReceiptLongRoundedIcon, to: '/returns', permission: 'returns.view' },
    ],
  },
  {
    section: 'Finance',
    items: [
      { label: 'Payments', icon: PaymentsRoundedIcon, to: '/payments', permission: 'payments.view' },
      { label: 'Refunds', icon: PaymentsRoundedIcon, to: '/refunds', permission: 'refunds.view' },
      { label: 'Commission', icon: PercentRoundedIcon, to: '/commission', permission: 'commission.view' },
      { label: 'Settlements', icon: AccountBalanceWalletRoundedIcon, to: '/settlements', permission: 'settlements.view' },
    ],
  },
  {
    section: 'Marketing',
    items: [
      { label: 'Coupons', icon: ConfirmationNumberRoundedIcon, to: '/coupons', permission: 'coupons.view' },
      { label: 'Offers', icon: LocalOfferRoundedIcon, to: '/offers', permission: 'offers.view' },
      { label: 'Reviews', icon: RateReviewRoundedIcon, to: '/reviews', permission: 'reviews.view' },
    ],
  },
  {
    section: 'CMS',
    items: [
      { label: 'Homepage & Banners', icon: WebRoundedIcon, to: '/cms', permission: 'cms.view' },
    ],
  },
  {
    section: 'Reports',
    items: [
      { label: 'Reports', icon: AssessmentRoundedIcon, to: '/reports', permission: 'reports.view' },
    ],
  },
  {
    section: 'Administration',
    items: [
      { label: 'Admin Users', icon: AdminPanelSettingsRoundedIcon, to: '/admin-users', permission: 'users.view' },
      { label: 'Roles & Permissions', icon: VpnKeyRoundedIcon, to: '/roles', permission: 'roles.view' },
      { label: 'Notifications', icon: NotificationsRoundedIcon, to: '/notifications', permission: 'notifications.view' },
      { label: 'Settings', icon: SettingsRoundedIcon, to: '/settings', permission: 'settings.view' },
      { label: 'Audit Logs', icon: HistoryRoundedIcon, to: '/audit-logs', permission: 'audit_logs.view' },
    ],
  },
];
