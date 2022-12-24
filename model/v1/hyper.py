from functools import reduce
from operator import add

class Take:
    def __init__(self, i) -> None:
        self.id = i
        self.likes = 0
        # total likes in all subtrees
        self.sub_likes = 0
        self.parent = None
        self.children = []
        
        # the bounty this take has received.
        self.bounty = 0
    
    def dist_bounty(self, amt):
        self.bounty += amt
    
    def total_likes(self):
        return self.likes + self.sub_likes

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

def xmap(iter, f):
    return map(f, iter)

def xreduce(iter, f):
    return reduce(f, iter)

def recompute_take(take):
    if take.children:
        take.sub_likes = reduce(add, xmap(take.children, lambda t: t.total_likes()))
    else:
        take.sub_likes = 0
    if take.parent:
        recompute_take(take.parent)

def like_take(take):
    take.likes += 1

# return the distribution of a bounty to a take's children
def compute_bounty_dist(bounty, takes):
    if len(takes) == 0:
        return [bounty]
    
    # sum all the likes.
    total = reduce(add, xmap(takes, lambda t: t.total_likes()))
    # compute the weight of each node.
    weights = xmap(takes, lambda t: t.total_likes() / total)

    # compute the reward distribution.
    return list(xmap(weights, lambda w: w * bounty))

def compute_user_dist(take):
    parent = take.parent
    reward = parent.bounty * parent.weight[take]
    dist = xmap(params_norm, lambda p: p * reward)
    return dist


# 
# Simulation.
# 

# 1. Generate a tree of takes.
# 
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

def visit_tree(root, f, depth=0):
    f(root, depth)
    for child in root.children:
        visit_tree(child, f, depth + 1)

# Print the tree, showing each take's id.
def print_tree(root):
    visit_tree(root, lambda t, d: print(' ' * d, t.id))

print_tree(tree_root)

# 2. Add likes.
# 

# Randomly add likes to all takes.
import random
for take in all_takes:
    for i in range(random.randint(0, 10)):
        like_take(take)

# TODO remove
for take in all_takes:
    recompute_take(take)


# 3. Compute rewards.
# 
bounty = 1000

# Set the bounty from the root/
tree_root.bounty = bounty
def dist_bounty(take, depth=0):
    dist = compute_bounty_dist(take.bounty, take.children)
    for i, child in enumerate(take.children):
        child.dist_bounty(dist[i])

visit_tree(tree_root, dist_bounty)

# Print the tree, showing each take's id and bounty.
def print_tree_distributions(root):
    visit_tree(root, lambda t, d: print(' ' * d, t.id, '{num:{width}} likes'.format(num=t.total_likes(), width=3), str(int(t.bounty)) + " reward"))

print_tree_distributions(tree_root)

