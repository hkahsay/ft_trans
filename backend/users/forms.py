from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import Users

class UsersCreationForm(UserCreationForm):
	class Meta(UserCreationForm):
		model = Users
		fields = ("username", "email", "picture")


class UsersChangeForm(UserChangeForm):
	class Meta(UserChangeForm.Meta):
		model = Users
		fields = ("username", "email", "tfa_enabled", "picture")
