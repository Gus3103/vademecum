import { Router, Request, Response, NextFunction } from 'express';
import { InteractionService } from '../services/interactionService';

const router = Router();

const interactionService = new InteractionService();

/**
 * POST /api/v1/interactions/check
 * Check for drug interactions among a list of medicines.
 *
 * Body: { medicineIds: string[] }
 *
 * Requisitos: 4.1, 4.2, 4.3, 4.4
 */
router.post('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { medicineIds } = req.body as { medicineIds?: unknown };

    // Validate that medicineIds is a non-empty array of strings
    if (
      !Array.isArray(medicineIds) ||
      medicineIds.length === 0 ||
      !medicineIds.every((id) => typeof id === 'string')
    ) {
      return res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'El campo "medicineIds" debe ser un array no vacío de strings.',
      });
    }

    const result = await interactionService.checkInteractions(medicineIds as string[]);

    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

export default router;
