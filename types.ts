export type TransactionType = 'INCOME' | 'EXPENSE';
export type AccountType = 'PERSONAL' | 'FAMILY' | 'BUSINESS' | 'SHARED';
export type AccountRole = 'OWNER';

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  role: AccountRole;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // Icon name — mapped to Material icon in IconDisplay
  color: string; // Hex color
}

// Attachment structure
export interface Attachment {
  url: string;
  path: string;
  type: 'image' | 'pdf';
  name: string;
  size: number;
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  categoryId: string;
  createdAt?: string; // ISO timestamp for sorting
  // New structured attachment
  attachment?: Attachment;
  // Legacy fields (optional) for backward compatibility
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'pdf';
}

export type PlanItemStatus = 'PLANNED' | 'DONE' | 'CANCELLED';

export interface PlanItem {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  categoryId: string; // Optional mapping to existing categories for color/icon
  plannedDate?: string;
  status: PlanItemStatus;
}

export interface Plan {
  id: string;
  title: string;
  items: PlanItem[];
  createdAt: string;
  useCurrentMonthBalance?: boolean;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  name: string;
  categoryIds: string[];
  limitAmount: number;
  createdAt: string;
  updatedAt: string;
  // Legacy field kept for backward compatibility while old docs are normalized on read.
  categoryId?: string;
}

export type DebtKind = 'DEBT' | 'RECEIVABLE';
export type DebtStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface DebtRecord {
  id: string;
  kind: DebtKind;
  personName: string;
  title: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: DebtStatus;
  transactionDate: string;
  dueDate?: string;
  notes?: string;
  payments: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

// Legacy aliases kept temporarily to reduce transition risk while phase 3 lands.
export type SimulationItem = PlanItem;
export type Simulation = Plan;

// Icon names available for selection (150+ icons from Lucide React)
export type IconName =
  // Finance & Money
  | 'Wallet' | 'PiggyBank' | 'DollarSign' | 'CreditCard' | 'Banknote' | 'Coins'
  | 'TrendingUp' | 'TrendingDown' | 'BarChart' | 'BarChart2' | 'PieChart' | 'LineChart'
  | 'Receipt' | 'Calculator' | 'Percent' | 'CircleDollarSign' | 'BadgeDollarSign'

  // Work & Business
  | 'Briefcase' | 'Building' | 'Building2' | 'Factory' | 'Landmark' | 'Store'
  | 'ShoppingCart' | 'Package' | 'Boxes' | 'Archive' | 'FileText' | 'ClipboardList'

  // Food & Drink
  | 'Utensils' | 'Coffee' | 'Pizza' | 'Beer' | 'Wine' | 'Milk' | 'IceCream2'
  | 'Cake' | 'Cookie' | 'Apple' | 'Salad' | 'Soup' | 'Sandwich' | 'Beef'
  | 'Fish' | 'Egg' | 'CupSoda' | 'Martini' | 'UtensilsCrossed' | 'ChefHat'

  // Transport & Travel
  | 'Car' | 'Bus' | 'Bike' | 'Plane' | 'Train' | 'Ship' | 'Fuel'
  | 'ParkingCircle' | 'Navigation' | 'Map' | 'MapPin' | 'Compass' | 'Globe'
  | 'Anchor' | 'Rocket' | 'Truck' | 'Sailboat' | 'Tractor'

  // Shopping & Lifestyle
  | 'ShoppingBag' | 'Gift' | 'Tag' | 'Tags' | 'Ticket' | 'Gem' | 'Crown'
  | 'Shirt' | 'Glasses' | 'Watch' | 'Scissors' | 'Sparkles' | 'Star'
  | 'Heart' | 'Flower' | 'Flower2' | 'Palette' | 'Paintbrush'

  // Electronics & Tech
  | 'Smartphone' | 'Laptop' | 'Monitor' | 'Tv' | 'Tablet' | 'Camera'
  | 'Headphones' | 'Speaker' | 'Radio' | 'Wifi' | 'Bluetooth' | 'Battery'
  | 'Cable' | 'Cpu' | 'HardDrive' | 'Printer' | 'Mouse' | 'Keyboard'
  | 'Gamepad' | 'Joystick'

  // Home & Utilities
  | 'Home' | 'Bed' | 'Sofa' | 'Lamp' | 'LampDesk'
  | 'Lightbulb' | 'Zap' | 'Plug' | 'Thermometer' | 'Fan' | 'AirVent'
  | 'Droplet' | 'Droplets' | 'Flame' | 'Snowflake' | 'Wind'
  | 'Hammer' | 'Wrench' | 'Key' | 'Lock' | 'DoorOpen'
  | 'Trash2' | 'Recycle' | 'Leaf' | 'TreePine' | 'Trees'

  // Health & Wellness
  | 'HeartPulse' | 'Heart' | 'Stethoscope' | 'Pill' | 'Syringe'
  | 'Activity' | 'Dumbbell' | 'PersonStanding' | 'Footprints' | 'Brain'
  | 'Eye' | 'Ear' | 'Hand' | 'CircleUser' | 'Smile' | 'Frown'
  | 'Sun' | 'Moon' | 'CloudSun' | 'Umbrella' | 'Shield' | 'ShieldCheck'

  // Education & Kids
  | 'BookOpen' | 'Book' | 'BookMarked' | 'Notebook' | 'GraduationCap' | 'School'
  | 'Pencil' | 'PenTool' | 'Highlighter' | 'Eraser' | 'Ruler' | 'Backpack'
  | 'Baby' | 'ToyBrick' | 'Puzzle'

  // Entertainment
  | 'Music' | 'Music2' | 'Music3' | 'Music4' | 'Mic' | 'Mic2'
  | 'Video' | 'Film' | 'Clapperboard' | 'Popcorn'
  | 'Dice1' | 'Dice5' | 'Trophy' | 'Medal'

  // Nature & Outdoors
  | 'Mountain' | 'MountainSnow' | 'Waves'
  | 'Sunrise' | 'Sunset' | 'Cloud' | 'CloudRain' | 'CloudSnow' | 'Rainbow'
  | 'Bird' | 'Cat' | 'Dog' | 'Bug' | 'Rabbit' | 'Squirrel'
  | 'Tent' | 'Binoculars' | 'Flashlight'

  // Religious & Spiritual
  | 'Church' | 'Cross' | 'BookHeart'

  // Communication & Social
  | 'Phone' | 'PhoneCall' | 'Mail' | 'MessageCircle' | 'Send' | 'Share'
  | 'Users' | 'UserPlus' | 'UserCheck' | 'Handshake' | 'PartyPopper'

  // UI & Actions
  | 'Plus' | 'Minus' | 'X' | 'Check' | 'Edit' | 'Save'
  | 'ArrowRight' | 'ArrowLeft' | 'ArrowUp' | 'ArrowDown' | 'RefreshCw'
  | 'Search' | 'Filter' | 'Settings' | 'Menu' | 'MoreHorizontal' | 'MoreVertical'
  | 'AlertCircle' | 'Info' | 'HelpCircle' | 'CheckCircle' | 'XCircle';
