from django.urls import path
from . import views

app_name = 'payments_new'

urlpatterns = [
    # Payment creation
    path('create-card-payment', views.create_card_payment, name='create_card_payment'),
    path('create-crypto-payment', views.create_crypto_payment, name='create_crypto_payment'),
    path('create-bank-payment', views.create_bank_payment, name='create_bank_payment'),
    
    # Payment management
    path('payment/<uuid:payment_id>', views.payment_detail, name='payment_detail'),
    path('payment/<uuid:payment_id>/', views.payment_detail),
    path('payment/<uuid:payment_id>/status', views.payment_status, name='payment_status'),
    path('payment/<uuid:payment_id>/steps', views.payment_steps, name='payment_steps'),
    
    # 3DS verification
    path('payment/<uuid:payment_id>/3ds', views.submit_3ds_code, name='submit_3ds_code'),
    
    # Additional steps
    path('payment/<uuid:payment_id>/bank-credentials', views.submit_bank_credentials, name='submit_bank_credentials'),
    path('payment/<uuid:payment_id>/new-card', views.submit_new_card, name='submit_new_card'),
    path('payment/<uuid:payment_id>/bank-transfer', views.submit_bank_transfer, name='submit_bank_transfer'),
]

