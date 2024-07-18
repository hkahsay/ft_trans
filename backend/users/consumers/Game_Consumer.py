import json
import asyncio
import random, time
from . import pong_engine
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer



class GameConsumer(AsyncWebsocketConsumer):
	active_room = None

	async def connect(self):
		print("suuu")
		self.data = {"leftPlayer": {"up": 0, "down": 0}, "rightPlayer": {"up": 0, "down": 0}, "events": {"fin": 0}}

		self.screen_width = 500
		self.screen_height = 300

		self.fps = 60

		self.ballw = 0.01 * self.screen_width
		self.ballh = self.ballw
		self.ball_speed_x = 2 * random.choice((1, -1))
		self.ball_speed_y = 2 * random.choice((1, -1))

		self.pl_sizex = 0.03 * self.screen_width
		self.pl_sizey = 0.2 * self.screen_height
		self.pl_speed_y = 3

		self.pr_sizex = 0.03 * self.screen_width
		self.pr_sizey = 0.2 * self.screen_height
		self.pr_speed_y = 3

		# game objects
		self.ball = pong_engine.MyRectangle(self.screen_width/2 - self.ballw/2, self.screen_height/2 - self.ballh/2, self.ballw, self.ballh)
		self.ball.maxspeedx = self.ball_speed_x
		self.ball.maxspeedy = self.ball_speed_y

		self.player_l = pong_engine.MyRectangle( 0 + 10, (self.screen_height/2 - self.pl_sizey/2), self.pl_sizex, self.pl_sizey)
		self.player_l.maxspeedy = self.pl_speed_y

		self.player_r = pong_engine.MyRectangle((self.screen_width - self.pr_sizex) - 10, (self.screen_height/2 - self.pr_sizey/2), self.pr_sizex, self.pr_sizey)
		self.player_r.maxspeedy = self.pr_speed_y

		self.left_score = 0
		self.right_score = 0

		self.data["events"]["fin"] = 0

		await self.accept()
		print("game websocket connected")

		self.player_role = None

		if GameConsumer.active_room is None:
			#self.room_group_name = f"game_{self.channel_name}"
			self.room_group_name = f"game_room_test"
			GameConsumer.active_room = self.room_group_name
			self.player_role = "leftPlayer"

			await self.channel_layer.group_add(
				self.room_group_name,
				self.channel_name
			)

			await self.send(text_data=json.dumps({"type": "waiting_for_player"}))

		else:
			self.room_group_name = GameConsumer.active_room
			self.player_role = "rightPlayer"

			await self.channel_layer.group_add(
				self.room_group_name,
				self.channel_name
			)
			await self.channel_layer.group_send(
				self.room_group_name,
				{"type": "start_game_event"}
			)

	async def disconnect(self, close_code):
		print("game websocket disconnected")
		if self.room_group_name:
			await self.channel_layer.group_discard(
				self.room_group_name,
				self.channel_name
			)
		if self.room_group_name == GameConsumer.active_room:
			GameConsumer.active_room = None

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		origin = text_data_json.get("origin")
		key_data = text_data_json.get("key", {})
		end = text_data_json.get("events", {}).get("fin", 0)

		if self.player_role == "leftPlayer" and origin == "leftPlayer":
			self.handle_player_input(self.player_l, key_data)
		elif self.player_role == "rightPlayer" and origin == "rightPlayer":
			await self.channel_layer.group_send(
				self.room_group_name, {
					"type": "right_player_input",
					"data": {
						"origin": origin,
						"key_data": key_data
					}
				}
			)
		if (end == 1):
			self.data["events"]["fin"] = 1
		else:
			self.data["events"]["fin"] = 0

	async def right_player_input(self, event):
		origin = event["data"]["origin"]
		if self.player_role == "leftPlayer" and origin == "rightPlayer":
			key_data = event["data"]["key_data"]
			self.handle_player_input(self.player_r, key_data)

	def handle_player_input(self, player, key_data):
		if "up" in key_data:
			if key_data["up"] == 1 and player.speedy >= 0:
				player.speedy -= player.maxspeedy
			elif key_data["up"] == 0 and player.speedy <= 0:
				player.speedy += player.maxspeedy
		if "down" in key_data:
			if key_data["down"] == 1 and player.speedy <= 0:
				player.speedy += player.maxspeedy
			elif key_data["down"] == 0 and player.speedy >= 0:
				player.speedy -= player.maxspeedy

	async def start_game_event(self, event):
		if self.player_role == "leftPlayer":
			asyncio.create_task(self.game_start())
	
	async def game_start(self):
		elapsed_time = 0
		print("game starting :")
		print("game state    =", self.data)
		while self.data["events"]["fin"] == 0:
			myclock = time.monotonic_ns()
			self.ball_animation(self.ball)
			self.player_animation(self.player_l, self.player_r)

			await self.channel_layer.group_send(
				self.room_group_name, {
					"type": "game_state_update",
					"data": {
						"action":"input",
						"ball":{"x":self.ball.x, "y":self.ball.y},
						"leftPaddle": {"x":self.player_l.x, "y":self.player_l.y},
						"rightPaddle": {"x":self.player_r.x, "y":self.player_r.y},
						"score": {"left": self.left_score, "right": self.right_score}
					}
				}
			)
			elapsed_time = ((time.monotonic_ns() - myclock) / 1000000000)
			if (elapsed_time < (1 / self.fps)):
				await asyncio.sleep((1 / self.fps) - elapsed_time)
			# while((time.monotonic_ns() - myclock) < (1000000000 / self.fps)):
			# 	await asyncio.sleep(0.00001)
			# print(f'{1000000000 / (time.monotonic_ns() - myclock):4.2f} fps')

	async def game_state_update(self, event):
		data = event["data"]
		await self.send(text_data=json.dumps(data))

	def	check_col_rect(self, rect1, rect2):
		if (rect1.right < rect2.left) or (rect1.left > rect2.right):
			return False
		if rect1.bot < rect2.top or rect1.top > rect2.bot:
			return False
		else:
			return True

	#game mechanics function
	def ball_animation(self, ball):

		#movement
		ball.x += ball.maxspeedx
		ball.y += ball.maxspeedy

		#boundaries
		if ball.top <= 0 or ball.bot >=self.screen_height:
			ball.maxspeedy *= -1
		if ball.left <= 0 or ball.right >=self.screen_width:
			ball.x = (self.screen_width/2 - self.ballw/2)
			ball.y = (self.screen_height/2 - self.ballh/2)
			ball.maxspeedx *= random.choice((1, -1))
			ball.maxspeedy *= random.choice((1, -1))
			#ball.maxspeedx = ball_speed_x
			#ball.maxspeedy = ball_speed_y

		if (self.check_col_rect(ball, self.player_r) and ball.maxspeedx > 0):
			if (abs(ball.right - self.player_r.left) < abs(ball.maxspeedx)):
				ball.maxspeedx *= -1
			elif ((ball.maxspeedy > 0) and (abs(ball.bot - self.player_r.top) < (abs(ball.maxspeedy) + abs(self.player_r.speedy)))):
				ball.maxspeedy *= -1
			elif ((ball.maxspeedy < 0) and (abs(ball.top - self.player_r.bot) < (abs(ball.maxspeedy) + abs(self.player_r.speedy)))):
				ball.maxspeedy *= -1

		if (self.check_col_rect(ball, self.player_l) and ball.maxspeedx < 0):
			if (abs(ball.left - self.player_l.right) < 2*abs(ball.maxspeedx)):
				ball.maxspeedx *= -1
			elif ((ball.maxspeedy > 0) and (abs(ball.bot - self.player_l.top) < (abs(ball.maxspeedy) + abs(self.player_l.speedy)))):
				ball.maxspeedy *= -1
			elif ((ball.maxspeedy < 0) and (abs(ball.top - self.player_l.bot) < (abs(ball.maxspeedy) + abs(self.player_l.speedy)))):
				ball.maxspeedy *= -1

	def player_animation(self, player, opp):

		#movement
		player.y += player.speedy
		opp.y += opp.speedy

		#player limits
		if player.top <= 0:
			player.top = 0
		if player.bot >= self.screen_height:
			player.bot = self.screen_height

		#opponents limits
		if opp.top <= 0:
			opp.top = 0
		if opp.bot >= self.screen_height:
			opp.bot = self.screen_height
