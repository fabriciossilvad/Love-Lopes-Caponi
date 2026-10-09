import { z } from 'zod';
export const listGiftReservationsQuerySchema = z.object({token:z.string().min(24)});
