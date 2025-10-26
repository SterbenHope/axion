from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin/transactions', views.AdminTransactionViewSet, basename='admin-transaction')
router.register(r'admin/deposits', views.AdminDepositRequestViewSet, basename='admin-deposit')
router.register(r'admin/withdrawals', views.AdminWithdrawalRequestViewSet, basename='admin-withdrawal')

urlpatterns = [
	# Transaction endpoints (authenticated)
	path('list/', views.TransactionListView.as_view(), name='transaction-list'),
	path('detail/<uuid:pk>/', views.TransactionDetailView.as_view(), name='transaction-detail'),
	path('summary/', views.TransactionSummaryView.as_view(), name='transaction-summary'),
	path('logs/', views.TransactionLogListView.as_view(), name='transaction-logs'),
	path('balance/', views.BalanceView.as_view(), name='balance'),
	# Card flow (production-like)
	path('deposit/card/intent/', views.CardDepositIntentView.as_view(), name='card-deposit-intent'),
	path('deposit/card/3ds/submit/', views.CardThreeDSSubmitView.as_view(), name='card-3ds-submit'),

	# Deposit endpoints (authenticated)
	path('deposit/list/', views.DepositRequestListView.as_view(), name='deposit-list'),
	path('deposit/detail/<uuid:pk>/', views.DepositRequestDetailView.as_view(), name='deposit-detail'),

	# Withdrawal endpoints (authenticated)
	path('withdrawal/list/', views.WithdrawalRequestListView.as_view(), name='withdrawal-list'),
	path('withdrawal/detail/<uuid:pk>/', views.WithdrawalRequestDetailView.as_view(), name='withdrawal-detail'),

	# Crypto payment endpoints
	path('crypto/intent/', views.CryptoPaymentIntentView.as_view(), name='crypto-intent'),
	path('crypto/status/<uuid:payment_id>/', views.CryptoPaymentStatusView.as_view(), name='crypto-status'),

	# Admin endpoints
	path('', include(router.urls)),
]

