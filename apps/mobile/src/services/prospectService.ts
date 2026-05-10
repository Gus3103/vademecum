/**
 * prospectService — llama directo a Supabase.
 * Requirements: 3.1, 3.2, 3.3
 */

import { supabase } from './supabaseClient';
import type { Prospect } from '@drug-medicine-lookup/shared';

export async function getProspect(medicineId: string): Promise<Prospect> {
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('medicine_id', medicineId)
    .single();

  if (error || !data) {
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
