
import openai
def ask(question):
    messages = []
    messages.append({"role": "user", "content": question})

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages
    )
    choice = response['choices'][0]
    finish_reason = choice['finish_reason']

    if finish_reason != "stop":
        print(response)

    message = choice['message']
    return message['content']


import webbrowser

url = "https://etherscan.io/blocks"
webbrowser.open(url)
from googlesearch import search

query = "current ethereum block hash"
num_results = 1

for result in search(query, num_results=num_results):
    webbrowser.open(result)