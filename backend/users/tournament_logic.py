import random

class tournamentManager:
	def __init__(self, players, captain):
		self.remaining = players.copy()
		self.remaining.append(captain)
		self.nb_player = len(self.remaining)
	
	def disp_players(self):
		for i, player in enumerate(self.remaining):
			print(i, player)

	def next_game(self):
		if len(self.remaining) > 1:
			player1 = self.remaining[0]
			self.remaining.pop(0)
			player2 = self.remaining[0]
			self.remaining.pop(0)
			return([player1, player2])
		else:
			return(self.remaining[0])
		
	def start_game(self, next_players):
		"""start the actual game"""
		print("---START GAME---")
		print(next_players[0], " FIGHTING ", next_players[1])
		return

	def get_winner(self, next_players):
		"""retrieve the winner from the real game"""
		print("---RETRIEVING GAME WINNER---")
		x = random.randint(0, 1)
		print(next_players[x], " WON")
		winner = next_players[x]
		return winner

	def setup_next_game(self):
		"""stub"""
		next = self.next_game()
		print("Next game is ", next[0], " vs ", next[1])
		self.start_game(next)
		self.remaining.append(self.get_winner(next))
		return next

	def start_tournament(self):
		print("___________")
		print("___START___")
		print("___________")
		while len(self.remaining) > 1:
			self.setup_next_game()
		winner = self.remaining[0]
		print("AND THE WINNER OF THE TOURNAMENT IS :")
		print("***", winner, "***")
		print("___________")
		print("__THE END__")
		print("___________")
		return winner