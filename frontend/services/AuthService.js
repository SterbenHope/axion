import $api from '../http';

export default class AuthService {
  static async login(email, password) {
    return $api.post('/auth/login/', { username: email, password });
  }

  static async registration(email, password, referralCode = null) {
    // Generate username from email
    const username = email.split('@')[0];
    return $api.post('/auth/register/', { username, email, password, referralCode });
  }

  static async logout() {
    return $api.post('/auth/logout/');
  }
}

