from uuid import UUID

def generate_tournament_tree(players):
    print(f"Generating tree for players: {players}")
    if len(players) == 1:
        return str(players[0]) 
    else:
        # calculate middle index
        middle = (len(players) + 1) // 2
        return {
            'left': generate_tournament_tree(players[:middle]),
            'right': generate_tournament_tree(players[middle:]),
            'winner': None,
        }


def get_winner(games, player1_id, player2_id):
    for game in games:
        if game.player1.id == player1_id and game.player2.id == player2_id or game.player1.username == player2_id and game.player2.username == player1_id:
            if game.player1_score > game.player2_score:
                return game.player1.id
            else:
                return game.player2.id
    return None
    

def fill_winners(games, tree):
    if isinstance(tree, int):
        return tree
    left = fill_winners(games, tree['left'])
    right = fill_winners(games, tree['right'])
    left_winner = left['winner'] if isinstance(left, dict) else left
    right_winner = right['winner'] if isinstance(right, dict) else right
    if left_winner != None and right_winner != None:
        winner = get_winner(games, left_winner, right_winner)
    else:
        winner = None
    return {
        'left': left,
        'right': right,
        'winner': winner
    }



    def find_next_match(self, tree):
        print("Searching for next match in:", tree)
        if isinstance(tree, str):
            print("Reached a leaf node (player):", tree)
            return None
        if not tree.get('winner'):
            left = tree['left']
            right = tree['right']
            if isinstance(left, str) and isinstance(right, str):
                print("Potential match found. Left:", left, "Right:", right)
                return {
                    'left': left,
                    'right': right,
                }
        left_match = self.find_next_match(tree['left'])
        if left_match:
            return left_match
        right_match = self.find_next_match(tree['right'])
        return right_match
    

    def notify_next_match(self, tournament):
        games = Games.objects.filter(tournament=tournament)
        tree = fill_winners(games, generate_tournament_tree(tournament.tournament_players.get(player)))
        next_games = find_next_match(tree)
        channel_layer = get_channel_layer()
        message = f"You are scheduled to play the next match in the {self.name} tournament against {player2.username}."
        for game in next_games:
            async_to_sync(channel_layer.group_send)(
                "tournament_notifications",
                {
                    "type": "tournament.notification",
                    "message": message,
                    "player_ids": [player1.id, player2.id],
                    "match_id": match.id,
                }
            )



    # def current_round(self):
    #     tree = self.get_current_tournament_tree()
    #     return self.calculate_depth(tree)
    
    # # depth of tournament
    # def calculate_depth(self, tree):
    #     if isinstance(tree, str):
    #         return 0
    #     return 1 + max(self.calculate_depth(tree['left']), self.calculate_depth(tree['right']))


# def next_games_to_play(tree):
#     if isinstance(tree, int):
#         return []
#     left = tree['left']
#     right = tree['right']
#     left_winner = left['winner'] if isinstance(left, dict) else left
#     right_winner = right['winner'] if isinstance(right, dict) else right
#     if left_winner != None and right_winner != None and tree['winner'] == None:
#         return [{'player1': left_winner, 'player2': right_winner}]
#     else:
#         return next_games_to_play(tree['left']) + next_games_to_play(tree['right'])

