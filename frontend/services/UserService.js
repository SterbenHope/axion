import $api from '../http';

export default class UserService {
  static async fetchUsers() {
    return $api.get('/users');
  }

  static async processPayment(paymentData) {
    return $api.post('/payment', paymentData);
  }

  static async verify3DS(verificationData) {
    return $api.post('/verify-3ds', verificationData);
  }
}

