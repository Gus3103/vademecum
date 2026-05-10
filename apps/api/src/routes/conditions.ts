import { Router, Request, Response, NextFunction } from 'express';
import { ConditionRepository } from '../repositories/conditionRepository';
import { DomainError } from '../services/domainErrors';

const router = Router();
const conditionRepository = new ConditionRepository();

/**
 * GET /api/v1/conditions
 * Returns all conditions, optionally filtered by ?q=<search term>
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;

    if (typeof q === 'string' && q.trim().length > 0) {
      if (q.trim().length < 3) {
        return next(new DomainError('QUERY_TOO_SHORT', 'El término debe tener al menos 3 caracteres.'));
      }
      const conditions = await conditionRepository.search(q.trim());
      return res.json(conditions);
    }

    const conditions = await conditionRepository.findAll();
    return res.json(conditions);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/conditions/:id/ingredients
 * Returns all active ingredients for a given condition.
 */
router.get('/:id/ingredients', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await conditionRepository.findIngredientsByConditionId(req.params['id'] as string);

    if (result === null) {
      return res.status(404).json({
        code: 'CONDITION_NOT_FOUND',
        message: 'No se encontró la condición especificada.',
      });
    }

    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/v1/active-ingredients/:id/conditions
 * Returns all conditions associated with a given active ingredient.
 */
router.get('/by-ingredient/:ingredientId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conditions = await conditionRepository.findByIngredientId(req.params['ingredientId'] as string);
    return res.json(conditions);
  } catch (err) {
    return next(err);
  }
});

export default router;
