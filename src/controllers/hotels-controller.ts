import { Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares';
import hotelsService from '@/services/hotels-service';

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const hotels = await hotelsService.getHotels(userId);
  res.send(hotels);
}

export async function getHotel(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const hotelId = Number(req.params.hotelId);
  const hotel = await hotelsService.getHotel(userId, hotelId);
  res.send(hotel);
}
