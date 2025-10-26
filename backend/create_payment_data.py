#!/usr/bin/env python
"""
Script to create test data for payment system
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neoncasino.settings')
django.setup()

from payments_new.models import Bank, CryptoWallet
from telegram_bot_new.models import BotSettings

def create_banks():
    """Create test banks"""
    banks_data = [
        {'name': 'Deutsche Bank', 'country': 'Germany'},
        {'name': 'Commerzbank', 'country': 'Germany'},
        {'name': 'Sparkasse', 'country': 'Germany'},
        {'name': 'Volksbank', 'country': 'Germany'},
        {'name': 'UniCredit', 'country': 'Italy'},
        {'name': 'Intesa Sanpaolo', 'country': 'Italy'},
        {'name': 'BNP Paribas', 'country': 'France'},
        {'name': 'Société Générale', 'country': 'France'},
        {'name': 'Santander', 'country': 'Spain'},
        {'name': 'BBVA', 'country': 'Spain'},
    ]
    
    created_banks = []
    for bank_data in banks_data:
        bank, created = Bank.objects.get_or_create(
            name=bank_data['name'],
            defaults=bank_data
        )
        if created:
            print(f"✅ Created bank: {bank.name}")
        else:
            print(f"ℹ️  Bank already exists: {bank.name}")
        created_banks.append(bank)
    
    return created_banks

def create_crypto_wallets():
    """Create test crypto wallets"""
    wallets_data = [
        {'crypto_type': 'btc', 'wallet_address': 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'},
        {'crypto_type': 'eth', 'wallet_address': '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'},
        {'crypto_type': 'ltc', 'wallet_address': 'ltc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'},
        {'crypto_type': 'usdc', 'wallet_address': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'},
        {'crypto_type': 'usdt', 'wallet_address': '0xdAC17F958D2ee523a2206206994597C13D831ec7'},
        {'crypto_type': 'trx', 'wallet_address': 'TQn9Y2khDD95J42FQtQTdwVVRKjqEQJqXk'},
    ]
    
    created_wallets = []
    for wallet_data in wallets_data:
        wallet, created = CryptoWallet.objects.get_or_create(
            crypto_type=wallet_data['crypto_type'],
            defaults=wallet_data
        )
        if created:
            print(f"✅ Created crypto wallet: {wallet.get_crypto_type_display()}")
        else:
            print(f"ℹ️  Crypto wallet already exists: {wallet.get_crypto_type_display()}")
        created_wallets.append(wallet)
    
    return created_wallets

def create_bot_settings():
    """Create bot settings"""
    # You'll need to set your actual bot token here
    bot_settings, created = BotSettings.objects.get_or_create(
        defaults={
            'bot_token': 'YOUR_BOT_TOKEN_HERE',  # Replace with actual token
            'admin_chat_id': '-1002802840685',
            'is_active': False  # Set to True when you have a real token
        }
    )
    
    if created:
        print("✅ Created bot settings")
        print("⚠️  IMPORTANT: Set your actual bot token in admin panel!")
    else:
        print("ℹ️  Bot settings already exist")
    
    return bot_settings

def main():
    """Main function"""
    print("🚀 Creating payment system test data...")
    print("=" * 50)
    
    try:
        # Create banks
        print("\n🏦 Creating banks...")
        banks = create_banks()
        print(f"✅ Created {len(banks)} banks")
        
        # Create crypto wallets
        print("\n🪙 Creating crypto wallets...")
        wallets = create_crypto_wallets()
        print(f"✅ Created {len(wallets)} crypto wallets")
        
        # Create bot settings
        print("\n🤖 Creating bot settings...")
        bot_settings = create_bot_settings()
        
        print("\n" + "=" * 50)
        print("🎉 Payment system test data created successfully!")
        print("\n📋 Next steps:")
        print("1. Go to Django admin panel")
        print("2. Set your actual Telegram bot token in BotSettings")
        print("3. Test payment creation via API")
        print("4. Test Telegram notifications")
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
