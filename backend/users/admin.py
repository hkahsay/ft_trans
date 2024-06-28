from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import UsersCreationForm, UsersChangeForm
from .models import Users

class UsersAdmin(UserAdmin):
	add_form = UsersCreationForm
	form = UsersChangeForm
	model = Users
	list_display = ["username", "id", "tfa_enabled", "picture"]
	fieldsets = UserAdmin.fieldsets + ( #add the custom fields to the UserAdmin fieldsets
		(None, {"fields": ("tfa_enabled", "picture")}),
	)

admin.site.register(Users, UsersAdmin)
