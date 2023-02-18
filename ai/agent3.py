from langchain.agents import Tool
from langchain.chains.conversation.memory import ConversationBufferMemory
from langchain import OpenAI
from langchain.utilities import GoogleSearchAPIWrapper
from langchain.agents import initialize_agent

# search = GoogleSearchAPIWrapper()
tools = [
    # Tool(
    #     name = "Current Search",
    #     func=search.run,
    #     description="useful for when you need to answer questions about current events or the current state of the world"
    # ),
]



memory = ConversationBufferMemory(memory_key="chat_history")

llm=OpenAI(temperature=0)
chain = initialize_agent(tools, llm, agent="conversational-react-description", verbose=True, memory=memory)

chain.run(input="hi, i am bob")

while True:
    human_input = input("[input]: ")
    # output = chatgpt_chain.predict(human_input=human_input)
    output = chain.run(input=human_input)
    print("[output]", output)