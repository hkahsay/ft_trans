# Generated by Django 4.2.9 on 2024-07-17 12:21

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0020_remove_games_round'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='games',
            name='settings',
        ),
    ]