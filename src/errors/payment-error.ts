import { ApplicationError } from '@/protocols';

export function PaymentError(): ApplicationError {
  return {
    name: 'PaymentError',
    message: 'You do not fulfill requirements for access here!',
  };
}
