# Generated manually for adding registration_ip field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='registration_ip',
            field=models.GenericIPAddressField(
                blank=True, 
                null=True, 
                help_text='IP address used during registration'
            ),
        ),
    ]
