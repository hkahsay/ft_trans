# Generated by Django 4.2.9 on 2024-06-17 16:04

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_userprofilemodel_last_seen'),
    ]

    operations = [
        migrations.DeleteModel(
            name='UserProfileModel',
        ),
    ]
