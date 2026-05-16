import React from 'react';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';

type IconName =
  | 'trophy'
  | 'infinity'
  | 'plus'
  | 'list'
  | 'settings'
  | 'arrow-right'
  | 'more-vertical'
  | 'check'
  | 'x'
  | 'chevron-right'
  | 'upload'
  | 'download'
  | 'search'
  | 'bar-chart-2'
  | 'play'
  | 'flame'
  | 'trend-up'
  | 'trend-down'
  | 'target'
  | 'zap'
  | 'calendar'
  | 'activity'
  | 'eye-off'
  | 'square'
  | 'check-square'
  | 'x-circle'
  | 'info'
  | 'check-circle';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

// All icons are 24x24 viewBox, stroke-based (modern outline style)
const iconPaths: Record<IconName, string> = {
  trophy:
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M6 9V4h12v5M6 9a6 6 0 0 0 6 6m6-6a6 6 0 0 1-6 6m0 0v3m-4 3h8m-6 0v-3m4 3v-3',
  infinity:
    'M8 12a4 4 0 1 0 0-0.01M16 12a4 4 0 1 0 0-0.01',
  plus: 'M12 5v14M5 12h14',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  'more-vertical': '',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  'chevron-right': 'M9 18l6-6-6-6',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35',
  'bar-chart-2': 'M18 20V10M12 20V4M6 20v-6',
  play: 'M5 3l14 9-14 9V3z',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  'trend-up': 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  'trend-down': 'M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  calendar: 'M3 4h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M3 10h18',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  'eye-off': 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22',
  square: 'M3 3h18v18H3z',
  'check-square': 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  'x-circle': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6',
  info: 'M12 16v-4M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
  'check-circle': 'M9 12l2 2 4-4M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
};

const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#ffffff', strokeWidth = 1.8 }) => {
  // Special case: more-vertical uses circles instead of paths
  if (name === 'more-vertical') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <SvgCircle cx="12" cy="5" r="1.5" fill={color} />
        <SvgCircle cx="12" cy="12" r="1.5" fill={color} />
        <SvgCircle cx="12" cy="19" r="1.5" fill={color} />
      </Svg>
    );
  }

  // Special case: infinity uses a custom path rendering
  if (name === 'infinity') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.267-8-5.096 0-5.096 8 0 8 5.134 0 7.172-8 12.267-8Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={iconPaths[name]}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Icon;
