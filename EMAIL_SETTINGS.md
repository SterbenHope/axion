# Email Verification Settings

## Настройка верификации email

### 1. Переменные окружения

Добавьте следующие переменные в ваш `.env` файл:

```bash
# Email verification settings
EMAIL_VERIFICATION_ENABLED=False  # True чтобы включить, False чтобы выключить
EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES=10  # Время жизни кода в минутах
EMAIL_VERIFICATION_MAX_ATTEMPTS=3  # Максимальное количество попыток

# Email settings (для отправки писем)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend  # Для тестирования (выводит в консоль)
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend  # Для production

# SMTP settings (если используете реальный SMTP)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your-email@gmail.com
# EMAIL_HOST_PASSWORD=your-app-password
# DEFAULT_FROM_EMAIL=noreply@axion-play.su
```

### 2. Включение/выключение верификации

**Чтобы ВЫКЛЮЧИТЬ верификацию email:**
```bash
EMAIL_VERIFICATION_ENABLED=False
```

**Чтобы ВКЛЮЧИТЬ верификацию email:**
```bash
EMAIL_VERIFICATION_ENABLED=True
```

### 3. API Endpoints

#### Отправить код верификации
**POST** `/api/users/send-verification-code/`

```json
{
  "email": "user@example.com"
}
```

**Response (если верификация включена):**
```json
{
  "success": true,
  "message": "Verification code sent to email",
  "verification_required": true
}
```

**Response (если верификация выключена):**
```json
{
  "success": true,
  "message": "Email verification is disabled",
  "verification_required": false
}
```

#### Проверить код
**POST** `/api/users/verify-email-code/`

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "message": "Email verified successfully"
}
```

### 4. Тестирование

Для тестирования используйте консольный backend (уже настроен по умолчанию):
```bash
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

Коды будут выводиться в консоль сервера Django.

### 5. Production

Для production настройте реальный SMTP:
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.your-server.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@axion-play.su
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=noreply@axion-play.su
```

### 6. Валидация при регистрации

Если `EMAIL_VERIFICATION_ENABLED=True`:
- Перед регистрацией пользователь должен:
  1. Ввести email
  2. Получить код на email
  3. Ввести код для подтверждения

Если `EMAIL_VERIFICATION_ENABLED=False`:
- Регистрация работает как обычно без проверки email

