import { Cycle, Notification, Badge, GraphDataPoint } from '@/types';

export const MOCK_BADGES: Badge[] = [
  { id: '1', name: 'First Save', icon: 'star', description: 'Made your first contribution', earned: false },
  { id: '2', name: '7-Day Streak', icon: 'flame', description: 'Saved for 7 days straight', earned: false },
  { id: '3', name: 'Goal Crusher', icon: 'trophy', description: 'Completed a savings goal', earned: false },
];

export const MOCK_CYCLES: Cycle[] = [
  {
    id: 'cycle-1',
    name: 'Emergency Fund',
    type: 'individual',
    goalAmount: 5000,
    currentAmount: 2350,
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    frequency: 'weekly',
    members: [
      { id: 'user-1', name: 'Louis', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', totalContributed: 2350 },
    ],
    contributions: [
      { id: 'c1', cycleId: 'cycle-1', memberId: 'user-1', memberName: 'Louis', amount: 200, date: '2026-03-20T10:00:00', type: 'contribution' },
      { id: 'c2', cycleId: 'cycle-1', memberId: 'user-1', memberName: 'Louis', amount: 150, date: '2026-03-13T10:00:00', type: 'contribution' },
      { id: 'c3', cycleId: 'cycle-1', memberId: 'user-1', memberName: 'Louis', amount: 200, date: '2026-03-06T10:00:00', type: 'contribution' },
      { id: 'c4', cycleId: 'cycle-1', memberId: 'user-1', memberName: 'Louis', amount: 100, date: '2026-02-27T10:00:00', type: 'contribution' },
      { id: 'c5', cycleId: 'cycle-1', memberId: 'user-1', memberName: 'Louis', amount: 200, date: '2026-02-20T10:00:00', type: 'contribution' },
      { id: 'c6', cycleId: 'cycle-1', memberId: 'user-1', memberName: 'Louis', amount: 250, date: '2026-02-13T10:00:00', type: 'contribution' },
      { id: 'c7', cycleId: 'cycle-1', memberId: 'user-1', memberName: 'Louis', amount: 300, date: '2026-02-06T10:00:00', type: 'contribution' },
      { id: 'c8', cycleId: 'cycle-1', memberId: 'user-1', memberName: 'Louis', amount: 200, date: '2026-01-30T10:00:00', type: 'contribution' },
      { id: 'c9', cycleId: 'cycle-1', memberId: 'user-1', memberName: 'Louis', amount: 350, date: '2026-01-23T10:00:00', type: 'contribution' },
      { id: 'c10', cycleId: 'cycle-1', memberId: 'user-1', memberName: 'Louis', amount: 400, date: '2026-01-15T10:00:00', type: 'contribution' },
    ],
    createdBy: 'user-1',
    color: '#3B82F6',
    icon: 'shield',
  },
  {
    id: 'cycle-2',
    name: 'Family Vacation',
    type: 'family',
    goalAmount: 8000,
    currentAmount: 3200,
    startDate: '2026-01-15',
    endDate: '2026-08-15',
    frequency: 'biweekly',
    members: [
      { id: 'user-1', name: 'Louis', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', totalContributed: 1600 },
      { id: 'user-2', name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face', totalContributed: 1000 },
      { id: 'user-3', name: 'Jake', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face', totalContributed: 600 },
    ],
    contributions: [
      { id: 'c11', cycleId: 'cycle-2', memberId: 'user-1', memberName: 'Louis', amount: 300, date: '2026-03-22T10:00:00', type: 'contribution' },
      { id: 'c12', cycleId: 'cycle-2', memberId: 'user-2', memberName: 'Sarah', amount: 250, date: '2026-03-20T10:00:00', type: 'contribution' },
      { id: 'c13', cycleId: 'cycle-2', memberId: 'user-3', memberName: 'Jake', amount: 150, date: '2026-03-18T10:00:00', type: 'contribution' },
      { id: 'c14', cycleId: 'cycle-2', memberId: 'user-1', memberName: 'Louis', amount: 300, date: '2026-03-08T10:00:00', type: 'contribution' },
      { id: 'c15', cycleId: 'cycle-2', memberId: 'user-2', memberName: 'Sarah', amount: 250, date: '2026-03-06T10:00:00', type: 'contribution' },
    ],
    createdBy: 'user-1',
    color: '#A855F7',
    icon: 'home',
  },
  {
    id: 'cycle-3',
    name: 'Neighborhood Fund',
    type: 'community',
    goalAmount: 15000,
    currentAmount: 6800,
    startDate: '2026-02-01',
    endDate: '2026-12-31',
    frequency: 'monthly',
    members: [
      { id: 'user-1', name: 'Louis', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', totalContributed: 1200 },
      { id: 'user-4', name: 'Maria Lopez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face', totalContributed: 1800 },
      { id: 'user-5', name: 'David Chen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', totalContributed: 2000 },
      { id: 'user-6', name: 'Priya Patel', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face', totalContributed: 1800 },
    ],
    contributions: [
      { id: 'c16', cycleId: 'cycle-3', memberId: 'user-5', memberName: 'David Chen', amount: 500, date: '2026-03-24T10:00:00', type: 'contribution' },
      { id: 'c17', cycleId: 'cycle-3', memberId: 'user-4', memberName: 'Maria Lopez', amount: 400, date: '2026-03-22T10:00:00', type: 'contribution' },
    ],
    createdBy: 'user-1',
    color: '#14B8A6',
    icon: 'users',
  },

];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Contribution Added', message: 'You added $200 to Emergency Fund', date: '2026-03-25T10:30:00', read: false, type: 'contribution', cycleId: 'cycle-1' },
  { id: 'n2', title: 'Sarah Contributed!', message: 'Sarah added $250 to Family Vacation', date: '2026-03-24T14:15:00', read: false, type: 'member', cycleId: 'cycle-2' },
  { id: 'n3', title: 'Milestone Reached!', message: 'Neighborhood Fund passed $6,500!', date: '2026-03-24T09:00:00', read: true, type: 'milestone', cycleId: 'cycle-3' },
  { id: 'n4', title: 'Contribution Reminder', message: 'Your weekly contribution to Emergency Fund is due', date: '2026-03-23T08:00:00', read: true, type: 'reminder', cycleId: 'cycle-1' },
  { id: 'n5', title: 'David Contributed!', message: 'David Chen added $500 to Neighborhood Fund', date: '2026-03-22T16:45:00', read: true, type: 'member', cycleId: 'cycle-3' },
  { id: 'n6', title: '12-Day Streak!', message: 'You\'re on fire! Keep the discipline going.', date: '2026-03-21T07:00:00', read: true, type: 'milestone' },
  { id: 'n7', title: 'Tom Contributed!', message: 'Tom Rivera added $500 to New Equipment', date: '2026-03-21T11:30:00', read: true, type: 'member', cycleId: 'cycle-4' },
];

export const MOCK_GRAPH_DATA: GraphDataPoint[] = [
  { date: '2026-01-15', amount: 400 },
  { date: '2026-01-23', amount: 750 },
  { date: '2026-01-30', amount: 950 },
  { date: '2026-02-06', amount: 1250 },
  { date: '2026-02-13', amount: 1500 },
  { date: '2026-02-20', amount: 1700 },
  { date: '2026-02-27', amount: 1800 },
  { date: '2026-03-06', amount: 2000 },
  { date: '2026-03-13', amount: 2150 },
  { date: '2026-03-20', amount: 2350 },
];

export const CYCLE_TYPE_INFO = {
  individual: {
    label: 'Individual',
    description: 'Personal savings goal just for you',
    icon: 'user' as const,
    examples: ['Emergency fund', 'New phone', 'Travel savings'],
  },
  family: {
    label: 'Family',
    description: 'Save together with your family members',
    icon: 'home' as const,
    examples: ['Vacation', 'Home renovation', 'Holiday gifts'],
  },
  community: {
    label: 'Community',
    description: 'Group savings with community members',
    icon: 'users' as const,
    examples: ['Neighborhood project', 'Charity drive', 'Group investment'],
  },

  teen: {
    label: 'Teen',
    description: 'Guided savings with guardian controls',
    icon: 'graduation-cap' as const,
    examples: ['First car', 'College fund', 'Gaming setup'],
  },
};
