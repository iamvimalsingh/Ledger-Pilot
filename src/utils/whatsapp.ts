import { ExtractedRecord } from '../types/ledger';
import { calculateReconciliationMetrics, formatINR } from './reconciliation';

export interface WhatsAppSummaryOptions {
  title?: string;
  records: ExtractedRecord[];
  includeTopDonors?: boolean;
}

export function generateWhatsAppSummary({
  title = 'मेरा हिसाब',
  records,
  includeTopDonors = false,
}: WhatsAppSummaryOptions): string {
  const metrics = calculateReconciliationMetrics(records);
  const now = new Date().toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const lines: string[] = [
    `📋 *मेरा हिसाब: ${title}*`,
    `📅 दिनांक: ${now}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `💰 *कुल आय:* ${formatINR(metrics.verifiedIncome)}`,
    `💸 *कुल खर्च:* ${formatINR(metrics.verifiedExpense)}`,
    `⚖️ *शेष:* ${formatINR(metrics.netBalance)}`,
    ``,
    `📝 *कुल entries:* ${records.length}`,
  ];

  if (metrics.onlineTotal > 0 || metrics.cashTotal > 0) {
    lines.push(``);
    lines.push(`💳 *ऑनलाइन:* ${formatINR(metrics.onlineTotal)}  |  💵 *नकद:* ${formatINR(metrics.cashTotal)}`);
  }

  if (Object.keys(metrics.categoryTotals).length > 0) {
    lines.push(`━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📂 *श्रेणीवार विवरण:*`);

    // Sort categories by highest amount
    const sortedCategories = Object.entries(metrics.categoryTotals).sort(
      ([, a], [, b]) => b.total - a.total
    );

    for (const [catName, data] of sortedCategories) {
      lines.push(`• ${catName}: ${formatINR(data.total)} (${data.count} entries)`);
    }
  }

  if (includeTopDonors && records.length > 0) {
    const topEntries = records
      .filter((r) => r.verified)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    lines.push(``);
    lines.push(`⭐ *प्रमुख लेन-देन:*`);
    topEntries.forEach((d, idx) => {
      const typeSign = d.transactionType === 'INCOME' ? '+' : '-';
      lines.push(`${idx + 1}. ${d.name}: ${typeSign}${formatINR(d.amount)} (${d.paymentMode})`);
    });
  }

  lines.push(``);
  lines.push(`_LedgerPilot — सरल डिजिटल बहीखाता_`);

  return lines.join('\n');
}

export function openWhatsAppShare(text: string): void {
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

export async function shareOrCopySummary(text: string): Promise<'shared' | 'copied' | 'opened'> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'LedgerPilot Collection Summary',
        text: text,
      });
      return 'shared';
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        // Fallback to clipboard
        await navigator.clipboard.writeText(text);
        return 'copied';
      }
      return 'copied';
    }
  }

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }

  openWhatsAppShare(text);
  return 'opened';
}
