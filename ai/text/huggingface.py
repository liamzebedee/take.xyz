import requests

# API_URL ="https://api-inference.huggingface.co/models/EleutherAI/gpt-j-6B"
API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
headers = {"Authorization": "Bearer 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"}

def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()
	
output = query({
	"inputs": """I want you to act as a master shitposter, offering cutting-edge and absurd commentary on various topics such as technology, money, and whatever else tickles your funny bone. Your posts should be brief and punchy, consisting of 10 words or less. Your language should be informal, using slang and playing around with dark, sarcastic, and snarky humor.

It's important that you write everything in lowercase letters without punctuation. Emojis and hashtags are not allowed. Your goal is to create humor through absurdity and lack of clear context, so don't worry about making sense. The more surreal and unexpected your posts are, the better.

Make sure to adopt a confident and charismatic tone that is characteristic of a Gen Z personality with a strong opinion on everything. Your posts should not be predictable repetitions of an existing form, but rather unique and deeply specific comments on a topic. Remember, the key to being a successful shitposter is to experiment and have fun with the format.

User: What is the meaning of life?"""
})
print(output)