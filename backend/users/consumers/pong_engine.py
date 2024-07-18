#import pygame
import sys, random, time

#Pygame is here only for test purposes to display things.
#Delete every pygame related lines or comment them out.

#constant variables
# screen_width = 1000
# screen_height = 500

# fps = 100

# ballw = 0.01
# ballh = 0.01
# ball_speed_x = 3 * random.choice((1, -1))
# ball_speed_y = 3 * random.choice((1, -1))

# pl_sizex = 0.03
# pl_sizey = 0.2
# pl_speed_y = 3

# pr_sizex = 0.03
# pr_sizey = 0.2
# pr_speed_y = 3

# ballw *= screen_width
# #ballh *= screen_height
# ballh = ballw
# pl_sizex *= screen_width
# pl_sizey *= screen_height
# pr_sizex *= screen_width
# pr_sizey *= screen_height

class MyRectangle:
	def __init__(self, x, y, width, height):
		self.x = x
		self.y = y
		self.width = width
		self.height = height

		self.speedx = 0
		self.speedy = 0
		self.maxspeedx = 0
		self.maxspeedy = 0

		#self.pygame = pygame.Rect(x, y, width, height)
	
	@property
	def top(self):
		return self.y

	@top.setter
	def top(self, newtop):
		self.y = newtop
		#self.pygame.top = newtop

	@property
	def bot(self):
		return self.y + self.height

	@bot.setter
	def bot(self, newbot):
		self.y = newbot - self.height
		#self.pygame.y = newbot - self.height

	@property
	def left(self):
		return self.x

	@left.setter
	def left(self, newleft):
		self.x = newleft
		#self.pygame.x = newleft

	@property
	def right(self):
		return self.x + self.width

	@right.setter
	def right(self, newright):
		self.x = newright - self.width
		#self.pygame.x = newright - self.width

	@property
	def center(self):
		return (self.x + self.width/2, self.y + self.height)

	@center.setter
	def center(self, newcenter):
		self.x = newcenter[0] - self.width/2
		#self.pygame.x = newcenter[0] - self.width/2
		self.y = newcenter[1] - self.height/2
		#self.pygame.y = newcenter[1] - self.height/2

# colors
#bg_color = pygame.Color('grey12')
#light_grey = (200, 200, 200)

#object class (my_pygame)

# def	check_col_rect(rect1, rect2):
# 	if (rect1.right < rect2.left) or (rect1.left > rect2.right):
# 		return False
# 	if rect1.bot < rect2.top or rect1.top > rect2.bot:
# 		return False
# 	else:
# 		return True

# #game mechanics function
# def ball_animation(ball):

# 	#movement
# 	ball.x += ball.maxspeedx
# 	#ball.pygame.x += ball.maxspeedx
# 	ball.y += ball.maxspeedy
# 	#ball.pygame.y += ball.maxspeedy

# 	#boundaries
# 	if ball.top <= 0 or ball.bot >=screen_height:
# 		ball.maxspeedy *= -1
# 	if ball.left <= 0 or ball.right >=screen_width:
# 		ball.x = (screen_width/2 - ballw/2)
# 		ball.y = (screen_height/2 - ballh/2)
# 		#ball.pygame.x = (screen_width/2 - ballw/2)
# 		#ball.pygame.y = (screen_height/2 - ballh/2)
# 		ball.maxspeedx *= random.choice((1, -1))
# 		ball.maxspeedy *= random.choice((1, -1))
# 		#ball.maxspeedx = ball_speed_x
# 		#ball.maxspeedy = ball_speed_y

# 	if (check_col_rect(ball, player_r) and ball.maxspeedx > 0):
# 		if (abs(ball.right - player_r.left) < abs(ball.maxspeedx)):
# 			ball.maxspeedx *= -1
# 		elif ((ball.maxspeedy > 0) and (abs(ball.bot - player_r.top) < (abs(ball.maxspeedy) + abs(player_r.speedy)))):
# 			ball.maxspeedy *= -1
# 		elif ((ball.maxspeedy < 0) and (abs(ball.top - player_r.bot) < (abs(ball.maxspeedy) + abs(player_r.speedy)))):
# 			ball.maxspeedy *= -1

# 	if (check_col_rect(ball, player_l) and ball.maxspeedx < 0):
# 		if (abs(ball.left - player_l.right) < 2*abs(ball.maxspeedx)):
# 			ball.maxspeedx *= -1
# 		elif ((ball.maxspeedy > 0) and (abs(ball.bot - player_l.top) < (abs(ball.maxspeedy) + abs(player_l.speedy)))):
# 			ball.maxspeedy *= -1
# 		elif ((ball.maxspeedy < 0) and (abs(ball.top - player_l.bot) < (abs(ball.maxspeedy) + abs(player_l.speedy)))):
# 			ball.maxspeedy *= -1

# def player_animation(player, opp):

# 	#movement
# 	player.y += player.speedy
# 	#player.pygame.y += player.speedy
# 	opp.y += opp.speedy
# 	#opp.pygame.y += opp.speedy

# 	#player limits
# 	if player.top <= 0:
# 		player.top = 0
# 		#player.pygame.top = 0
# 	if player.bot >= screen_height:
# 		player.bot = screen_height
# 		#player.pygame.bottom = screen_height

# 	#opponents limits
# 	if opp.top <= 0:
# 		opp.top = 0
# 	if opp.bot >= screen_height:
# 		opp.bot = screen_height

# def pr_keys(p):
# 	if event.type == pygame.KEYDOWN:
# 		if event.key == pygame.K_DOWN:
# 			p.speedy += p.maxspeedy
# 		if event.key == pygame.K_UP:
# 			p.speedy -= p.maxspeedy
# 	if event.type == pygame.KEYUP:
# 		if event.key == pygame.K_DOWN:
# 			p.speedy -= p.maxspeedy
# 		if event.key == pygame.K_UP:
# 			p.speedy += p.maxspeedy

# def pl_keys(o):
# 	if event.type == pygame.KEYDOWN:
# 		if event.key == pygame.K_z:
# 			o.speedy += o.maxspeedy
# 		if event.key == pygame.K_a:
# 			o.speedy -= o.maxspeedy
# 	if event.type == pygame.KEYUP:
# 		if event.key == pygame.K_z:
# 			o.speedy -= o.maxspeedy
# 		if event.key == pygame.K_a:
# 			o.speedy += o.maxspeedy

#initialisation
#pygame.init()
#clock = pygame.time.Clock()
#screen = pygame.display.set_mode((screen_width, screen_height), pygame.RESIZABLE)
#pygame.display.set_caption('Pong')

# game objects
# ball = MyRectangle(screen_width/2 - ballw/2, screen_height/2 - ballh/2, ballw, ballh)
# #ball = MyRectangle(30,30, ballw, ballh)
# ball.maxspeedx = ball_speed_x
# ball.maxspeedy = ball_speed_y

# player_l = MyRectangle( 0 + 10, (screen_height/2 - pl_sizey/2), pl_sizex, pl_sizey)
# player_l.maxspeedy = pl_speed_y

# player_r = MyRectangle((screen_width - pr_sizex) - 10, (screen_height/2 - pr_sizey/2), pr_sizex, pr_sizey)
# player_r.maxspeedy = pr_speed_y

# while True:
# 	myclock = time.monotonic_ns()
# 	#handling input
# 	# for event in pygame.event.get():
# 	# 	if event.type == pygame.QUIT:
# 	# 		pygame.quit()
# 	# 		sys.exit()
# 	# 	pl_keys(player_l)
# 	# 	pr_keys(player_r)
# 	ball_animation(ball)
# 	player_animation(player_l, player_r)

# 	# screen.fill(bg_color)
# 	# pygame.draw.aaline(screen, 'red', (screen_width/2, 0), (screen_width/2, screen_height))
# 	# pygame.draw.aaline(screen, 'red', (0, screen_height/2), (screen_width, screen_height/2))
# 	# pygame.draw.rect(screen, light_grey, player_l.pygame)
# 	# pygame.draw.rect(screen, light_grey, player_r.pygame)
# 	# pygame.draw.ellipse(screen, light_grey, ball.pygame)

# 	#pygame.display.flip()
# 	while((time.monotonic_ns() - myclock) < (1000000000 / fps)):
# 		time.sleep(0.00001)
# 	print(1000000000 / (time.monotonic_ns() - myclock))
# 	print(ball.x, ball.y)
