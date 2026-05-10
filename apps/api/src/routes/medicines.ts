import { Router, Request, Response, NextFunction } from 'express';
import type { FilterState } from '@drug-medicine-lookup/shared';
import { SearchService } from '../services/searchService';
import { ProspectService } from '../services/prospectService';
import { MedicineRepository } from '../repositories/medicineRepository';
import { DomainError } from '../services/domainErrors';

const router = Router();

const searchService = new SearchService();
const prospectService = new ProspectService();
const medicineRepository = new MedicineRepository();

/**
 * GET /api/v1/medicines/search
 * Search medicines by active ingredient or commercial name.
 *
 * Query params:
 *   q         - required, min 3 chars
 *   type      - 'active' | 'commercial' (default: 'active')
 *   page      - page number (default: 1)
 *   pageSize  - page size (default: 20, max: 20)
 *   lab       - filter by laboratory
 *   form      - filter by pharmaceutical form
 *   prescription - filter by requires prescription (true|false)
 *   sort      - 'name_asc' | 'name_desc'
 *
 * Requisitos: 1.1, 1.2, 1.3, 1.6, 2.1, 2.2, 2.3, 5.1, 5.2, 5.3, 5.4
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, type, page, pageSize, lab, form, prescription, sort } = req.query;

    // Validate required query param
    if (typeof q !== 'string' || q.trim().length < 3) {
      const err = new DomainError('QUERY_TOO_SHORT', 'El término de búsqueda debe tener al menos 3 caracteres.');
      return next(err);
    }

    // Validate type param
    const searchType: 'active' | 'commercial' =
      type === 'commercial' ? 'commercial' : 'active';

    // Parse pagination
    const pageNum = page !== undefined ? parseInt(String(page), 10) : 1;
    const pageSizeNum = pageSize !== undefined ? Math.min(parseInt(String(pageSize), 10), 20) : 20;

    // Build filters
    const filters: FilterState = {};

    if (typeof lab === 'string' && lab.trim() !== '') {
      filters.laboratory = lab.trim();
    }

    if (typeof form === 'string' && form.trim() !== '') {
      filters.pharmaceuticalForm = form.trim();
    }

    if (prescription === 'true') {
      filters.requiresPrescription = true;
    } else if (prescription === 'false') {
      filters.requiresPrescription = false;
    }

    if (sort === 'name_asc' || sort === 'name_desc') {
      filters.sortOrder = sort;
    }

    const result = await searchService.search(q, searchType, filters, pageNum);

    // Override pageSize in result if custom pageSize was requested
    // (SearchService uses the repository default; we pass it through)
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/medicines/suggestions
 * Return autocomplete suggestions for a query.
 *
 * Query params:
 *   q    - required, min 3 chars
 *   type - 'active' | 'commercial' (default: 'active')
 *
 * Requisitos: 1.2, 2.2
 */
router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, type } = req.query;

    if (typeof q !== 'string' || q.trim().length < 3) {
      const err = new DomainError('QUERY_TOO_SHORT', 'El término de búsqueda debe tener al menos 3 caracteres.');
      return next(err);
    }

    const searchType: 'active' | 'commercial' =
      type === 'commercial' ? 'commercial' : 'active';

    const suggestions = await searchService.getSuggestions(q, searchType);

    return res.json(suggestions);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/medicines/:id
 * Return medicine detail by ID.
 *
 * Requisitos: 2.4
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const medicine = await medicineRepository.findById(id as string);

    if (medicine === null) {
      return res.status(404).json({
        code: 'MEDICINE_NOT_FOUND',
        message: `No se encontró el medicamento con id "${id}".`,
      });
    }

    return res.json(medicine);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/medicines/:id/prospect
 * Return the prospect for a medicine.
 * Returns 404 with PROSPECT_NOT_FOUND if not available.
 *
 * Requisitos: 3.1, 3.2, 3.3
 */
router.get('/:id/prospect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const prospect = await prospectService.getProspect(id as string);

    return res.json(prospect);
  } catch (err) {
    return next(err);
  }
});

export default router;
