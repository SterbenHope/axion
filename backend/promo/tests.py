from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from .models import PromoCode, PromoRedemption, PromoCampaign, PromoRule

User = get_user_model()


class PromoCodeModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_promo_code_creation(self):
        """Test creating a promo code"""
        promo = PromoCode.objects.create(
            code='TEST123',
            name='Test Promo',
            description='Test promotion',
            promo_type='PERCENTAGE',
            discount_value=Decimal('10.00'),
            currency='USD',
            usage_limit=100,
            created_by=self.user
        )
        
        self.assertEqual(promo.code, 'TEST123')
        self.assertEqual(promo.name, 'Test Promo')
        self.assertEqual(promo.discount_value, Decimal('10.00'))
        self.assertEqual(promo.usage_limit, 100)
        self.assertEqual(promo.used_count, 0)
        self.assertTrue(promo.is_active)
    
    def test_promo_code_validation(self):
        """Test promo code validation"""
        promo = PromoCode.objects.create(
            code='VALID123',
            name='Valid Promo',
            promo_type='FIXED_AMOUNT',
            discount_value=Decimal('5.00'),
            currency='USD',
            usage_limit=50,
            created_by=self.user
        )
        
        # Test that promo code is valid
        self.assertTrue(promo.is_valid())
        
        # Test usage limit
        promo.used_count = 50
        promo.save()
        self.assertFalse(promo.is_valid())


class PromoRedemptionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.promo = PromoCode.objects.create(
            code='REDEEM123',
            name='Redeemable Promo',
            promo_type='PERCENTAGE',
            discount_value=Decimal('15.00'),
            currency='USD',
            usage_limit=10,
            created_by=self.user
        )
    
    def test_promo_redemption_creation(self):
        """Test creating a promo redemption"""
        redemption = PromoRedemption.objects.create(
            user=self.user,
            promo_code=self.promo,
            amount_saved=Decimal('15.00'),
            currency='USD',
            order_id='ORDER123',
            status='ACTIVE'
        )
        
        self.assertEqual(redemption.user, self.user)
        self.assertEqual(redemption.promo_code, self.promo)
        self.assertEqual(redemption.amount_saved, Decimal('15.00'))
        self.assertEqual(redemption.status, 'ACTIVE')


class PromoCampaignModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_promo_campaign_creation(self):
        """Test creating a promo campaign"""
        campaign = PromoCampaign.objects.create(
            name='Summer Sale',
            description='Summer promotional campaign',
            campaign_type='SEASONAL',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=30),
            created_by=self.user
        )
        
        self.assertEqual(campaign.name, 'Summer Sale')
        self.assertEqual(campaign.campaign_type, 'SEASONAL')
        self.assertTrue(campaign.is_active)


class PromoRuleModelTest(TestCase):
    def test_promo_rule_creation(self):
        """Test creating a promo rule"""
        rule = PromoRule.objects.create(
            name='New User Rule',
            description='Rule for new users only',
            rule_type='USER_SEGMENT',
            conditions={'user_type': 'new'},
            actions={'discount': '20%'},
            priority=1
        )
        
        self.assertEqual(rule.name, 'New User Rule')
        self.assertEqual(rule.rule_type, 'USER_SEGMENT')
        self.assertEqual(rule.priority, 1)
        self.assertTrue(rule.is_active)



















