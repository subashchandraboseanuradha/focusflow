// Mock for lucide-react
const React = require('react');

// Create mock components for all the icons used in the project
const mockIcon = (name) => {
  return React.forwardRef((props, ref) => {
    return React.createElement('svg', {
      ...props,
      ref,
      'data-testid': `${name}-icon`,
      role: 'img',
      'aria-label': name,
    });
  });
};

module.exports = {
  PlayCircle: mockIcon('PlayCircle'),
  Loader2: mockIcon('Loader2'),
  History: mockIcon('History'),
  Hourglass: mockIcon('Hourglass'),
  Clock: mockIcon('Clock'),
  CheckCircle: mockIcon('CheckCircle'),
  AlertCircle: mockIcon('AlertCircle'),
  TrendingUp: mockIcon('TrendingUp'),
  Target: mockIcon('Target'),
  Calendar: mockIcon('Calendar'),
  BarChart: mockIcon('BarChart'),
  HelpCircle: mockIcon('HelpCircle'),
  AlertTriangle: mockIcon('AlertTriangle'),
  // Add any other icons you use
};
