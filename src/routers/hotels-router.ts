import { Router } from 'express';
import { authenticateToken } from '@/middlewares';
import { getHotel, getHotels } from '@/controllers';

const hotelsRouter = Router();

hotelsRouter.all('/*', authenticateToken).get('/hotels', getHotels).get('/hotels/:hotelId', getHotel);
