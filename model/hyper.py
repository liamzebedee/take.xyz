from functools import reduce
from operator import add

class Take:
    def __init__(self, i) -> None:
        self.id = i
        self.likes = 0
        self.remix_likes = 0
        self.subtree_likes = 0
        self.parent = None
        self.children = []

take_counter = 0
def new_take():
    global take_counter
    take_counter += 1
    take = Take(take_counter)
    return take

# these are the parameters of distributing rewards
r_templater = 5     # 5x more valuable than a take.
r_taker = 1
params_abs = [r_templater, r_taker]
params_sum = sum(params_abs)
params_norm = [r / params_sum for r in params_abs]

def recompute_take(take):
    if take.children:
        take.remix_likes = reduce(add, map(lambda t: t.likes, take.children))
    else:
        take.remix_likes = 0
    take.tree_likes = take.remix_likes + take.likes
    if take.parent:
        recompute_take(take.parent)

def like_take(take):
    take.likes += 1
    if take.parent:
        recompute_take(take)

def compute_bounty_dist(bounty, take):
    total = reduce(add, map(take.children, lambda t: t.tree_likes), 0)
    weights = map(lambda t: t.tree_likes / total, take.children)
    for i in range(len(weights)):
        take.children[i].bounty = bounty * weights[i]
    #     weights[i] += params_norm[i]
    # return bounty * weights

def compute_user_dist(take):
    parent = take.parent
    reward = parent.bounty * parent.weight[take]
    dist = map(lambda p: p * reward, params_norm)
    return dist



# Simulation.
# 1. Generate a tree of takes.
def generate_tree(depth, parent):
    global all_takes
    takes = []
    
    for i in range(3):
        take = new_take()
        take.parent = parent
        if depth > 0:
            take.children = generate_tree(depth - 1, take)
        takes.append(take)
        all_takes.append(take)

    parent.children = takes

    return takes

all_takes = []
tree_root = new_take()
tree = generate_tree(4, tree_root)

# Print the tree, showing each take's id.
def print_tree(root, depth=0):
    print(' ' * depth, root.id)

    for child in root.children:
        print_tree(child, depth + 1)

print_tree(tree_root)

# 2. Add likes.
# Randomly add likes to takes.
import random
for i in range(100):
    take = random.choice(all_takes)
    like_take(take)

# 3. Compute rewards.
bounty = 1000

for take in all_takes:
    compute_bounty_dist(bounty, take)
    