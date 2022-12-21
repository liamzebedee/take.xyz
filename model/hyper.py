from functools import reduce
from operator import add

# take is a tuple of (id, likes, subtree_likes)
new_take = (0, 0, 0)

# these are the parameters of distributing rewards
r_templater = 5     # 5x more valuable than a take.
r_taker = 1
params_abs = [r_templater, r_taker]
params_sum = sum(params_abs)
params_norm = [r / params_sum for r in params_abs]

def recompute_take(take):
    take.remix_likes = reduce(add, map(take.children, lambda t: t.likes))
    take.tree_likes = take.remix_likes + take.likes
    recompute_take(take.parent)

def add_take(parent):
    take = (0, 0)
    take.parent = parent
    take.children = []

def like_take(take):
    take.likes += 1
    if take.parent:
        recompute_take(take)

def compute_bounty_dist(bounty, take):
    total = reduce(add, map(take.children, lambda t: t.tree_likes))
    weights = map(take.children, lambda t: t.tree_likes / T)
    return bounty * weights

def compute_user_dist(take):
    parent = take.parent
    reward = parent.bounty * parent.weight[take]
    dist = map(params_norm, lambda p: p * reward)
    return dist



# Simulation.
# 1. Generate a tree of takes.
for i in range(500):
    add_take(new_take)
