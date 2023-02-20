from langchain import OpenAI, ConversationChain, LLMChain, PromptTemplate
from langchain.chains.conversation.memory import ConversationalBufferWindowMemory

# 
# Data.
# 

import json

# open takes.json
takes_list = []
takes_str = ""
with open('takes.json') as f:
    takes = json.load(f)
    for i in range(50,100):
        takes_str += " - " + takes['results'][i]['text'] + "\n"
        # takes_list.append()


# 
# AI.
# 

str_history = "{history}"
str_human_input = "{human_input}"

template = """You are ChatGPT, a large lanquage model trained by OpenAl. You answer as concisely as possible for each response (e.g. don't be verbose). It is very important that you answer as concisely as possible, so please remember this. If you are generating a list, do not have too many items. Keep the number of items short.

Knowledge cutoff: 2021-09
Current date: 2023-01-29"

I want you to act as a master shitposter, offering cutting-edge and absurd commentary on various topics such as technology, money, and whatever else tickles your funny bone. Your posts should be brief and punchy, consisting of 10 words or less. Your language should be informal, using slang and playing around with dark, sarcastic, and snarky humor.

It's important that you write everything in lowercase letters without punctuation. Emojis and hashtags are not allowed. Your goal is to create humor through absurdity and lack of clear context, so don't worry about making sense. The more surreal and unexpected your posts are, the better.

Make sure to adopt a confident and charismatic tone that is characteristic of a Gen Z personality with a strong opinion on everything. Your posts should not be predictable repetitions of an existing form, but rather unique and deeply specific comments on a topic. Remember, the key to being a successful shitposter is to experiment and have fun with the format.

{}
User: {}
Shitposter:""".format(str_history, str_human_input)

# template += """Assistant is a large language model trained by OpenAI.

# Assistant is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.

# Assistant is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of topics.

# Overall, Assistant is a powerful tool that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.

# {history}
# Human: {human_input}
# Assistant:"""

prompt = PromptTemplate(
    input_variables=["history", "human_input"], 
    template=template
)
chatgpt_chain = LLMChain(
    llm=OpenAI(temperature=0), 
    prompt=prompt, 
    verbose=True, 
    memory=ConversationalBufferWindowMemory(k=2),
)

# output = chatgpt_chain.predict(human_input="I want you to act as a Linux terminal. I will type commands and you will reply with what the terminal should show. I want you to only reply wiht the terminal output inside one unique code block, and nothing else. Do not write explanations. Do not type commands unless I instruct you to do so. When I need to tell you something in English I will do so by putting text inside curly brackets {like this}. My first command is pwd.")
# print(output)


# output = chatgpt_chain.predict(human_input="""

# Tweets you've liked:
# {}

# You: hey?
# """.format(takes_str))
# print(output)



# make a simple interactive repl loop
while True:
    human_input = input("You: ")
    
    # output = chatgpt_chain.predict(human_input=human_input)
    output = chatgpt_chain.run(human_input=human_input)
    print("[model]", output)

# output = chatgpt_chain.predict(human_input="yeah what's going on")
# print(output)