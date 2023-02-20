# from langchain.agents import Tool
# from langchain.chains.conversation.memory import ConversationBufferMemory
# from langchain import OpenAI
# from langchain.utilities import GoogleSearchAPIWrapper
# from langchain.agents import initialize_agent

# tools = []

# memory = ConversationBufferMemory(memory_key="chat_history")

# llm=OpenAI(temperature=0)
# agent_chain = initialize_agent(tools, llm, agent="conversational-react-description", verbose=True, memory=memory)

 


from langchain import OpenAI, ConversationChain, LLMChain, PromptTemplate
from langchain.chains.conversation.memory import ConversationalBufferWindowMemory


template = """Assistant is a large language model trained by OpenAI.

Assistant is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.

Assistant is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of topics.

Overall, Assistant is a powerful tool that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.

{history}
Human: {human_input}
Assistant:"""

prompt = PromptTemplate(
    input_variables=["history", "human_input"], 
    template=template
)


chatgpt_chain = LLMChain(
    llm=OpenAI(temperature=0.9), 
    prompt=prompt, 
    verbose=True, 
    memory=ConversationalBufferWindowMemory(k=4),
)

# read the contents of prompts/1 into a string in one-line
# output = chatgpt_chain.predict(human_input=open("prompts/1.2").read())
output = chatgpt_chain.predict(human_input=open("prompts/2.1").read())
# output = chatgpt_chain.predict(human_input=open("prompts/4").read())
print(output)


while True:
    human_input = input("[input]: ")
    # output = chatgpt_chain.predict(human_input=human_input)
    output = chatgpt_chain.run(human_input=human_input)
    print("[output]", output)