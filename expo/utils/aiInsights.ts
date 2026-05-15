import { Cycle, Contribution, AIInsight, InsightType } from '@/types';

interface InsightContext {
  userName: string;
  streak: number;
  totalSaved: number;
  disciplineScore: number;
  activeCycles: number;
  completedCycles: number;
  cycles: Cycle[];
  userId: string;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function getUserContribs(cycles: Cycle[], userId: string): Contribution[] {
  const contribs: Contribution[] = [];
  for (const c of cycles) {
    for (const ct of c.contributions) {
      if (ct.memberId === userId) contribs.push(ct);
    }
  }
  return contribs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Build a list of calm, supportive, personalized financial insights from
 * the user's saving behavior. Deterministic & runs locally so the AI
 * section always feels alive without latency.
 */
export function buildInsights(ctx: InsightContext): AIInsight[] {
  const now = new Date();
  const out: AIInsight[] = [];
  const firstName = ctx.userName.split(' ')[0];
  const userContribs = getUserContribs(ctx.cycles, ctx.userId);

  const last7 = userContribs.filter(c => {
    const d = new Date(c.date);
    return now.getTime() - d.getTime() < 7 * 86400000 && c.type === 'contribution';
  });
  const last7Sum = last7.reduce((s, c) => s + c.amount, 0);

  const last14 = userContribs.filter(c => {
    const d = new Date(c.date);
    return now.getTime() - d.getTime() < 14 * 86400000 && c.type === 'contribution';
  });

  if (ctx.streak >= 14) {
    out.push({
      id: 'streak-strong',
      type: 'streak',
      emoji: '🔥',
      text: `${firstName}, you've shown up ${ctx.streak} days in a row. That's how habits become identity.`,
      createdAt: now.toISOString(),
    });
  } else if (ctx.streak >= 7) {
    out.push({
      id: 'streak-week',
      type: 'streak',
      emoji: '✨',
      text: `Two solid weeks of consistency. You're building something real.`,
      createdAt: now.toISOString(),
    });
  } else if (ctx.streak >= 3) {
    out.push({
      id: 'streak-start',
      type: 'streak',
      emoji: '🌱',
      text: `A ${ctx.streak}-day streak. The first steps are always the heaviest — you carried them.`,
      createdAt: now.toISOString(),
    });
  } else if (userContribs.length === 0) {
    out.push({
      id: 'welcome',
      type: 'encouragement',
      emoji: '🌿',
      text: `Welcome, ${firstName}. Saving isn't about how much — it's about showing up. Start with whatever feels light.`,
      createdAt: now.toISOString(),
    });
  }

  if (last7Sum > 0) {
    out.push({
      id: 'week-sum',
      type: 'milestone',
      emoji: '📈',
      text: `You've saved $${last7Sum.toLocaleString()} this week. Quiet progress is still progress.`,
      createdAt: now.toISOString(),
    });
  }

  if (ctx.disciplineScore >= 90 && ctx.cycles.length > 0) {
    out.push({
      id: 'disc-high',
      type: 'encouragement',
      emoji: '🧘',
      text: `Discipline score: ${ctx.disciplineScore}%. You're proving consistency to yourself, not anyone else.`,
      createdAt: now.toISOString(),
    });
  } else if (ctx.disciplineScore < 60 && ctx.cycles.length > 0) {
    out.push({
      id: 'disc-low',
      type: 'tip',
      emoji: '🌤️',
      text: `Off-rhythm is normal. A small deposit today is enough to start again — no need to make it up all at once.`,
      createdAt: now.toISOString(),
    });
  }

  const activeCycle = ctx.cycles.find(c => c.status !== 'completed');
  if (activeCycle) {
    const userSum = activeCycle.contributions
      .filter(c => c.memberId === ctx.userId && c.type === 'contribution')
      .reduce((s, c) => s + c.amount, 0);
    const userTarget = activeCycle.goalAmount / Math.max(1, activeCycle.members.length);
    const pct = userTarget > 0 ? userSum / userTarget : 0;
    if (pct >= 0.75) {
      out.push({
        id: `near-${activeCycle.id}`,
        type: 'goal',
        emoji: '🎯',
        text: `You're ${Math.round(pct * 100)}% of the way to your goal in "${activeCycle.name}". The finish line is closer than it feels.`,
        createdAt: now.toISOString(),
      });
    } else if (pct >= 0.4) {
      out.push({
        id: `mid-${activeCycle.id}`,
        type: 'goal',
        emoji: '🛤️',
        text: `Halfway through "${activeCycle.name}" — the boring middle is where everyone else quits. Don't.`,
        createdAt: now.toISOString(),
      });
    }
  }

  if (last14.length > 0 && last7.length === 0) {
    out.push({
      id: 'silent-week',
      type: 'tip',
      emoji: '🌙',
      text: `It's been a quiet week. Even $5 today keeps the rhythm alive — momentum matters more than amount.`,
      createdAt: now.toISOString(),
    });
  }

  if (ctx.completedCycles > 0) {
    out.push({
      id: 'completed',
      type: 'milestone',
      emoji: '🏆',
      text: `${ctx.completedCycles} cycle${ctx.completedCycles > 1 ? 's' : ''} finished. You're not just saving — you're finishing what you start.`,
      createdAt: now.toISOString(),
    });
  }

  if (out.length === 0) {
    const fallbacks: { text: string; emoji: string; type: InsightType }[] = [
      { text: `Discipline is just memory of why you started. Keep going, ${firstName}.`, emoji: '🌿', type: 'encouragement' },
      { text: `Money saved quietly compounds louder than money spent loudly.`, emoji: '🌊', type: 'tip' },
      { text: `Every small deposit is a vote for your future self.`, emoji: '✨', type: 'encouragement' },
    ];
    const f = pick(fallbacks, now.getDate());
    out.push({ id: 'fb', ...f, createdAt: now.toISOString() });
  }

  return out;
}

/**
 * Returns one rotating featured insight (the most relevant one).
 */
export function getFeaturedInsight(ctx: InsightContext): AIInsight {
  const all = buildInsights(ctx);
  return all[0];
}
