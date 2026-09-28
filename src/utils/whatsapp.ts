import { ExtractedRecord } from '../types/ledger';
import { calculateReconciliationMetrics, formatINR } from './reconciliation';

export interface WhatsAppSummaryOptions {
  title?: string;
  records: ExtractedRecord[];
  includeTopDonors?: boolean;
}

export function generateWhatsAppSummary({
  title = 'संग्रह विवरण (Collection Summary)',
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
    `📊 *${title}*`,
    `📅 दिनांक: ${now}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `💰 *कुल आय (Income):* ${formatINR(metrics.verifiedIncome)}`,
    `💸 *कुल व्यय (Expense):* ${formatINR(metrics.verifiedExpense)}`,
    `⚖️ *शुद्ध शेष (Net Balance):* ${formatINR(metrics.netBalance)}`,
    ``,
    `💳 *ऑनलाइन आय (Online):* ${formatINR(metrics.onlineIncome)}`,
    `💵 *कैश आय (Cash):* ${formatINR(metrics.cashIncome)}`,
  ];

  if (metrics.otherTotal > 0) {
    lines.push(`📦 *अन्य (Other):* ${formatINR(metrics.otherTotal)}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📂 *श्रेणीवार विवरण (Categories):*`);

  // Sort categories by highest amount
  const sortedCategories = Object.entries(metrics.categoryTotals).sort(
    ([, a], [, b]) => b.total - a.total
  );

  for (const [catName, data] of sortedCategories) {
    lines.push(`• ${catName}: ${formatINR(data.total)} (${data.count} रसीदें)`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📝 *कुल सत्यापित रिकॉर्ड्स:* ${metrics.verifiedRecordsCount} / ${metrics.totalRecords}`);

  if (includeTopDonors && records.length > 0) {
    const topDonors = records
      .filter((r) => r.verified && r.transactionType === 'INCOME')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    lines.push(``);
    lines.push(`🌟 *मुख्य सहयोगी (Top Contributions):*`);
    topDonors.forEach((d, idx) => {
      lines.push(`${idx + 1}. ${d.name}: ${formatINR(d.amount)} (${d.paymentMode})`);
    });
  }

  lines.push(``);
  lines.push(`_LedgerPilot डिजिटल खाता प्रणाली द्वारा सत्यापित_`);

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
