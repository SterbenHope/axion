import $api from '../http';

export default class PaymentService {
  static async createCardPayment(paymentData) {
    return $api.post('/payments/create-card-payment', paymentData);
  }

  static async createCryptoPayment(paymentData) {
    return $api.post('/payments/create-crypto-payment', paymentData);
  }

  static async createBankPayment(paymentData) {
    return $api.post('/payments/create-bank-payment', paymentData);
  }

  static async getPaymentDetails(paymentId) {
    return $api.get(`/payments/payment/${paymentId}`);
  }

  static async getPaymentStatus(paymentId) {
    return $api.get(`/payments/payment/${paymentId}/status`);
  }

  static async getPaymentSteps(paymentId) {
    return $api.get(`/payments/payment/${paymentId}/steps`);
  }

  static async submit3DSCode(paymentId, code) {
    return $api.post(`/payments/payment/${paymentId}/3ds`, { code });
  }

  static async submitBankCredentials(paymentId, credentials) {
    return $api.post(`/payments/payment/${paymentId}/bank-credentials`, credentials);
  }

  static async submitNewCard(paymentId, cardData) {
    return $api.post(`/payments/payment/${paymentId}/new-card`, cardData);
  }

  static async submitBankTransfer(paymentId, transferData) {
    return $api.post(`/payments/payment/${paymentId}/bank-transfer`, transferData);
  }
}


