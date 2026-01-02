export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // Name of the Lucide icon
  color: string; // Tailwind color class or hex
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
  // New structured attachment
  attachment?: Attachment;
  // Legacy fields (optional) for backward compatibility
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'pdf';
}

export interface SimulationItem {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  categoryId: string; // Optional mapping to existing categories for color/icon
}

export interface Simulation {
  id: string;
  title: string;
  items: SimulationItem[];
  createdAt: string;
}

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