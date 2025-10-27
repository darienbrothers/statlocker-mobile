/**
 * Icon Component - General purpose icon system
 * 
 * Features:
 * - Consistent Lucide React Native icons
 * - Standard sizes and colors from design tokens
 * - Support for all common icons used in the app
 * - Accessibility compliance
 */
import React from 'react';
import { 
  // Navigation
  Home, 
  TrendingUp, 
  Target, 
  Compass,
  
  // Actions
  Plus,
  Edit,
  Trash2,
  Save,
  Share,
  Download,
  Upload,
  
  // UI
  Search,
  Filter,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  
  // Status
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  
  // Content
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Mail,
  Phone,
  
  type LucideIcon 
} from 'lucide-react-native';

export type IconName = 
  // Navigation
  | 'home' 
  | 'trending-up' 
  | 'target' 
  | 'compass'
  
  // Actions
  | 'plus'
  | 'edit'
  | 'trash'
  | 'save'
  | 'share'
  | 'download'
  | 'upload'
  
  // UI
  | 'search'
  | 'filter'
  | 'settings'
  | 'menu'
  | 'x'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  
  // Status
  | 'check'
  | 'alert'
  | 'info'
  | 'help'
  
  // Content
  | 'calendar'
  | 'clock'
  | 'map-pin'
  | 'user'
  | 'users'
  | 'mail'
  | 'phone';

export type IconSize = 'small' | 'default' | 'large' | 'xl';
export type IconColor = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted';

interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: IconColor | string;
  filled?: boolean;
  strokeWidth?: number;
  testID?: string;
  accessibilityLabel?: string;
}

const iconMap: Record<IconName, LucideIcon> = {
  // Navigation
  home: Home,
  'trending-up': TrendingUp,
  target: Target,
  compass: Compass,
  
  // Actions
  plus: Plus,
  edit: Edit,
  trash: Trash2,
  save: Save,
  share: Share,
  download: Download,
  upload: Upload,
  
  // UI
  search: Search,
  filter: Filter,
  settings: Settings,
  menu: Menu,
  x: X,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  
  // Status
  check: Check,
  alert: AlertCircle,
  info: Info,
  help: HelpCircle,
  
  // Content
  calendar: Calendar,
  clock: Clock,
  'map-pin': MapPin,
  user: User,
  users: Users,
  mail: Mail,
  phone: Phone,
};

const sizeMap: Record<IconSize, number> = {
  small: 16,
  default: 24,
  large: 32,
  xl: 40,
};

const colorMap: Record<IconColor, string> = {
  default: '#374151', // gray-700
  primary: '#0047AB', // primary-900
  success: '#059669', // green-600
  warning: '#D97706', // yellow-600
  danger: '#DC2626',  // red-600
  muted: '#6B7280',   // gray-500
};

export function Icon({ 
  name, 
  size = 'default',
  color = 'default',
  filled = false,
  strokeWidth = 1.5,
  testID,
  accessibilityLabel,
}: IconProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon: Unknown icon name "${name}"`);
    return null;
  }

  // Resolve size
  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  
  // Resolve color
  const iconColor = colorMap[color as IconColor] || color;
  
  return (
    <IconComponent 
      size={iconSize}
    />
  );
}

export default Icon;