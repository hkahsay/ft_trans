# Generated by Django 4.2.9 on 2024-07-10 14:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0015_alter_tournamentmatch_tournament'),
    ]

    operations = [
        migrations.AlterField(
            model_name='users',
            name='id42',
            field=models.IntegerField(default=0),
        ),
    ]