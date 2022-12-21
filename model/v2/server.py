

# The server handles these functions:
# - index new takes.
# - process new likes
# - recompute the index: total_likes, weights, etc.
# - compute bounty award for any take.
# - sign rewards claim requests.

def sign_msg(msg, key):
    return '0x'

class Server:
    def __init__(self) -> None:
        self.takes = []
        self.likes = []
        self.rewards_claims = []

    def on_new_take(self, event):
        self.takes.append(take)
    
    def on_new_bounty(self, amount):
        self.bounties.append(amount)
        # increase take bounty amount.
    
    def like(self, take_id, user, sig):
        # verify sig
        # assert like not already processed
        take = filter(lambda t: t.id == take_id, self.takes)
        take.likes += 1
        self.likes.append((take_id, user, sig))

    def recompute(self):
        # recompute the index: total_likes, weights, etc.
        pass

    def processed_rewards(self, user):
        processed = 0
        user_claims = self.get_user_rewards_claims(user)
        for rewards_claim in user_claims:
            processed += rewards_claim.amount
        return processed

    # a user can request rewards
    def generate_rewards_claim(self, user):
        offchain_balance = self.get_user_offchain_balance(user)

        rewards_claim = {
            'user': user,
            'amount': offchain_balance,
            'timestamp': 'now',
        }
        
        # Now sign message.
        sig = sign_msg(rewards_claim, self.private_key)
        rewards_claim.sig = sig

        # Save.
        self.rewards_claims.append(rewards_claim)

        return rewards_claim

    # Even if a user loses their rewards claim ticket, they can just re-request it.
    # No need for brittle self-expiring messages.
    def get_user_rewards_claims(self):
        return filter(lambda c: c.user == user, self.rewards_claims)
    
    def get_user_offchain_balance(self, user):
        total_rewards = reduce(map(user.takes, lambda t: t.bounty_rewards), add)
        offchain_balance = total_rewards - self.processed_rewards(user)
        return offchain_balance

    def get_take_rewards(self):
        # TODO.
        return

# We index takes server-side.
# All reward computation is done server-side, to avoid any complexity with contracts.
# We may migrate it to on-chain using ZK-SNARK's eventually, but for now, nothing here is remotely doable onchain.

