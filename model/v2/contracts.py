msg = {
    sender: "0x0000000000000000000000000000000000000000",
}

block = {
    timestamp: 0,
}

def verify_sig(msg, sig):
    return True

class HyperProtocol:
    def __init__(self, hype_token) -> None:
        self.hype_token = hype_token
        self.bounties = []
        self.processed_reward_claims = {}
        self.minter_address = '0x'
    
    def address():
        return '0x0000000000000000000000000000000000000000'

    def make_bounty(self, take_id, amount):
        self.hype_token.transfer(msg.sender, self.address(), amount)
        self.bounties.append({
            'take_id': take_id,
            'amount': amount,
            'sender': msg.sender,
        })

    def claim_rewards(self, amount, user, expiry, version, msg_hash, sig):
        assert verify_sig(None, sig)
        assert block.timestamp < expiry
        assert self.processed_reward_claims[msg_hash] == False
        self.hype_token.mint(user, amount)
        self.processed_reward_claims[msg_hash] = True

class Take:
    def __init__(self) -> None:
        self.bounty = 0

class HYPEToken:
    def __init__(self, hype_protocol) -> None:
        self.hype_protocol = hype_protocol
        self.balances = {}

    def mint(self, user, amount):
        assert msg.sender == self.hype_protocol.address()
        if self.balances[user]:
            self.balances[user] = 0
        self.balances[user] += amount


