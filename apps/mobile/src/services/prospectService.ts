/**
 * prospectService — usa Supabase REST API directamente.
 * Requirements: 3.1, 3.2, 3.3
 */

import { supabaseQuerySingle } from './supabaseClient';
import type { Prospect } from '@drug-medicine-lookup/shared';

interface ProspectRow {
  medicine_id: string;
  indications: string | null;
  dosage: string | null;
  contraindications: string | null;
  warnings: string | null;
  interactions_text: string | null;
  adverse_effects: string | null;
  overdose: string | null;
  storage: string | null;
}

export async function getProspect(medicineId: string): Promise<Prospect> {
  const data = await supabaseQuerySingle<ProspectRow>('prospects', {
    select: 'medicine_id,indications,dosage,contraindications,warnings,interactions_text,adverse_effects,overdose,storage',
    filters: [`medicine_id=eq.${medicineId}`],
  });

  if (!data) {
    throw new Error('PROSPECT_NOT_FOUND');
  }

  return {
    medicineId: data.medicine_id,
    indications: data.indications ?? '',
    dosage: data.dosage ?? '',
    contraindications: data.contraindications ?? '',
    warnings: data.warnings ?? '',
    interactionsText: data.interactions_text ?? '',
    adverseEffects: data.adverse_effects ?? '',
    overdose: data.overdose ?? '',
    storage: data.storage ?? '',
  };
}
