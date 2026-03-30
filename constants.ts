import { Category, IconName } from './types';

// App Version
export const APP_VERSION = '2.7.2';
export const APP_BUILD_DATE = 'March 30, 2026';


export const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Gaji', type: 'INCOME', icon: 'Wallet', color: '#10b981' },
  { id: 'c2', name: 'Bonus', type: 'INCOME', icon: 'Gift', color: '#34d399' },
  { id: 'c3', name: 'Makanan', type: 'EXPENSE', icon: 'Utensils', color: '#f87171' },
  { id: 'c4', name: 'Transport', type: 'EXPENSE', icon: 'Car', color: '#60a5fa' },
  { id: 'c5', name: 'Belanja', type: 'EXPENSE', icon: 'ShoppingBag', color: '#f472b6' },
  { id: 'c6', name: 'Tagihan', type: 'EXPENSE', icon: 'Zap', color: '#fbbf24' },
];

export const AVAILABLE_ICONS: IconName[] = [
  // 💰 Finance & Money
  'Wallet', 'PiggyBank', 'DollarSign', 'CreditCard', 'Banknote', 'Coins',
  'TrendingUp', 'TrendingDown', 'BarChart', 'BarChart2', 'PieChart', 'LineChart',
  'Receipt', 'Calculator', 'Percent', 'CircleDollarSign', 'BadgeDollarSign',

  // 💼 Work & Business
  'Briefcase', 'Building', 'Building2', 'Factory', 'Landmark', 'Store',
  'ShoppingCart', 'Package', 'Boxes', 'Archive', 'FileText', 'ClipboardList',

  // 🍔 Food & Drink
  'Utensils', 'Coffee', 'Pizza', 'Beer', 'Wine', 'Milk', 'IceCream2',
  'Cake', 'Cookie', 'Apple', 'Salad', 'Soup', 'Sandwich', 'Beef',
  'Fish', 'Egg', 'CupSoda', 'Martini', 'UtensilsCrossed', 'ChefHat',

  // 🚗 Transport & Travel
  'Car', 'Bus', 'Bike', 'Plane', 'Train', 'Ship', 'Fuel',
  'ParkingCircle', 'Navigation', 'Map', 'MapPin', 'Compass', 'Globe',
  'Anchor', 'Rocket', 'Truck', 'Sailboat', 'Tractor',

  // 🛍️ Shopping & Lifestyle
  'ShoppingBag', 'Gift', 'Tag', 'Tags', 'Ticket', 'Gem', 'Crown',
  'Shirt', 'Glasses', 'Watch', 'Scissors', 'Sparkles', 'Star',
  'Heart', 'Flower', 'Flower2', 'Palette', 'Paintbrush',

  // 📱 Electronics & Tech
  'Smartphone', 'Laptop', 'Monitor', 'Tv', 'Tablet', 'Camera',
  'Headphones', 'Speaker', 'Radio', 'Wifi', 'Bluetooth', 'Battery',
  'Cable', 'Cpu', 'HardDrive', 'Printer', 'Mouse', 'Keyboard',
  'Gamepad', 'Joystick',

  // 🏠 Home & Utilities
  'Home', 'Bed', 'Sofa', 'Lamp', 'LampDesk',
  'Lightbulb', 'Zap', 'Plug', 'Thermometer', 'Fan', 'AirVent',
  'Droplet', 'Droplets', 'Flame', 'Snowflake', 'Wind',
  'Hammer', 'Wrench', 'Key', 'Lock', 'DoorOpen',
  'Trash2', 'Recycle', 'Leaf', 'TreePine', 'Trees',

  // 🏥 Health & Wellness
  'HeartPulse', 'Heart', 'Stethoscope', 'Pill', 'Syringe',
  'Activity', 'Dumbbell', 'PersonStanding', 'Footprints', 'Brain',
  'Eye', 'Ear', 'Hand', 'CircleUser', 'Smile', 'Frown',
  'Sun', 'Moon', 'CloudSun', 'Umbrella', 'Shield', 'ShieldCheck',

  // 📚 Education & Kids
  'BookOpen', 'Book', 'BookMarked', 'Notebook', 'GraduationCap', 'School',
  'Pencil', 'PenTool', 'Highlighter', 'Eraser', 'Ruler', 'Backpack',
  'Baby', 'ToyBrick', 'Puzzle',

  // 🎮 Entertainment
  'Music', 'Music2', 'Music3', 'Music4', 'Mic', 'Mic2',
  'Video', 'Film', 'Clapperboard', 'Popcorn',
  'Dice1', 'Dice5', 'Trophy', 'Medal',

  // 🌿 Nature & Outdoors
  'Mountain', 'MountainSnow', 'Waves',
  'Sunrise', 'Sunset', 'Cloud', 'CloudRain', 'CloudSnow', 'Rainbow',
  'Bird', 'Cat', 'Dog', 'Bug', 'Rabbit', 'Squirrel',
  'Tent', 'Binoculars', 'Flashlight',

  // ⛪ Religious & Spiritual
  'Church', 'Cross', 'BookHeart',

  // 📞 Communication & Social
  'Phone', 'PhoneCall', 'Mail', 'MessageCircle', 'Send', 'Share',
  'Users', 'UserPlus', 'UserCheck', 'Handshake', 'PartyPopper',

  // ⚙️ UI Actions
  'Plus', 'Minus', 'X', 'Check', 'Edit', 'Save',
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'RefreshCw',
  'Search', 'Filter', 'Settings', 'Menu', 'MoreHorizontal', 'MoreVertical',
  'AlertCircle', 'Info', 'HelpCircle', 'CheckCircle', 'XCircle'
];

export const COLORS = [
  // Red shades
  '#ef4444', '#f87171', '#dc2626', '#b91c1c',
  // Orange shades
  '#f97316', '#fb923c', '#ea580c',
  // Yellow/Amber shades
  '#f59e0b', '#fbbf24', '#d97706',
  // Green shades
  '#84cc16', '#10b981', '#22c55e', '#16a34a', '#14b8a6',
  // Blue shades
  '#06b6d4', '#0ea5e9', '#3b82f6', '#2563eb', '#1d4ed8',
  // Purple shades
  '#6366f1', '#8b5cf6', '#a855f7', '#7c3aed',
  // Pink shades
  '#d946ef', '#ec4899', '#f472b6', '#f43f5e',
  // Neutral shades
  '#64748b', '#78716c', '#6b7280', '#374151'
];
