import { prisma } from '@/config';

function getHotels() {
  return prisma.hotel.findMany();
}

async function getHotel(hotelId: number) {
  return prisma.hotel.findFirst({
    where: { id: hotelId },
    include: {
      Rooms: {},
    },
  });
}

const hotelRepository = {
  getHotels,
  getHotel,
};

export default hotelRepository;
