/**
 * devServer.ts — Servidor de desarrollo local con base de datos en memoria.
 *
 * Usa pg-mem para simular PostgreSQL sin necesidad de instalarlo.
 * Carga datos de prueba automáticamente al arrancar.
 *
 * Uso:
 *   npx ts-node src/devServer.ts
 *
 * o con el script:
 *   npm run dev:local
 */

import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { errorHandler } from './middleware/errorHandler';
import { createTestDb, insertActiveIngredient, insertMedicine, linkMedicineIngredient, insertCondition, linkIngredientCondition } from './db/testDb';
import { Pool } from 'pg';
import { MedicineRepositoryPgMem } from './repositories/medicineRepositoryPgMem';
import { ProspectRepository } from './repositories/prospectRepository';
import { InteractionRepository } from './repositories/interactionRepository';
import { ConditionRepository } from './repositories/conditionRepository';
import { SearchService } from './services/searchService';
import { ProspectService } from './services/prospectService';
import { InteractionService } from './services/interactionService';
import { DomainError } from './services/domainErrors';
import type { FilterState } from '@drug-medicine-lookup/shared';
import { Router, type Request, type Response, type NextFunction } from 'express';

// ─── Datos de prueba ─────────────────────────────────────────────────────────

async function seedDatabase(pool: Pool): Promise<void> {
  console.log('[seed] Cargando datos de prueba...');

  // Principios activos
  const ibuprofeno = await insertActiveIngredient(pool, { name: 'Ibuprofeno' });
  const paracetamol = await insertActiveIngredient(pool, { name: 'Paracetamol' });
  const amoxicilina = await insertActiveIngredient(pool, { name: 'Amoxicilina' });
  const warfarina = await insertActiveIngredient(pool, { name: 'Warfarina' });
  const aspirina = await insertActiveIngredient(pool, { name: 'Ácido Acetilsalicílico', synonyms: ['Aspirina', 'AAS'] });
  const omeprazol = await insertActiveIngredient(pool, { name: 'Omeprazol' });
  const atorvastatina = await insertActiveIngredient(pool, { name: 'Atorvastatina' });
  const metformina = await insertActiveIngredient(pool, { name: 'Metformina' });
  const losartan = await insertActiveIngredient(pool, { name: 'Losartán' });
  const diazepam = await insertActiveIngredient(pool, { name: 'Diazepam' });

  // Medicamentos
  const ibupirac = await insertMedicine(pool, {
    commercialName: 'Ibupirac',
    laboratory: 'Pfizer',
    pharmaceuticalForm: 'comprimido',
    requiresPrescription: false,
    presentations: [
      { dose: '400mg', units: 'comprimidos', quantity: 20 },
      { dose: '600mg', units: 'comprimidos', quantity: 20 },
    ],
  });

  const advil = await insertMedicine(pool, {
    commercialName: 'Advil',
    laboratory: 'Wyeth',
    pharmaceuticalForm: 'comprimido',
    requiresPrescription: false,
    presentations: [{ dose: '400mg', units: 'comprimidos', quantity: 24 }],
  });

  const tafirol = await insertMedicine(pool, {
    commercialName: 'Tafirol',
    laboratory: 'Bago',
    pharmaceuticalForm: 'comprimido',
    requiresPrescription: false,
    presentations: [
      { dose: '500mg', units: 'comprimidos', quantity: 16 },
      { dose: '1g', units: 'comprimidos', quantity: 8 },
    ],
  });

  const panadol = await insertMedicine(pool, {
    commercialName: 'Panadol',
    laboratory: 'GSK',
    pharmaceuticalForm: 'comprimido',
    requiresPrescription: false,
    presentations: [{ dose: '500mg', units: 'comprimidos', quantity: 20 }],
  });

  const amoxil = await insertMedicine(pool, {
    commercialName: 'Amoxil',
    laboratory: 'GSK',
    pharmaceuticalForm: 'cápsula',
    requiresPrescription: true,
    presentations: [
      { dose: '500mg', units: 'cápsulas', quantity: 21 },
      { dose: '250mg/5ml', units: 'ml', quantity: 100 },
    ],
  });

  const coumadin = await insertMedicine(pool, {
    commercialName: 'Coumadin',
    laboratory: 'Bristol-Myers Squibb',
    pharmaceuticalForm: 'comprimido',
    requiresPrescription: true,
    presentations: [{ dose: '5mg', units: 'comprimidos', quantity: 30 }],
  });

  const aspirinaMed = await insertMedicine(pool, {
    commercialName: 'Aspirina',
    laboratory: 'Bayer',
    pharmaceuticalForm: 'comprimido',
    requiresPrescription: false,
    presentations: [
      { dose: '500mg', units: 'comprimidos', quantity: 20 },
      { dose: '100mg', units: 'comprimidos', quantity: 30 },
    ],
  });

  const omeprazolMed = await insertMedicine(pool, {
    commercialName: 'Losec',
    laboratory: 'AstraZeneca',
    pharmaceuticalForm: 'cápsula',
    requiresPrescription: true,
    presentations: [{ dose: '20mg', units: 'cápsulas', quantity: 14 }],
  });

  const lipitor = await insertMedicine(pool, {
    commercialName: 'Lipitor',
    laboratory: 'Pfizer',
    pharmaceuticalForm: 'comprimido',
    requiresPrescription: true,
    presentations: [
      { dose: '10mg', units: 'comprimidos', quantity: 30 },
      { dose: '20mg', units: 'comprimidos', quantity: 30 },
      { dose: '40mg', units: 'comprimidos', quantity: 30 },
    ],
  });

  const glucophage = await insertMedicine(pool, {
    commercialName: 'Glucophage',
    laboratory: 'Merck',
    pharmaceuticalForm: 'comprimido',
    requiresPrescription: true,
    presentations: [
      { dose: '500mg', units: 'comprimidos', quantity: 60 },
      { dose: '850mg', units: 'comprimidos', quantity: 60 },
    ],
  });

  const cozaar = await insertMedicine(pool, {
    commercialName: 'Cozaar',
    laboratory: 'MSD',
    pharmaceuticalForm: 'comprimido',
    requiresPrescription: true,
    presentations: [{ dose: '50mg', units: 'comprimidos', quantity: 30 }],
  });

  const valium = await insertMedicine(pool, {
    commercialName: 'Valium',
    laboratory: 'Roche',
    pharmaceuticalForm: 'comprimido',
    requiresPrescription: true,
    presentations: [
      { dose: '5mg', units: 'comprimidos', quantity: 30 },
      { dose: '10mg', units: 'comprimidos', quantity: 30 },
    ],
  });

  // Vincular medicamentos con principios activos
  await linkMedicineIngredient(pool, ibupirac, ibuprofeno);
  await linkMedicineIngredient(pool, advil, ibuprofeno);
  await linkMedicineIngredient(pool, tafirol, paracetamol);
  await linkMedicineIngredient(pool, panadol, paracetamol);
  await linkMedicineIngredient(pool, amoxil, amoxicilina);
  await linkMedicineIngredient(pool, coumadin, warfarina);
  await linkMedicineIngredient(pool, aspirinaMed, aspirina);
  await linkMedicineIngredient(pool, omeprazolMed, omeprazol);
  await linkMedicineIngredient(pool, lipitor, atorvastatina);
  await linkMedicineIngredient(pool, glucophage, metformina);
  await linkMedicineIngredient(pool, cozaar, losartan);
  await linkMedicineIngredient(pool, valium, diazepam);

  // Prospectos
  await pool.query(
    `INSERT INTO prospects (id, medicine_id, indications, dosage, contraindications, warnings, interactions_text, adverse_effects, overdose, storage)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      randomUUID(),
      ibupirac,
      'Dolor leve a moderado, fiebre, inflamación.',
      'Adultos: 400-600mg cada 6-8 horas. Máximo 2400mg/día.',
      'Úlcera péptica activa, insuficiencia renal grave, hipersensibilidad al ibuprofeno.',
      'Usar con precaución en pacientes con antecedentes de úlcera. No usar en embarazo tercer trimestre.',
      'Puede aumentar el efecto anticoagulante de la warfarina. Reduce el efecto de antihipertensivos.',
      'Náuseas, dispepsia, dolor abdominal. Raramente: úlcera, sangrado GI.',
      'En caso de sobredosis consultar inmediatamente al médico o centro de toxicología.',
      'Conservar a temperatura ambiente (15-30°C), protegido de la humedad.',
    ],
  );

  await pool.query(
    `INSERT INTO prospects (id, medicine_id, indications, dosage, contraindications, warnings, interactions_text, adverse_effects, overdose, storage)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      randomUUID(),
      tafirol,
      'Dolor leve a moderado, fiebre.',
      'Adultos: 500mg-1g cada 6-8 horas. Máximo 4g/día.',
      'Insuficiencia hepática grave, hipersensibilidad al paracetamol.',
      'No superar la dosis máxima. Evitar el consumo de alcohol.',
      'El alcohol aumenta el riesgo de hepatotoxicidad.',
      'Raramente: reacciones alérgicas, alteraciones hepáticas con dosis altas.',
      'La sobredosis puede causar daño hepático grave. Consultar médico de inmediato.',
      'Conservar a temperatura ambiente, protegido de la luz.',
    ],
  );

  await pool.query(
    `INSERT INTO prospects (id, medicine_id, indications, dosage, contraindications, warnings, interactions_text, adverse_effects, overdose, storage)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      randomUUID(),
      amoxil,
      'Infecciones bacterianas: respiratorias, urinarias, otitis, sinusitis.',
      'Adultos: 500mg cada 8 horas o 875mg cada 12 horas.',
      'Hipersensibilidad a penicilinas o cefalosporinas.',
      'Verificar antecedentes de alergia a penicilina antes de administrar.',
      'Puede reducir la eficacia de anticonceptivos orales.',
      'Diarrea, náuseas, erupción cutánea. Raramente: reacciones alérgicas graves.',
      'En caso de sobredosis consultar al médico.',
      'Conservar en lugar fresco y seco. El jarabe reconstituido refrigerar y usar en 7 días.',
    ],
  );

  // Interacciones medicamentosas
  await pool.query(
    `INSERT INTO drug_interactions (id, ingredient_a_id, ingredient_b_id, severity, description)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      randomUUID(),
      ibuprofeno,
      warfarina,
      'grave',
      'El ibuprofeno puede potenciar el efecto anticoagulante de la warfarina, aumentando significativamente el riesgo de hemorragia. Evitar la combinación; si es necesario, monitorear el INR estrechamente.',
    ],
  );

  await pool.query(
    `INSERT INTO drug_interactions (id, ingredient_a_id, ingredient_b_id, severity, description)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      randomUUID(),
      aspirina,
      warfarina,
      'grave',
      'La combinación de ácido acetilsalicílico y warfarina aumenta el riesgo de sangrado. Usar con extrema precaución y bajo supervisión médica.',
    ],
  );

  await pool.query(
    `INSERT INTO drug_interactions (id, ingredient_a_id, ingredient_b_id, severity, description)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      randomUUID(),
      ibuprofeno,
      aspirina,
      'moderada',
      'El ibuprofeno puede interferir con el efecto antiagregante plaquetario del ácido acetilsalicílico. Tomar la aspirina al menos 2 horas antes del ibuprofeno.',
    ],
  );

  await pool.query(
    `INSERT INTO drug_interactions (id, ingredient_a_id, ingredient_b_id, severity, description)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      randomUUID(),
      omeprazol,
      diazepam,
      'leve',
      'El omeprazol puede aumentar los niveles plasmáticos del diazepam al inhibir su metabolismo hepático. Puede requerirse ajuste de dosis.',
    ],
  );

  await pool.query(
    `INSERT INTO drug_interactions (id, ingredient_a_id, ingredient_b_id, severity, description)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      randomUUID(),
      atorvastatina,
      losartan,
      'leve',
      'Interacción farmacocinética leve. No se requiere ajuste de dosis en la mayoría de los pacientes.',
    ],
  );

  // Condiciones / dolencias
  const dolor = await insertCondition(pool, { name: 'Dolor', category: 'dolor' });
  const fiebre = await insertCondition(pool, { name: 'Fiebre', category: 'dolor' });
  const inflamacion = await insertCondition(pool, { name: 'Inflamación', category: 'dolor' });
  const cefalea = await insertCondition(pool, { name: 'Cefalea / Dolor de cabeza', category: 'dolor' });
  const dismenorrea = await insertCondition(pool, { name: 'Dismenorrea / Dolor menstrual', category: 'dolor' });
  const infeccionBacteriana = await insertCondition(pool, { name: 'Infección bacteriana', category: 'infeccion' });
  const otitis = await insertCondition(pool, { name: 'Otitis', category: 'infeccion' });
  const sinusitis = await insertCondition(pool, { name: 'Sinusitis', category: 'infeccion' });
  const anticoagulacion = await insertCondition(pool, { name: 'Anticoagulación / Trombosis', category: 'cardiovascular' });
  const hipertension = await insertCondition(pool, { name: 'Hipertensión arterial', category: 'cardiovascular' });
  const colesterol = await insertCondition(pool, { name: 'Colesterol elevado / Dislipemia', category: 'cardiovascular' });
  const diabetes = await insertCondition(pool, { name: 'Diabetes tipo 2', category: 'endocrino' });
  const gastritis = await insertCondition(pool, { name: 'Gastritis / Úlcera péptica', category: 'digestivo' });
  const reflujo = await insertCondition(pool, { name: 'Reflujo gastroesofágico', category: 'digestivo' });
  const ansiedad = await insertCondition(pool, { name: 'Ansiedad / Espasmos musculares', category: 'neurologico' });
  const artritis = await insertCondition(pool, { name: 'Artritis / Artrosis', category: 'musculoesqueletico' });
  const prevencionCardiovascular = await insertCondition(pool, { name: 'Prevención cardiovascular', category: 'cardiovascular' });

  // Vincular principios activos con condiciones
  await linkIngredientCondition(pool, ibuprofeno, dolor);
  await linkIngredientCondition(pool, ibuprofeno, fiebre);
  await linkIngredientCondition(pool, ibuprofeno, inflamacion);
  await linkIngredientCondition(pool, ibuprofeno, cefalea);
  await linkIngredientCondition(pool, ibuprofeno, dismenorrea);
  await linkIngredientCondition(pool, ibuprofeno, artritis);

  await linkIngredientCondition(pool, paracetamol, dolor);
  await linkIngredientCondition(pool, paracetamol, fiebre);
  await linkIngredientCondition(pool, paracetamol, cefalea);

  await linkIngredientCondition(pool, amoxicilina, infeccionBacteriana);
  await linkIngredientCondition(pool, amoxicilina, otitis);
  await linkIngredientCondition(pool, amoxicilina, sinusitis);

  await linkIngredientCondition(pool, warfarina, anticoagulacion);

  await linkIngredientCondition(pool, aspirina, dolor);
  await linkIngredientCondition(pool, aspirina, fiebre);
  await linkIngredientCondition(pool, aspirina, prevencionCardiovascular);

  await linkIngredientCondition(pool, omeprazol, gastritis);
  await linkIngredientCondition(pool, omeprazol, reflujo);

  await linkIngredientCondition(pool, atorvastatina, colesterol);
  await linkIngredientCondition(pool, atorvastatina, prevencionCardiovascular);

  await linkIngredientCondition(pool, metformina, diabetes);

  await linkIngredientCondition(pool, losartan, hipertension);
  await linkIngredientCondition(pool, losartan, prevencionCardiovascular);

  await linkIngredientCondition(pool, diazepam, ansiedad);

  console.log('[seed] ✓ Datos de prueba cargados correctamente.');
  console.log('[seed]   - 10 principios activos');
  console.log('[seed]   - 12 medicamentos');
  console.log('[seed]   - 3 prospectos');
  console.log('[seed]   - 5 interacciones');
  console.log('[seed]   - 17 condiciones/dolencias');
}

// ─── Servidor ─────────────────────────────────────────────────────────────────

async function startDevServer(): Promise<void> {
  // 1. Crear base de datos en memoria
  const { pool } = await createTestDb();

  // 2. Cargar datos de prueba
  await seedDatabase(pool);

  // 3. Instanciar repositorios y servicios con el pool en memoria
  const medicineRepo = new MedicineRepositoryPgMem(pool);
  const prospectRepo = new ProspectRepository(pool);
  const interactionRepo = new InteractionRepository(pool);
  const conditionRepo = new ConditionRepository(pool);
  const searchService = new SearchService(medicineRepo as never);
  const prospectService = new ProspectService(prospectRepo);
  const interactionService = new InteractionService(medicineRepo as never, interactionRepo);

  // 4. Crear app Express
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Log errors in dev server
  app.use((err: unknown, _req: Request, _res: Response, next: NextFunction) => {
    console.error('[devServer] Error en request:', err);
    next(err);
  });

  // ── Rutas de medicamentos ──────────────────────────────────────────────────

  const medicinesRouter = Router();

  medicinesRouter.get('/search', async (req, res, next) => {
    try {
      const { q, type, page, lab, form, prescription, sort } = req.query;

      if (typeof q !== 'string' || q.trim().length < 3) {
        return next(new DomainError('QUERY_TOO_SHORT', 'El término debe tener al menos 3 caracteres.'));
      }

      const searchType: 'active' | 'commercial' = type === 'commercial' ? 'commercial' : 'active';
      const pageNum = page !== undefined ? parseInt(String(page), 10) : 1;

      const filters: FilterState = {};
      if (typeof lab === 'string' && lab.trim()) filters.laboratory = lab.trim();
      if (typeof form === 'string' && form.trim()) filters.pharmaceuticalForm = form.trim();
      if (prescription === 'true') filters.requiresPrescription = true;
      if (prescription === 'false') filters.requiresPrescription = false;
      if (sort === 'name_asc' || sort === 'name_desc') filters.sortOrder = sort;

      const result = await searchService.search(q, searchType, filters, pageNum);
      return res.json(result);
    } catch (err) {
      console.error('[search] Error:', err);
      return next(err);
    }
  });

  medicinesRouter.get('/suggestions', async (req, res, next) => {
    try {
      const { q, type } = req.query;
      if (typeof q !== 'string' || q.trim().length < 3) {
        return next(new DomainError('QUERY_TOO_SHORT', 'El término debe tener al menos 3 caracteres.'));
      }
      const searchType: 'active' | 'commercial' = type === 'commercial' ? 'commercial' : 'active';
      const suggestions = await searchService.getSuggestions(q, searchType);
      return res.json(suggestions);
    } catch (err) {
      return next(err);
    }
  });

  medicinesRouter.get('/:id/prospect', async (req, res, next) => {
    try {
      const prospect = await prospectService.getProspect(req.params['id'] as string);
      return res.json(prospect);
    } catch (err) {
      return next(err);
    }
  });

  medicinesRouter.get('/:id', async (req, res, next) => {
    try {
      const medicine = await medicineRepo.findById(req.params['id'] as string);
      if (!medicine) {
        return res.status(404).json({ code: 'MEDICINE_NOT_FOUND', message: 'Medicamento no encontrado.' });
      }
      return res.json(medicine);
    } catch (err) {
      return next(err);
    }
  });

  // ── Rutas de interacciones ─────────────────────────────────────────────────

  const interactionsRouter = Router();

  interactionsRouter.post('/check', async (req, res, next) => {
    try {
      const { medicineIds } = req.body as { medicineIds?: unknown };
      if (!Array.isArray(medicineIds) || medicineIds.length === 0 || !medicineIds.every(id => typeof id === 'string')) {
        return res.status(400).json({ code: 'INVALID_REQUEST', message: '"medicineIds" debe ser un array no vacío de strings.' });
      }
      const result = await interactionService.checkInteractions(medicineIds as string[]);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  app.use('/api/v1/medicines', medicinesRouter);
  app.use('/api/v1/interactions', interactionsRouter);

  // ── Rutas de condiciones ───────────────────────────────────────────────────

  const conditionsRouter = Router();

  conditionsRouter.get('/', async (req, res, next) => {
    try {
      const { q } = req.query;
      if (typeof q === 'string' && q.trim().length > 0) {
        if (q.trim().length < 3) return next(new DomainError('QUERY_TOO_SHORT', 'Mínimo 3 caracteres.'));
        return res.json(await conditionRepo.search(q.trim()));
      }
      return res.json(await conditionRepo.findAll());
    } catch (err) { return next(err); }
  });

  conditionsRouter.get('/:id/ingredients', async (req, res, next) => {
    try {
      const result = await conditionRepo.findIngredientsByConditionId(req.params['id'] as string);
      if (!result) return res.status(404).json({ code: 'CONDITION_NOT_FOUND', message: 'Condición no encontrada.' });
      return res.json(result);
    } catch (err) { return next(err); }
  });

  conditionsRouter.get('/by-ingredient/:ingredientId', async (req, res, next) => {
    try {
      return res.json(await conditionRepo.findByIngredientId(req.params['ingredientId'] as string));
    } catch (err) { return next(err); }
  });

  app.use('/api/v1/conditions', conditionsRouter);
  app.use(errorHandler);

  // ── Arrancar ───────────────────────────────────────────────────────────────

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║   Vademécum — Servidor de desarrollo local           ║');
    console.log('║   Base de datos: pg-mem (en memoria)                 ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║   API:  http://localhost:${PORT}/api/v1               ║`);
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║   Endpoints disponibles:                             ║');
    console.log('║   GET  /api/v1/medicines/search?q=ibu&type=active    ║');
    console.log('║   GET  /api/v1/medicines/search?q=adv&type=commercial║');
    console.log('║   GET  /api/v1/medicines/suggestions?q=par           ║');
    console.log('║   GET  /api/v1/medicines/:id                         ║');
    console.log('║   GET  /api/v1/medicines/:id/prospect                ║');
    console.log('║   POST /api/v1/interactions/check                    ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
  });
}

startDevServer().catch((err: unknown) => {
  console.error('[devServer] Error al iniciar:', err);
  process.exit(1);
});
