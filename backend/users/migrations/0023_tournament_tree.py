# Generated by Django 4.2.9 on 2024-07-17 13:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0022_games_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='tournament',
            name='tree',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
