import { Linking, Platform, Share } from 'react-native';
import { Cycle, Member, ContributionFrequency } from '@/types';

function formatFrequencyLabel(freq: ContributionFrequency): string {
  switch (freq) {
    case 'daily': return 'day';
    case 'weekly': return 'week';
    case 'biweekly': return '2 weeks';
    case 'monthly': return 'month';
  }
}

function buildCyclePlanText(cycle: Cycle): string {
  const memberCount = cycle.members.length;
  const freqLabel = formatFrequencyLabel(cycle.frequency);
  const totalDays = Math.max(1, (new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const periodsMap: Record<ContributionFrequency, number> = {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    monthly: 30,
  };
  const totalPeriods = Math.ceil(totalDays / periodsMap[cycle.frequency]);
  const perContribution = cycle.goalAmount / Math.max(totalPeriods, 1);
  const perPerson = perContribution / Math.max(memberCount, 1);

  const endDateFormatted = new Date(cycle.endDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return [
    `Cycle: ${cycle.name}`,
    `Type: ${cycle.type.charAt(0).toUpperCase() + cycle.type.slice(1)}`,
    `Goal: $${cycle.goalAmount.toLocaleString()}`,
    `Frequency: Every ${freqLabel}`,
    `End Date: ${endDateFormatted}`,
    `Members: ${memberCount}`,
    '',
    `Your contribution: $${perPerson.toFixed(2)} per ${freqLabel}`,
    `Total contributions needed: ${totalPeriods}`,
    '',
    `Current progress: $${cycle.currentAmount.toLocaleString()} of $${cycle.goalAmount.toLocaleString()} (${Math.round((cycle.currentAmount / cycle.goalAmount) * 100)}%)`,
  ].join('\n');
}

function encodeMailto(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function encodeSms(phone: string, body: string): string {
  const separator = Platform.OS === 'ios' ? '&' : '?';
  return `sms:${encodeURIComponent(phone)}${separator}body=${encodeURIComponent(body)}`;
}

export async function sendInviteEmail(
  member: Member,
  cycleName: string,
  inviteLink: string,
): Promise<boolean> {
  if (!member.email) {
    console.log('[SendInvite] No email for member:', member.name);
    return false;
  }

  const subject = `You're invited to join "${cycleName}" on Zivo`;
  const body = [
    `Hi ${member.name},`,
    '',
    `You've been invited to join the savings cycle "${cycleName}" on Zivo!`,
    '',
    'Click the link below to join:',
    inviteLink,
    '',
    'With Zivo, you can save together with your group and reach your financial goals faster.',
    '',
    'See you inside!',
    '— The Zivo Team',
  ].join('\n');

  const url = encodeMailto(member.email, subject, body);

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      console.log('[SendInvite] Email opened for:', member.email);
      return true;
    } else {
      console.log('[SendInvite] Email not supported, trying share...');
      await Share.share({
        title: subject,
        message: `${subject}\n\n${body}`,
      });
      return true;
    }
  } catch (error) {
    console.log('[SendInvite] Error sending email invite:', error);
    return false;
  }
}

export async function sendInviteSms(
  member: Member,
  cycleName: string,
  inviteLink: string,
): Promise<boolean> {
  if (!member.phone) {
    console.log('[SendInvite] No phone for member:', member.name);
    return false;
  }

  const body = `Hi ${member.name}! You've been invited to join "${cycleName}" on Zivo. Tap to join: ${inviteLink}`;
  const url = encodeSms(member.phone, body);

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      console.log('[SendInvite] SMS opened for:', member.phone);
      return true;
    }
    return false;
  } catch (error) {
    console.log('[SendInvite] Error sending SMS invite:', error);
    return false;
  }
}

export async function sendCyclePlanEmail(
  member: Member,
  cycle: Cycle,
): Promise<boolean> {
  if (!member.email) {
    console.log('[SendPlan] No email for member:', member.name);
    return false;
  }

  const planText = buildCyclePlanText(cycle);
  const subject = `Your Cycle Plan for "${cycle.name}" — Zivo`;
  const body = [
    `Hi ${member.name},`,
    '',
    `Here's the plan for your savings cycle:`,
    '',
    planText,
    '',
    'Open Zivo to start contributing and track your progress!',
    '',
    '— The Zivo Team',
  ].join('\n');

  const url = encodeMailto(member.email, subject, body);

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      console.log('[SendPlan] Plan email opened for:', member.email);
      return true;
    } else {
      await Share.share({
        title: subject,
        message: `${subject}\n\n${body}`,
      });
      return true;
    }
  } catch (error) {
    console.log('[SendPlan] Error sending plan email:', error);
    return false;
  }
}

export async function sendCyclePlanSms(
  member: Member,
  cycle: Cycle,
): Promise<boolean> {
  if (!member.phone) return false;

  const freqLabel = formatFrequencyLabel(cycle.frequency);
  const memberCount = cycle.members.length;
  const totalDays = Math.max(1, (new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const periodsMap: Record<ContributionFrequency, number> = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };
  const totalPeriods = Math.ceil(totalDays / periodsMap[cycle.frequency]);
  const perPerson = (cycle.goalAmount / Math.max(totalPeriods, 1)) / Math.max(memberCount, 1);

  const body = `Zivo Cycle Plan — "${cycle.name}": $${perPerson.toFixed(2)}/${freqLabel} per person. Goal: $${cycle.goalAmount.toLocaleString()}. Open Zivo to contribute!`;
  const url = encodeSms(member.phone, body);

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (error) {
    console.log('[SendPlan] Error sending plan SMS:', error);
    return false;
  }
}

export async function shareInviteLink(
  member: Member,
  cycleName: string,
  inviteLink: string,
): Promise<boolean> {
  try {
    await Share.share({
      title: `Join "${cycleName}" on Zivo`,
      message: `Hi ${member.name}! You've been invited to join "${cycleName}" on Zivo. Join here: ${inviteLink}`,
    });
    return true;
  } catch (error) {
    console.log('[SendInvite] Error sharing invite:', error);
    return false;
  }
}

export async function sendParentNotificationEmail(
  parentEmail: string,
  teenName: string,
  actionDescription: string,
  actionType: string,
): Promise<boolean> {
  if (!parentEmail) return false;

  const subject = `Zivo — ${actionType} by ${teenName}`;
  const body = [
    `Dear Parent/Guardian,`,
    '',
    `This is a notification from Zivo Cycles regarding your child's account.`,
    '',
    `${actionDescription}`,
    '',
    `Account: ${teenName}`,
    `Action: ${actionType}`,
    `Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`,
    '',
    `You are receiving this because you approved a teen account on Zivo. All major actions will be reported to you automatically.`,
    '',
    `If you have concerns, please contact us at support@zivo.app.`,
    '',
    `— The Zivo Team`,
  ].join('\n');

  const url = encodeMailto(parentEmail, subject, body);

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      console.log('[ParentNotify] Notification email prepared for:', parentEmail, 'action:', actionType);
      return true;
    }
    return false;
  } catch (error) {
    console.log('[ParentNotify] Error preparing notification:', error);
    return false;
  }
}

export async function shareCyclePlanToAll(cycle: Cycle): Promise<{ sent: number; failed: number }> {
  const planText = buildCyclePlanText(cycle);
  const nonOwnerMembers = cycle.members.filter((m) => m.role !== 'owner');
  
  if (nonOwnerMembers.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const emailList = nonOwnerMembers
    .filter((m) => m.email)
    .map((m) => m.email as string)
    .join(',');

  if (emailList) {
    const subject = `Cycle Plan for "${cycle.name}" — Zivo`;
    const body = [
      'Hi everyone,',
      '',
      `Here's the savings plan for "${cycle.name}":`,
      '',
      planText,
      '',
      'Open Zivo to start contributing!',
      '',
      '— The Zivo Team',
    ].join('\n');

    const url = encodeMailto(emailList, subject, body);

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        console.log('[SendPlan] Bulk plan email opened for:', emailList);
        return { sent: nonOwnerMembers.filter((m) => m.email).length, failed: 0 };
      }
    } catch (error) {
      console.log('[SendPlan] Bulk email error, trying share:', error);
    }
  }

  try {
    await Share.share({
      title: `Cycle Plan for "${cycle.name}"`,
      message: `Cycle Plan for "${cycle.name}"\n\n${planText}`,
    });
    return { sent: nonOwnerMembers.length, failed: 0 };
  } catch (error) {
    console.log('[SendPlan] Share fallback error:', error);
    return { sent: 0, failed: nonOwnerMembers.length };
  }
}
