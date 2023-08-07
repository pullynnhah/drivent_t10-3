import supertest from 'supertest';
import httpStatus from 'http-status';
import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import { TicketStatus } from '@prisma/client';
import { cleanDb, generateValidToken } from '../helpers';
import {
  createEnrollmentWithAddress,
  createHotelWithRooms,
  createHotel,
  createTicket,
  createTicketType,
  createUser,
} from '../factories';
import app, { init } from '@/app';
import { prisma } from '@/config';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /hotels', () => {
  describe('invalid token', () => {
    it('should respond with status 401 if no token is given', async () => {
      const { status } = await server.get('/hotels');
      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if given token is not valid', async () => {
      const token = faker.lorem.word();
      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if there is no session for given token', async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe('valid token (w/o hotel)', () => {
    it('should respond with 404 when user is not enroll', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
    it('should respond with 404 when enrolled user has no ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);

      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
    it('should respond with 402 when enrolled user has remote ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
    });
    it('should respond with 402 when enrolled user has in person ticket that does not include hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: false });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
    });
    it('should respond with 404 when no hotel is found', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
  });
  describe('valid token (w/ hotel)', () => {
    it('should respond with 200 when a hotel is found', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const hotel = await createHotel();
      const { body, status } = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.OK);
      expect(body).toHaveLength(1);
      expect(body).toEqual([
        { ...hotel, createdAt: hotel.createdAt.toISOString(), updatedAt: hotel.updatedAt.toISOString() },
      ]);
    });
  });
});

describe('GET /hotels/:hotelId', () => {
  describe('invalid token', () => {
    it('should respond with status 401 if no token is given', async () => {
      const { status } = await server.get('/hotels/1');
      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if given token is not valid', async () => {
      const token = faker.lorem.word();
      const { status } = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);

      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if there is no session for given token', async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const { status } = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe('valid token (no hotel)', () => {
    it('should respond with 404 when user is not enroll', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { status } = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
    it('should respond with 404 when enrolled user has no ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);

      const { status } = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
    it('should respond with 402 when enrolled user has remote ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
    });
    it('should respond with 402 when enrolled user has in person ticket that does not include hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: false });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.PAYMENT_REQUIRED);
    });
    it('should respond with 404 when no hotel is found', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
  });
  describe('valid token (w/ hotel)', () => {
    it('should respond with 200 when a hotel is found', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { hotel, rooms } = await createHotelWithRooms();
      const { body, status } = await server.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.OK);
      expect(body).toEqual({
        ...hotel,
        Rooms: rooms.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        createdAt: hotel.createdAt.toISOString(),
        updatedAt: hotel.updatedAt.toISOString(),
      });
    });
  });
});
