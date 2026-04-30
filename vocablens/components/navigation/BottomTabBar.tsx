import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../ui/Icon';
import { colors } from '../../constants/theme';

type Tab = {
  key: string;
  icon: 'play' | 'bar-chart-2' | 'plus' | 'list' | 'settings';
  label: string;
  isCenter?: boolean;
};

const TABS: Tab[] = [
  { key: 'play', icon: 'play', label: 'Play' },
  { key: 'stats', icon: 'bar-chart-2', label: 'Stats' },
  { key: 'add', icon: 'plus', label: 'Add', isCenter: true },
  { key: 'vocab', icon: 'list', label: 'Vocab' },
  { key: 'settings', icon: 'settings', label: 'Settings' },
];

type BottomTabBarProps = {
  activeTab: string;
  onTabPress: (tabKey: string) => void;
};

const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          if (tab.isCenter) {
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.centerButton}
                onPress={() => onTabPress(tab.key)}
                activeOpacity={0.7}
              >
                <View style={styles.centerCircle}>
                  <Icon name="plus" size={28} color="#ffffff" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.icon}
                size={22}
                color={isActive ? '#ffffff' : '#6b7280'}
                strokeWidth={isActive ? 2 : 1.5}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020205',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128, 128, 128, 0.3)',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  centerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  centerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomTabBar;
