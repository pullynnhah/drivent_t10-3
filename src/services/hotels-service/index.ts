import { notFoundError } from '@/errors';
import enrollmentRepository from '@/repositories/enrollment-repository';
import ticketsRepository from '@/repositories/tickets-repository';
import { PaymentError } from '@/errors/payment-error';
import hotelRepository from '@/repositories/hotel-repository';

async function verifyEnrollmentAndTicket(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw notFoundError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw notFoundError();

  if (ticket.status === 'RESERVED' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel)
    throw PaymentError();
}

async function getHotels(userId: number) {
  await verifyEnrollmentAndTicket(userId);
  const hotels = await hotelRepository.getHotels();
  if (hotels.length === 0) throw notFoundError();
  return hotels;
}

async function getHotel(userId: number, hotelId: number) {
  await verifyEnrollmentAndTicket(userId);
  const hotel = await hotelRepository.getHotel(hotelId);
  if (!hotel) throw notFoundError();
  return hotel;
}

const hotelsService = {
  getHotels,
  getHotel,
};

export default hotelsService;
