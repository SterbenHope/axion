import $api from '../http';

export default class PromoService {
  static async validatePromoCode(code) {
    return $api.post('/promo/validate/', { code });
  }

  static async redeemPromoCode(code) {
    return $api.post('/promo/redeem/', { code });
  }

  static async getMyPromos() {
    return $api.get('/promo/my-promos/');
  }

  static async getPromoList() {
    return $api.get('/promo/list/');
  }

  static async getPromoDetail(code) {
    return $api.get(`/promo/detail/${code}/`);
  }
}


