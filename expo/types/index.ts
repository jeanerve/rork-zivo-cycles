export type CycleType = 'individual' | 'family' | 'community' | 'teen';

export type ContributionFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export type InviteStatus = 'pending' | 'accepted' | 'declined';

export type MemberPermission = 'view' | 'contribute' | 'manage';

export type AccountType = 'adult' | 'teen';

export type ParentApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface Member {
  id: string;
  name: string;
  avatar: string;
  totalContributed: number;
  isParent?: boolean;
  role?: 'owner' | 'member' | 'guardian';
  email?: string;
  phone?: string;
  inviteStatus?: InviteStatus;
  inviteLink?: string;
  inviteSentAt?: string;
  permissions?: MemberPermission[];
}

export interface Contribution {
  id: string;
  cycleId: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  type: 'contribution' | 'withdrawal';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

export type CycleStatus = 'active' | 'completed' | 'cancelled';

export interface WithdrawalRequest {
  id: string;
  cycleId: string;
  requesterId: string;
  requesterName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  approvals: { memberId: string; memberName: string; approved: boolean; date: string }[];
  requiredApprovals: number;
}

export interface Cycle {
  id: string;
  name: string;
  type: CycleType;
  goalAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  frequency: ContributionFrequency;
  members: Member[];
  contributions: Contribution[];
  createdBy: string;
  color: string;
  icon: string;
  parentApprovalRequired?: boolean;
  spendingLimit?: number;
  status?: CycleStatus;
  completedAt?: string;
  withdrawalRequests?: WithdrawalRequest[];
  purpose?: string;
  motivation?: string;
  achievementPostId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'contribution' | 'reminder' | 'milestone' | 'withdrawal' | 'member' | 'completion' | 'withdrawal_request';
  cycleId?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'bank' | 'debit' | 'credit';
  name: string;
  last4: string;
  isDefault: boolean;
  addedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  totalSaved: number;
  activeCycles: number;
  completedCycles: number;
  streak: number;
  disciplineScore: number;
  badges: Badge[];
  joinDate: string;
  dateOfBirth?: string;
  accountType?: AccountType;
  parentApprovalStatus?: ParentApprovalStatus;
  parentEmail?: string;
  paymentMethods?: PaymentMethod[];
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type CycleStage = 'start' | 'in_progress' | 'almost_there' | 'completed' | 'achieved';

export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  cycleId: string;
  cycleName: string;
  title: string;
  description: string;
  amountSaved: number;
  imageUrl?: string;
  createdAt: string;
  likes: string[];
  comments: FeedComment[];
}

export interface FeedComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface GraphDataPoint {
  date: string;
  amount: number;
  label?: string;
  type?: 'deposit' | 'withdrawal';
  changeAmount?: number;
}

export type PaymentStatus = 'on_time' | 'partial' | 'late' | 'missed' | 'grace_period' | 'upcoming';

export interface PaymentRecord {
  id: string;
  cycleId: string;
  memberId: string;
  dueDate: string;
  requiredAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  gracePeriodEnd?: string;
  contributions: string[];
  carryOver: number;
}

export interface DisciplineInfo {
  score: number;
  label: string;
  onTimeCount: number;
  lateCount: number;
  missedCount: number;
  partialCount: number;
  totalPayments: number;
}

export type InsightType = 'streak' | 'milestone' | 'spending' | 'encouragement' | 'tip' | 'goal';

export type VerificationType = 'identity' | 'bank' | 'saver' | 'elite';

export interface VerificationBadge {
  type: VerificationType;
  label: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

export type SpendingCategoryType = 'food' | 'shopping' | 'entertainment' | 'lifestyle' | 'gaming' | 'transport' | 'other';

export interface SpendingCategory {
  id: string;
  type: SpendingCategoryType;
  label: string;
  emoji: string;
  monthlyBudget: number;
  currentSpend: number;
  isLocked: boolean;
  lockedAt?: string;
  autoLock: boolean;
}

export interface RoundUpSettings {
  enabled: boolean;
  destination: 'active_cycle' | 'milestone_goal' | 'savings';
  cycleId?: string;
  totalRounded: number;
}

export interface CardDetails {
  cardNumber: string;
  last4: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  addedToWallet: boolean;
}

export interface BoostRecord {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  milestone: string;
  message?: string;
  createdAt: string;
}

export type CycleHealthFactor = 'on_time_payments' | 'streak' | 'missed_payments' | 'goal_completion' | 'challenge_participation';

export interface CycleHealth {
  score: number;
  label: string;
  factors: { factor: CycleHealthFactor; score: number; label: string }[];
}

export interface ChallengeMember {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  amountSaved: number;
  rank: number;
  daysRemaining: number;
  verificationBadges: VerificationType[];
}

export interface ChallengeDashboard {
  challengeId: string;
  members: ChallengeMember[];
  rules: string[];
  potSize: number;
  totalDays: number;
  daysRemaining: number;
}

export interface AIInsight {
  id: string;
  text: string;
  type: InsightType;
  emoji?: string;
  createdAt: string;
}

export type ChallengeType = 'no_spend' | 'daily_save' | 'student' | 'emergency_fund' | 'custom';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  durationDays: number;
  targetAmount?: number;
  dailyAmount?: number;
  participants: number;
  emoji: string;
  color: string;
}

export interface UserChallenge {
  id: string;
  challengeId: string;
  joinedAt: string;
  completedAt?: string;
  progress: number;
  status: 'active' | 'completed' | 'abandoned';
  daysCompleted: number;
}

export interface ChallengeWithDashboard extends Challenge {
  dashboard?: ChallengeDashboard;
}

export interface CyclePlan {
  contributionAmount: number;
  contributionPerPerson: number;
  totalContributions: number;
  estimatedEndDate: string;
  frequency: ContributionFrequency;
  goalAmount: number;
  currentAmount: number;
  remainingAmount: number;
  remainingContributions: number;
  memberCount: number;
}
