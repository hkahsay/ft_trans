# Generated by Django 4.2.9 on 2024-07-09 14:26

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0014_alter_tournamentmatch_tournament'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tournamentmatch',
            name='tournament',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tournament_matches', to='users.tournament'),
        ),
    ]