import React from 'react';
import type { SxProps, Theme } from '@mui/material';
import type { SvgIconProps } from '@mui/material/SvgIcon';

// Finance & Money
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';
import Savings from '@mui/icons-material/Savings';
import AttachMoney from '@mui/icons-material/AttachMoney';
import CreditCard from '@mui/icons-material/CreditCard';
import Payments from '@mui/icons-material/Payments';
import MonetizationOn from '@mui/icons-material/MonetizationOn';
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingDown from '@mui/icons-material/TrendingDown';
import BarChart from '@mui/icons-material/BarChart';
import StackedBarChart from '@mui/icons-material/StackedBarChart';
import PieChart from '@mui/icons-material/PieChart';
import ShowChart from '@mui/icons-material/ShowChart';
import Receipt from '@mui/icons-material/Receipt';
import Calculate from '@mui/icons-material/Calculate';
import Percent from '@mui/icons-material/Percent';
import PriceChange from '@mui/icons-material/PriceChange';
import Loyalty from '@mui/icons-material/Loyalty';

// Work & Business
import Work from '@mui/icons-material/Work';
import Business from '@mui/icons-material/Business';
import CorporateFare from '@mui/icons-material/CorporateFare';
import Factory from '@mui/icons-material/Factory';
import AccountBalance from '@mui/icons-material/AccountBalance';
import Store from '@mui/icons-material/Store';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Inventory2 from '@mui/icons-material/Inventory2';
import AllInbox from '@mui/icons-material/AllInbox';
import Archive from '@mui/icons-material/Archive';
import Description from '@mui/icons-material/Description';
import ListAlt from '@mui/icons-material/ListAlt';

// Food & Drink
import Restaurant from '@mui/icons-material/Restaurant';
import Coffee from '@mui/icons-material/Coffee';
import LocalPizza from '@mui/icons-material/LocalPizza';
import SportsBar from '@mui/icons-material/SportsBar';
import WineBar from '@mui/icons-material/WineBar';
import LocalCafe from '@mui/icons-material/LocalCafe';
import Icecream from '@mui/icons-material/Icecream';
import Cake from '@mui/icons-material/Cake';
import Cookie from '@mui/icons-material/Cookie';
import Apple from '@mui/icons-material/Apple';
import LocalDining from '@mui/icons-material/LocalDining';
import SoupKitchen from '@mui/icons-material/SoupKitchen';
import Fastfood from '@mui/icons-material/Fastfood';
import SetMeal from '@mui/icons-material/SetMeal';
import Egg from '@mui/icons-material/Egg';
import NoMeals from '@mui/icons-material/NoMeals';
import DinnerDining from '@mui/icons-material/DinnerDining';

// Transport & Travel
import DirectionsCar from '@mui/icons-material/DirectionsCar';
import DirectionsBus from '@mui/icons-material/DirectionsBus';
import PedalBike from '@mui/icons-material/PedalBike';
import Flight from '@mui/icons-material/Flight';
import Train from '@mui/icons-material/Train';
import DirectionsBoat from '@mui/icons-material/DirectionsBoat';
import LocalGasStation from '@mui/icons-material/LocalGasStation';
import LocalParking from '@mui/icons-material/LocalParking';
import Navigation from '@mui/icons-material/Navigation';
import Map from '@mui/icons-material/Map';
import LocationOn from '@mui/icons-material/LocationOn';
import Explore from '@mui/icons-material/Explore';
import Language from '@mui/icons-material/Language';
import Anchor from '@mui/icons-material/Anchor';
import RocketLaunch from '@mui/icons-material/RocketLaunch';
import LocalShipping from '@mui/icons-material/LocalShipping';
import Sailing from '@mui/icons-material/Sailing';
import Agriculture from '@mui/icons-material/Agriculture';

// Shopping & Lifestyle
import ShoppingBag from '@mui/icons-material/ShoppingBag';
import CardGiftcard from '@mui/icons-material/CardGiftcard';
import Label from '@mui/icons-material/Label';
import Sell from '@mui/icons-material/Sell';
import ConfirmationNumber from '@mui/icons-material/ConfirmationNumber';
import Diamond from '@mui/icons-material/Diamond';
import Stars from '@mui/icons-material/Stars';
import Checkroom from '@mui/icons-material/Checkroom';
import Watch from '@mui/icons-material/Watch';
import ContentCut from '@mui/icons-material/ContentCut';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import Star from '@mui/icons-material/Star';
import Favorite from '@mui/icons-material/Favorite';
import LocalFlorist from '@mui/icons-material/LocalFlorist';
import Palette from '@mui/icons-material/Palette';
import Brush from '@mui/icons-material/Brush';

// Electronics & Tech
import Smartphone from '@mui/icons-material/Smartphone';
import LaptopMac from '@mui/icons-material/LaptopMac';
import DesktopMac from '@mui/icons-material/DesktopMac';
import Tv from '@mui/icons-material/Tv';
import TabletMac from '@mui/icons-material/TabletMac';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Headphones from '@mui/icons-material/Headphones';
import VolumeUp from '@mui/icons-material/VolumeUp';
import Radio from '@mui/icons-material/Radio';
import Wifi from '@mui/icons-material/Wifi';
import Bluetooth from '@mui/icons-material/Bluetooth';
import BatteryFull from '@mui/icons-material/BatteryFull';
import Cable from '@mui/icons-material/Cable';
import Memory from '@mui/icons-material/Memory';
import Storage from '@mui/icons-material/Storage';
import Print from '@mui/icons-material/Print';
import Mouse from '@mui/icons-material/Mouse';
import Keyboard from '@mui/icons-material/Keyboard';
import VideogameAsset from '@mui/icons-material/VideogameAsset';
import SportsEsports from '@mui/icons-material/SportsEsports';

// Home & Utilities
import Home from '@mui/icons-material/Home';
import Hotel from '@mui/icons-material/Hotel';
import Weekend from '@mui/icons-material/Weekend';
import Light from '@mui/icons-material/Light';
import Nightlight from '@mui/icons-material/Nightlight';
import Lightbulb from '@mui/icons-material/Lightbulb';
import Bolt from '@mui/icons-material/Bolt';
import Power from '@mui/icons-material/Power';
import DeviceThermostat from '@mui/icons-material/DeviceThermostat';
import Air from '@mui/icons-material/Air';
import AcUnit from '@mui/icons-material/AcUnit';
import WaterDrop from '@mui/icons-material/WaterDrop';
import Water from '@mui/icons-material/Water';
import Whatshot from '@mui/icons-material/Whatshot';
import Hardware from '@mui/icons-material/Hardware';
import Build from '@mui/icons-material/Build';
import Key from '@mui/icons-material/Key';
import Lock from '@mui/icons-material/Lock';
import DoorFront from '@mui/icons-material/DoorFront';
import Delete from '@mui/icons-material/Delete';
import Recycling from '@mui/icons-material/Recycling';
import Nature from '@mui/icons-material/Nature';
import Park from '@mui/icons-material/Park';
import Forest from '@mui/icons-material/Forest';

// Health & Wellness
import MonitorHeart from '@mui/icons-material/MonitorHeart';
import HealthAndSafety from '@mui/icons-material/HealthAndSafety';
import Medication from '@mui/icons-material/Medication';
import Vaccines from '@mui/icons-material/Vaccines';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import DirectionsWalk from '@mui/icons-material/DirectionsWalk';
import Psychology from '@mui/icons-material/Psychology';
import Visibility from '@mui/icons-material/Visibility';
import SettingsAccessibility from '@mui/icons-material/SettingsAccessibility';
import PanTool from '@mui/icons-material/PanTool';
import AccountCircle from '@mui/icons-material/AccountCircle';
import SentimentSatisfied from '@mui/icons-material/SentimentSatisfied';
import SentimentDissatisfied from '@mui/icons-material/SentimentDissatisfied';
import WbSunny from '@mui/icons-material/WbSunny';
import DarkMode from '@mui/icons-material/DarkMode';
import WbCloudy from '@mui/icons-material/WbCloudy';
import BeachAccess from '@mui/icons-material/BeachAccess';
import Security from '@mui/icons-material/Security';
import VerifiedUser from '@mui/icons-material/VerifiedUser';

// Education & Kids
import MenuBook from '@mui/icons-material/MenuBook';
import Book from '@mui/icons-material/Book';
import Bookmark from '@mui/icons-material/Bookmark';
import EditNote from '@mui/icons-material/EditNote';
import School from '@mui/icons-material/School';
import Edit from '@mui/icons-material/Edit';
import Draw from '@mui/icons-material/Draw';
import Highlight from '@mui/icons-material/Highlight';
import Straighten from '@mui/icons-material/Straighten';
import Backpack from '@mui/icons-material/Backpack';
import ChildFriendly from '@mui/icons-material/ChildFriendly';
import Toys from '@mui/icons-material/Toys';
import Extension from '@mui/icons-material/Extension';

// Entertainment
import MusicNote from '@mui/icons-material/MusicNote';
import LibraryMusic from '@mui/icons-material/LibraryMusic';
import Audiotrack from '@mui/icons-material/Audiotrack';
import Mic from '@mui/icons-material/Mic';
import MicExternalOn from '@mui/icons-material/MicExternalOn';
import Videocam from '@mui/icons-material/Videocam';
import Movie from '@mui/icons-material/Movie';
import Theaters from '@mui/icons-material/Theaters';
import LocalMovies from '@mui/icons-material/LocalMovies';
import Casino from '@mui/icons-material/Casino';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import MilitaryTech from '@mui/icons-material/MilitaryTech';

// Nature & Outdoors
import Landscape from '@mui/icons-material/Landscape';
import FilterHdr from '@mui/icons-material/FilterHdr';
import Waves from '@mui/icons-material/Waves';
import WbTwilight from '@mui/icons-material/WbTwilight';
import Cloud from '@mui/icons-material/Cloud';
import Thunderstorm from '@mui/icons-material/Thunderstorm';
import Pets from '@mui/icons-material/Pets';
import BugReport from '@mui/icons-material/BugReport';
import Festival from '@mui/icons-material/Festival';

// Religious & Spiritual
import Church from '@mui/icons-material/Church';
import AutoStories from '@mui/icons-material/AutoStories';

// Communication & Social
import Phone from '@mui/icons-material/Phone';
import PhoneInTalk from '@mui/icons-material/PhoneInTalk';
import Mail from '@mui/icons-material/Mail';
import Chat from '@mui/icons-material/Chat';
import Send from '@mui/icons-material/Send';
import Share from '@mui/icons-material/Share';
import Group from '@mui/icons-material/Group';
import PersonAdd from '@mui/icons-material/PersonAdd';
import HowToReg from '@mui/icons-material/HowToReg';
import Handshake from '@mui/icons-material/Handshake';
import Celebration from '@mui/icons-material/Celebration';

// UI Actions
import Add from '@mui/icons-material/Add';
import Remove from '@mui/icons-material/Remove';
import Close from '@mui/icons-material/Close';
import Check from '@mui/icons-material/Check';
import Save from '@mui/icons-material/Save';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Refresh from '@mui/icons-material/Refresh';
import Search from '@mui/icons-material/Search';
import FilterList from '@mui/icons-material/FilterList';
import Settings from '@mui/icons-material/Settings';
import Menu from '@mui/icons-material/Menu';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import MoreVert from '@mui/icons-material/MoreVert';
import Error from '@mui/icons-material/Error';
import Warning from '@mui/icons-material/Warning';
import Info from '@mui/icons-material/Info';
import Help from '@mui/icons-material/Help';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import CalendarToday from '@mui/icons-material/CalendarToday';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Logout from '@mui/icons-material/Logout';
import Download from '@mui/icons-material/Download';
import Image from '@mui/icons-material/Image';
import AttachFile from '@mui/icons-material/AttachFile';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import HelpOutline from '@mui/icons-material/HelpOutline';

// Mapping: Lucide icon name → MUI icon component
const iconMap: Record<string, React.ElementType<SvgIconProps>> = {
  // Finance & Money
  Wallet: AccountBalanceWallet,
  PiggyBank: Savings,
  DollarSign: AttachMoney,
  CreditCard: CreditCard,
  Banknote: Payments,
  Coins: MonetizationOn,
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  BarChart: BarChart,
  BarChart2: StackedBarChart,
  PieChart: PieChart,
  LineChart: ShowChart,
  Receipt: Receipt,
  Calculator: Calculate,
  Percent: Percent,
  CircleDollarSign: PriceChange,
  BadgeDollarSign: Loyalty,

  // Work & Business
  Briefcase: Work,
  Building: Business,
  Building2: CorporateFare,
  Factory: Factory,
  Landmark: AccountBalance,
  Store: Store,
  ShoppingCart: ShoppingCart,
  Package: Inventory2,
  Boxes: AllInbox,
  Archive: Archive,
  FileText: Description,
  ClipboardList: ListAlt,

  // Food & Drink
  Utensils: Restaurant,
  Coffee: Coffee,
  Pizza: LocalPizza,
  Beer: SportsBar,
  Wine: WineBar,
  Milk: LocalCafe,
  IceCream2: Icecream,
  Cake: Cake,
  Cookie: Cookie,
  Apple: Apple,
  Salad: LocalDining,
  Soup: SoupKitchen,
  Sandwich: Fastfood,
  Beef: SetMeal,
  Fish: SetMeal,
  Egg: Egg,
  CupSoda: LocalCafe,
  Martini: SportsBar,
  UtensilsCrossed: NoMeals,
  ChefHat: DinnerDining,

  // Transport & Travel
  Car: DirectionsCar,
  Bus: DirectionsBus,
  Bike: PedalBike,
  Plane: Flight,
  Train: Train,
  Ship: DirectionsBoat,
  Fuel: LocalGasStation,
  ParkingCircle: LocalParking,
  Navigation: Navigation,
  Map: Map,
  MapPin: LocationOn,
  Compass: Explore,
  Globe: Language,
  Anchor: Anchor,
  Rocket: RocketLaunch,
  Truck: LocalShipping,
  Sailboat: Sailing,
  Tractor: Agriculture,

  // Shopping & Lifestyle
  ShoppingBag: ShoppingBag,
  Gift: CardGiftcard,
  Tag: Label,
  Tags: Sell,
  Ticket: ConfirmationNumber,
  Gem: Diamond,
  Crown: Stars,
  Shirt: Checkroom,
  Glasses: Visibility, // no Glasses in MUI, use Visibility as proxy
  Watch: Watch,
  Scissors: ContentCut,
  Sparkles: AutoAwesome,
  Star: Star,
  Heart: Favorite,
  Flower: LocalFlorist,
  Flower2: LocalFlorist,
  Palette: Palette,
  Paintbrush: Brush,

  // Electronics & Tech
  Smartphone: Smartphone,
  Laptop: LaptopMac,
  Monitor: DesktopMac,
  Tv: Tv,
  Tablet: TabletMac,
  Camera: PhotoCamera,
  Headphones: Headphones,
  Speaker: VolumeUp,
  Radio: Radio,
  Wifi: Wifi,
  Bluetooth: Bluetooth,
  Battery: BatteryFull,
  Cable: Cable,
  Cpu: Memory,
  HardDrive: Storage,
  Printer: Print,
  Mouse: Mouse,
  Keyboard: Keyboard,
  Gamepad: VideogameAsset,
  Joystick: SportsEsports,
  Image: Image,
  Paperclip: AttachFile,

  // Home & Utilities
  Home: Home,
  Bed: Hotel,
  Sofa: Weekend,
  Lamp: Light,
  LampDesk: Nightlight,
  Lightbulb: Lightbulb,
  Zap: Bolt,
  Plug: Power,
  Thermometer: DeviceThermostat,
  Fan: Air,
  AirVent: AcUnit,
  Droplet: WaterDrop,
  Droplets: Water,
  Flame: Whatshot,
  Snowflake: AcUnit,
  Wind: Air,
  Hammer: Hardware,
  Wrench: Build,
  Key: Key,
  Lock: Lock,
  DoorOpen: DoorFront,
  Trash2: Delete,
  Recycle: Recycling,
  Leaf: Nature,
  TreePine: Park,
  Trees: Forest,

  // Health & Wellness
  HeartPulse: MonitorHeart,
  Stethoscope: HealthAndSafety,
  Pill: Medication,
  Syringe: Vaccines,
  Activity: FitnessCenter,
  Dumbbell: FitnessCenter,
  PersonStanding: DirectionsWalk,
  Footprints: DirectionsWalk,
  Brain: Psychology,
  Eye: Visibility,
  Ear: SettingsAccessibility,
  Hand: PanTool,
  CircleUser: AccountCircle,
  Smile: SentimentSatisfied,
  Frown: SentimentDissatisfied,
  Sun: WbSunny,
  Moon: DarkMode,
  CloudSun: WbCloudy,
  Umbrella: BeachAccess,
  Shield: Security,
  ShieldCheck: VerifiedUser,

  // Education & Kids
  BookOpen: MenuBook,
  Book: Book,
  BookMarked: Bookmark,
  Notebook: EditNote,
  GraduationCap: School,
  School: School,
  Pencil: Edit,
  PenTool: Draw,
  Highlighter: Highlight,
  Eraser: Straighten,
  Ruler: Straighten,
  Backpack: Backpack,
  Baby: ChildFriendly,
  ToyBrick: Toys,
  Puzzle: Extension,

  // Entertainment
  Music: MusicNote,
  Music2: MusicNote,
  Music3: LibraryMusic,
  Music4: Audiotrack,
  Mic: Mic,
  Mic2: MicExternalOn,
  Video: Videocam,
  Film: Movie,
  Clapperboard: Theaters,
  Popcorn: LocalMovies,
  Dice1: Casino,
  Dice5: Casino,
  Trophy: EmojiEvents,
  Medal: MilitaryTech,

  // Nature & Outdoors
  Mountain: Landscape,
  MountainSnow: FilterHdr,
  Waves: Waves,
  Sunrise: WbTwilight,
  Sunset: WbTwilight,
  Cloud: Cloud,
  CloudRain: Thunderstorm,
  CloudSnow: AcUnit,
  Rainbow: AutoAwesome,
  Bird: Pets,
  Cat: Pets,
  Dog: Pets,
  Bug: BugReport,
  Rabbit: Pets,
  Squirrel: Pets,
  Tent: Festival,
  Binoculars: Search,
  Flashlight: Bolt,

  // Religious & Spiritual
  Church: Church,
  Cross: Add,
  BookHeart: AutoStories,

  // Communication & Social
  Phone: Phone,
  PhoneCall: PhoneInTalk,
  Mail: Mail,
  MessageCircle: Chat,
  Send: Send,
  Share: Share,
  Users: Group,
  UserPlus: PersonAdd,
  UserCheck: HowToReg,
  Handshake: Handshake,
  PartyPopper: Celebration,

  // UI Actions
  Plus: Add,
  Minus: Remove,
  X: Close,
  Check: Check,
  Edit: Edit,
  Save: Save,
  ArrowRight: ArrowForward,
  ArrowLeft: ArrowBack,
  ArrowUp: ArrowUpward,
  ArrowDown: ArrowDownward,
  RefreshCw: Refresh,
  Search: Search,
  Filter: FilterList,
  Settings: Settings,
  Menu: Menu,
  MoreHorizontal: MoreHoriz,
  MoreVertical: MoreVert,
  AlertCircle: Error,
  AlertTriangle: Warning,
  Info: Info,
  HelpCircle: Help,
  CheckCircle: CheckCircle,
  XCircle: Cancel,
  Calendar: CalendarToday,
  CalendarDays: CalendarMonth,
  LogOut: Logout,
  Download: Download,
  Database: Storage,
  Loader: HourglassEmpty,
};

interface IconDisplayProps {
  name: string;
  className?: string;
  size?: number;
  sx?: SxProps<Theme>;
}

const IconDisplay: React.FC<IconDisplayProps> = ({ name, className, size = 20, sx }) => {
  const IconComponent = iconMap[name] ?? HelpOutline;
  return (
    <IconComponent
      className={className}
      sx={{ fontSize: size, ...sx as object }}
    />
  );
};

export default IconDisplay;
