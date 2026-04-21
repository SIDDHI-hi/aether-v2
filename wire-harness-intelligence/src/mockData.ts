export interface Wire {
  id: string;
  source: string;
  target: string;
  label: string;
  voltage: string;
}

export interface Connector {
  id: string;
  x: number;
  y: number;
  z?: number;
  width: number;
  height: number;
  label: string;
}

export type DiffState = 'added' | 'removed' | 'modified' | 'unchanged';
export type RiskScore = 'high' | 'medium' | 'low';

export interface HarnessData {
  connectors: Connector[];
  wires: Wire[];
  diff_state: Record<string, DiffState>;
  risk_score: Record<string, RiskScore>;
}

export const mockHarnessData: HarnessData = {
  connectors: [
    { id: 'C1', x: 10,  y: 15,  z: 0,  width: 80,  height: 40, label: 'Main ECU' },
    { id: 'C2', x: 40,  y: 10,  z: 2,  width: 60,  height: 60, label: 'Sensor A' },
    { id: 'C3', x: 40,  y: 25,  z: 0,  width: 60,  height: 60, label: 'Sensor B' },
    { id: 'C4', x: 70,  y: 18,  z: 3,  width: 100, height: 50, label: 'Power Dist' },
    { id: 'C5', x: 55,  y: 5,   z: 1,  width: 60,  height: 40, label: 'ADAS Module' },
    { id: 'C6', x: 25,  y: 40,  z: 0,  width: 60,  height: 40, label: 'Body Control' },
    { id: 'C7', x: 80,  y: 40,  z: 2,  width: 60,  height: 40, label: 'Rear Gateway' },
    { id: 'C8', x: 60,  y: 30,  z: 5,  width: 60,  height: 40, label: 'Infotainment' },
  ],
  wires: [
    // Legacy routing: C1 → C3 → C6 → C7 (long detour through body control)
    { id: 'W1',  source: 'C1', target: 'C2',  label: 'CAN_H',   voltage: '5V' },
    { id: 'W2',  source: 'C1', target: 'C3',  label: 'CAN_L',   voltage: '5V' },
    { id: 'W3',  source: 'C2', target: 'C4',  label: 'PWR_12V', voltage: '12V' },
    { id: 'W4',  source: 'C3', target: 'C4',  label: 'GND',     voltage: '0V' },
    // Additional edges enabling Dijkstra shortcuts
    { id: 'W5',  source: 'C1', target: 'C6',  label: 'LIN_BUS', voltage: '12V' },
    { id: 'W6',  source: 'C6', target: 'C7',  label: 'FLEXRAY', voltage: '12V' },
    { id: 'W7',  source: 'C3', target: 'C6',  label: 'GND_RTN', voltage: '0V' },
    { id: 'W8',  source: 'C4', target: 'C7',  label: 'PWR_HV',  voltage: '48V' },
    { id: 'W9',  source: 'C2', target: 'C5',  label: 'RADAR',   voltage: '5V' },
    { id: 'W10', source: 'C5', target: 'C4',  label: 'ETH_AVB', voltage: '5V' },
    { id: 'W11', source: 'C4', target: 'C8',  label: 'USB_SS',  voltage: '5V' },
    { id: 'W12', source: 'C7', target: 'C8',  label: 'HDMI_ARC',voltage: '5V' },
    { id: 'W13', source: 'C3', target: 'C8',  label: 'AV_BUS',  voltage: '5V' },
    { id: 'W14', source: 'C5', target: 'C8',  label: 'LIDAR',   voltage: '12V' },
  ],
  diff_state: {
    'C1': 'unchanged', 'C2': 'added',    'C3': 'modified', 'C4': 'unchanged',
    'C5': 'added',     'C6': 'unchanged','C7': 'modified', 'C8': 'added',
    'W1': 'added',  'W2': 'modified', 'W3': 'removed',  'W4': 'unchanged',
    'W5': 'added',  'W6': 'unchanged','W7': 'modified', 'W8': 'unchanged',
    'W9': 'added',  'W10':'unchanged','W11':'modified', 'W12':'unchanged',
    'W13':'added',  'W14':'unchanged',
  },
  risk_score: {
    'C1': 'low',  'C2': 'medium', 'C3': 'low',    'C4': 'high',
    'C5': 'medium','C6': 'low',   'C7': 'high',   'C8': 'medium',
    'W1': 'low',   'W2': 'medium','W3': 'high',   'W4': 'low',
    'W5': 'medium','W6': 'low',   'W7': 'medium', 'W8': 'high',
    'W9': 'low',   'W10':'medium','W11':'low',    'W12':'medium',
    'W13':'high',  'W14':'low',
  }
};
