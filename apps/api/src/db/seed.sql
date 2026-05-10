-- ============================================================
-- Seed data for Vademécum
-- Run this in Supabase SQL Editor after migrations
-- ============================================================

-- Active ingredients
INSERT INTO active_ingredients (name, name_normalized, synonyms) VALUES
  ('Ibuprofeno',              'ibuprofeno',              '{}'),
  ('Paracetamol',             'paracetamol',             '{}'),
  ('Amoxicilina',             'amoxicilina',             '{}'),
  ('Warfarina',               'warfarina',               '{}'),
  ('Ácido Acetilsalicílico',  'acido acetilsalicilico',  '{"Aspirina","AAS"}'),
  ('Omeprazol',               'omeprazol',               '{}'),
  ('Atorvastatina',           'atorvastatina',           '{}'),
  ('Metformina',              'metformina',              '{}'),
  ('Losartán',                'losartan',                '{}'),
  ('Diazepam',                'diazepam',                '{}');

-- Medicines
INSERT INTO medicines (commercial_name, commercial_name_normalized, laboratory, pharmaceutical_form, requires_prescription, presentations) VALUES
  ('Ibupirac',   'ibupirac',   'Pfizer',               'comprimido', false, '[{"dose":"400mg","units":"comprimidos","quantity":20},{"dose":"600mg","units":"comprimidos","quantity":20}]'),
  ('Advil',      'advil',      'Wyeth',                'comprimido', false, '[{"dose":"400mg","units":"comprimidos","quantity":24}]'),
  ('Tafirol',    'tafirol',    'Bago',                 'comprimido', false, '[{"dose":"500mg","units":"comprimidos","quantity":16},{"dose":"1g","units":"comprimidos","quantity":8}]'),
  ('Panadol',    'panadol',    'GSK',                  'comprimido', false, '[{"dose":"500mg","units":"comprimidos","quantity":20}]'),
  ('Amoxil',     'amoxil',     'GSK',                  'cápsula',    true,  '[{"dose":"500mg","units":"cápsulas","quantity":21},{"dose":"250mg/5ml","units":"ml","quantity":100}]'),
  ('Coumadin',   'coumadin',   'Bristol-Myers Squibb', 'comprimido', true,  '[{"dose":"5mg","units":"comprimidos","quantity":30}]'),
  ('Aspirina',   'aspirina',   'Bayer',                'comprimido', false, '[{"dose":"500mg","units":"comprimidos","quantity":20},{"dose":"100mg","units":"comprimidos","quantity":30}]'),
  ('Losec',      'losec',      'AstraZeneca',          'cápsula',    true,  '[{"dose":"20mg","units":"cápsulas","quantity":14}]'),
  ('Lipitor',    'lipitor',    'Pfizer',               'comprimido', true,  '[{"dose":"10mg","units":"comprimidos","quantity":30},{"dose":"20mg","units":"comprimidos","quantity":30},{"dose":"40mg","units":"comprimidos","quantity":30}]'),
  ('Glucophage', 'glucophage', 'Merck',                'comprimido', true,  '[{"dose":"500mg","units":"comprimidos","quantity":60},{"dose":"850mg","units":"comprimidos","quantity":60}]'),
  ('Cozaar',     'cozaar',     'MSD',                  'comprimido', true,  '[{"dose":"50mg","units":"comprimidos","quantity":30}]'),
  ('Valium',     'valium',     'Roche',                'comprimido', true,  '[{"dose":"5mg","units":"comprimidos","quantity":30},{"dose":"10mg","units":"comprimidos","quantity":30}]');

-- Medicine ↔ Ingredient links
INSERT INTO medicine_ingredients (medicine_id, active_ingredient_id)
SELECT m.id, ai.id FROM medicines m, active_ingredients ai
WHERE (m.commercial_name = 'Ibupirac'   AND ai.name = 'Ibuprofeno')
   OR (m.commercial_name = 'Advil'      AND ai.name = 'Ibuprofeno')
   OR (m.commercial_name = 'Tafirol'    AND ai.name = 'Paracetamol')
   OR (m.commercial_name = 'Panadol'    AND ai.name = 'Paracetamol')
   OR (m.commercial_name = 'Amoxil'     AND ai.name = 'Amoxicilina')
   OR (m.commercial_name = 'Coumadin'   AND ai.name = 'Warfarina')
   OR (m.commercial_name = 'Aspirina'   AND ai.name = 'Ácido Acetilsalicílico')
   OR (m.commercial_name = 'Losec'      AND ai.name = 'Omeprazol')
   OR (m.commercial_name = 'Lipitor'    AND ai.name = 'Atorvastatina')
   OR (m.commercial_name = 'Glucophage' AND ai.name = 'Metformina')
   OR (m.commercial_name = 'Cozaar'     AND ai.name = 'Losartán')
   OR (m.commercial_name = 'Valium'     AND ai.name = 'Diazepam');

-- Prospects
INSERT INTO prospects (medicine_id, indications, dosage, contraindications, warnings, interactions_text, adverse_effects, overdose, storage)
SELECT id,
  'Dolor leve a moderado, fiebre, inflamación.',
  'Adultos: 400-600mg cada 6-8 horas. Máximo 2400mg/día.',
  'Úlcera péptica activa, insuficiencia renal grave, hipersensibilidad al ibuprofeno.',
  'Usar con precaución en pacientes con antecedentes de úlcera. No usar en embarazo tercer trimestre.',
  'Puede aumentar el efecto anticoagulante de la warfarina. Reduce el efecto de antihipertensivos.',
  'Náuseas, dispepsia, dolor abdominal. Raramente: úlcera, sangrado GI.',
  'En caso de sobredosis consultar inmediatamente al médico o centro de toxicología.',
  'Conservar a temperatura ambiente (15-30°C), protegido de la humedad.'
FROM medicines WHERE commercial_name = 'Ibupirac';

INSERT INTO prospects (medicine_id, indications, dosage, contraindications, warnings, interactions_text, adverse_effects, overdose, storage)
SELECT id,
  'Dolor leve a moderado, fiebre.',
  'Adultos: 500mg-1g cada 6-8 horas. Máximo 4g/día.',
  'Insuficiencia hepática grave, hipersensibilidad al paracetamol.',
  'No superar la dosis máxima. Evitar el consumo de alcohol.',
  'El alcohol aumenta el riesgo de hepatotoxicidad.',
  'Raramente: reacciones alérgicas, alteraciones hepáticas con dosis altas.',
  'La sobredosis puede causar daño hepático grave. Consultar médico de inmediato.',
  'Conservar a temperatura ambiente, protegido de la luz.'
FROM medicines WHERE commercial_name = 'Tafirol';

INSERT INTO prospects (medicine_id, indications, dosage, contraindications, warnings, interactions_text, adverse_effects, overdose, storage)
SELECT id,
  'Infecciones bacterianas: respiratorias, urinarias, otitis, sinusitis.',
  'Adultos: 500mg cada 8 horas o 875mg cada 12 horas.',
  'Hipersensibilidad a penicilinas o cefalosporinas.',
  'Verificar antecedentes de alergia a penicilina antes de administrar.',
  'Puede reducir la eficacia de anticonceptivos orales.',
  'Diarrea, náuseas, erupción cutánea. Raramente: reacciones alérgicas graves.',
  'En caso de sobredosis consultar al médico.',
  'Conservar en lugar fresco y seco. El jarabe reconstituido refrigerar y usar en 7 días.'
FROM medicines WHERE commercial_name = 'Amoxil';

-- Drug interactions
INSERT INTO drug_interactions (ingredient_a_id, ingredient_b_id, severity, description)
SELECT a.id, b.id,
  'grave',
  'El ibuprofeno puede potenciar el efecto anticoagulante de la warfarina, aumentando significativamente el riesgo de hemorragia.'
FROM active_ingredients a, active_ingredients b
WHERE a.name = 'Ibuprofeno' AND b.name = 'Warfarina';

INSERT INTO drug_interactions (ingredient_a_id, ingredient_b_id, severity, description)
SELECT a.id, b.id,
  'grave',
  'La combinación de ácido acetilsalicílico y warfarina aumenta el riesgo de sangrado. Usar con extrema precaución.'
FROM active_ingredients a, active_ingredients b
WHERE a.name = 'Ácido Acetilsalicílico' AND b.name = 'Warfarina';

INSERT INTO drug_interactions (ingredient_a_id, ingredient_b_id, severity, description)
SELECT a.id, b.id,
  'moderada',
  'El ibuprofeno puede interferir con el efecto antiagregante plaquetario del ácido acetilsalicílico.'
FROM active_ingredients a, active_ingredients b
WHERE a.name = 'Ibuprofeno' AND b.name = 'Ácido Acetilsalicílico';

INSERT INTO drug_interactions (ingredient_a_id, ingredient_b_id, severity, description)
SELECT a.id, b.id,
  'leve',
  'El omeprazol puede aumentar los niveles plasmáticos del diazepam al inhibir su metabolismo hepático.'
FROM active_ingredients a, active_ingredients b
WHERE a.name = 'Omeprazol' AND b.name = 'Diazepam';

INSERT INTO drug_interactions (ingredient_a_id, ingredient_b_id, severity, description)
SELECT a.id, b.id,
  'leve',
  'Interacción farmacocinética leve. No se requiere ajuste de dosis en la mayoría de los pacientes.'
FROM active_ingredients a, active_ingredients b
WHERE a.name = 'Atorvastatina' AND b.name = 'Losartán';

-- Conditions
INSERT INTO conditions (name, name_normalized, category) VALUES
  ('Dolor',                        'dolor',                        'dolor'),
  ('Fiebre',                       'fiebre',                       'dolor'),
  ('Inflamación',                  'inflamacion',                  'dolor'),
  ('Cefalea / Dolor de cabeza',    'cefalea / dolor de cabeza',    'dolor'),
  ('Dismenorrea / Dolor menstrual','dismenorrea / dolor menstrual','dolor'),
  ('Artritis / Artrosis',          'artritis / artrosis',          'musculoesqueletico'),
  ('Infección bacteriana',         'infeccion bacteriana',         'infeccion'),
  ('Otitis',                       'otitis',                       'infeccion'),
  ('Sinusitis',                    'sinusitis',                    'infeccion'),
  ('Anticoagulación / Trombosis',  'anticoagulacion / trombosis',  'cardiovascular'),
  ('Hipertensión arterial',        'hipertension arterial',        'cardiovascular'),
  ('Colesterol elevado / Dislipemia','colesterol elevado / dislipemia','cardiovascular'),
  ('Prevención cardiovascular',    'prevencion cardiovascular',    'cardiovascular'),
  ('Diabetes tipo 2',              'diabetes tipo 2',              'endocrino'),
  ('Gastritis / Úlcera péptica',   'gastritis / ulcera peptica',   'digestivo'),
  ('Reflujo gastroesofágico',      'reflujo gastroesofagico',      'digestivo'),
  ('Ansiedad / Espasmos musculares','ansiedad / espasmos musculares','neurologico');

-- Ingredient ↔ Condition links
INSERT INTO ingredient_conditions (active_ingredient_id, condition_id)
SELECT ai.id, c.id FROM active_ingredients ai, conditions c WHERE
  (ai.name = 'Ibuprofeno'             AND c.name IN ('Dolor','Fiebre','Inflamación','Cefalea / Dolor de cabeza','Dismenorrea / Dolor menstrual','Artritis / Artrosis'))
  OR (ai.name = 'Paracetamol'         AND c.name IN ('Dolor','Fiebre','Cefalea / Dolor de cabeza'))
  OR (ai.name = 'Amoxicilina'         AND c.name IN ('Infección bacteriana','Otitis','Sinusitis'))
  OR (ai.name = 'Warfarina'           AND c.name IN ('Anticoagulación / Trombosis'))
  OR (ai.name = 'Ácido Acetilsalicílico' AND c.name IN ('Dolor','Fiebre','Prevención cardiovascular'))
  OR (ai.name = 'Omeprazol'           AND c.name IN ('Gastritis / Úlcera péptica','Reflujo gastroesofágico'))
  OR (ai.name = 'Atorvastatina'       AND c.name IN ('Colesterol elevado / Dislipemia','Prevención cardiovascular'))
  OR (ai.name = 'Metformina'          AND c.name IN ('Diabetes tipo 2'))
  OR (ai.name = 'Losartán'            AND c.name IN ('Hipertensión arterial','Prevención cardiovascular'))
  OR (ai.name = 'Diazepam'            AND c.name IN ('Ansiedad / Espasmos musculares'));
