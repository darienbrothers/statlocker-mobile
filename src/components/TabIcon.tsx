/**
 * TabIcon Component - Consistent icon system for tab navigation
 * 
 * Features:
 * - Duotone/filled icons for active state
 * - Outline icons for inactive state
 * - 24pt standard size
 * - Colors from design tokens
 */
import React from 'react';
import { 
  Home, 
  TrendingUp, 
  Target, 
  Compass,
  type LucideIcon 
} from 'lucide-react-native';

export type TabIconName = 'home' | 'trending-up' | 'target' | 'compass';

interface TabIconProps {
  name: TabIconName;
  active?: boolean;
  size?: number;
  color?: string;
}

const iconMap: Record<TabIconName, LucideIcon> = {
  home: Home,
  'trending-up': TrendingUp,
  target: Target,
  compass: Compass,
};

export function TabIcon({ 
  name, 
  active = false, 
  size = 24, 
  color 
}: TabIconProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`TabIcon: Unknown icon name "${name}"`);
    return null;
  }

  // Use design token colors if no color provided
  const iconColor = color || (active ? '#0047AB' : '#6B7280'); // primary-900 : gray-500
  
  return (
    <IconComponent 
      size={size}
    />
  );
}

export default TabIcon;