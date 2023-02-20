import os
import openai
import base64
from langchain import OpenAI, ConversationChain, LLMChain, PromptTemplate
from langchain.chains.conversation.memory import ConversationalBufferWindowMemory
from chatgpt_wrapper import ChatGPT
import requests
import urllib
import urllib.request
import urllib.parse
import json
import codecs


def to_enc(s):
    # Base64.
    # return str(base64.b64encode(s.encode()))
    # ROT13.
    # return codecs.encode(s, 'rot_13')
    return s


# Generate a scene description from a very short tweet-sized take.
PROMPT_SCENE_DESCRIPTION_GENERATOR = lambda x: f"""
Using a given text-based meme as inspiration, suggest an idea for a low-fidelity image-based meme inspired by the given text-based meme, that captures the humor and essence of the original. You can use any images you find through a quick search on Google Images, but the key is to make it look rough, homemade, and low-fi. Think of it as if you're creating a meme on a Figma canvas, but with a DIY, slapdash feel to it. Do NOT use words in your meme. Do not incorporate any written text or language. You can only use symbols and imagery. Have fun and get creative with it! The goal is to come up with a unique, dank meme that would make even the most cynical internet user crack a smile. Only reply with the idea, and nothing else. Do not ask questions, or refer to previous inputs.

Your text-based meme: {x}
"""

# Compress a long scene description into a smaller, more concise prompt for an image model.
# The prompt has a very different format to a text-based model. The image model prompts are mostly comma-delimited sequences of entities.
# ie. warm, earthy, big scenery with a goose, 4d HQ, anime
PROMPT_IMAGE_PROMPT_GENERATOR = lambda x: f"""
I want you to act as a prompt generator for an image model. Firstly, I will give you text like this "Your client is standing confidently in front of a judge, wearing a shirt with the words 'my pronouns are remix/reward' written on it. They are gesturing passionately towards a document in their hand, arguing that their chosen pronouns are an expression of their unique identity and should be respected by all". Then you will give me a prompt like this: "man in front of judge, shirt, gesturing passionately to document in hand, arguing pronouns, demanding respect". Your prompt should be a concise summary of the scene, focusing on describing the subject, object and environment in terms of nouns and adjectives. The prompt must be one sentence, and must not use full stops. All entities (nouns, objects, adjectives) must be listed with commas between them. Do not use full stops. Your prompt cannot use words (slogans, words written on signs/shirts, captions, etc.) to convey the message. It is very important you find creative ways to convey information without using text or written language. Each part of the prompt must describe one thing and only one thing well. If you cannot explain in one part, then split it into two using commas. This prompt will be used to make a painting, but the prompt should be explanatory enough that a blind person hearing it will get the gist. Only reply with the prompt on a single-line, and nothing else. Do not ask questions, or refer to previous inputs.

Text is: "{x}"
"""

def chatmodel_predict_langchain(text):
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
        llm=OpenAI(temperature=0.9, model_name='text-davinci-003'), 
        prompt=prompt, 
        # verbose=True, 
        memory=ConversationalBufferWindowMemory(k=4),
    )
    print("Generating scene description...")
    print(text)
    output = chatgpt_chain.predict(human_input=text)
    print("[out] " + output)
    return output


bot = ChatGPT()

def chatmodel_predict_chatgpt(text):
    bot.new_conversation()
    print("[in] " + text)
    response = bot.ask(text)
    print("[out] " + response)
    return response

chatmodel_predict = chatmodel_predict_langchain
# chatmodel_predict = chatmodel_predict_chatgpt


def get_image_prompt(meme):
    # return "{}, 90's, film 35mm high quality, #shotonfilm, bright colour, thumbnail".format(meme)
    # return "internet meme, {}, 90's, film 35mm high quality, #shotonfilm, bright colour, thumbnail".format(meme)
    # return "{}, photorealistic, 35mm film, faint light pink undercurrents like aggressive salmon pink ff2a8d, in the style of tame impala innerspeaker".format(meme.replace('.', ''))
    return "Linotype, detailed, conceptually simple, wide angle, top-down isometric, mixed with the themes of dali and surrealism, {}, —v 3".format(meme.replace('.', ''))
    # return "scene of {}, in the style of Rococo's beauty, and style of Internet meme collage, --v 3, wide angle, 3d model from GTA V".format(meme.replace('.', ''))

def generate_image_dalle(prompt, num_images=1):
    openai.api_key = os.getenv("OPENAI_API_KEY")
    response = openai.Image.create(
        prompt=prompt,
        n=num_images,
        size="512x512",
    )

    urls = []
    for i in range(num_images):
        urls.append(response["data"][i]["url"])
        print(response["data"][i]["url"])
    return urls


def generate_image_for_take(take):
    text = take['text']

    # 1. Generate scene description.
    print("Generating scene description...")
    scene_desc = chatmodel_predict(to_enc(PROMPT_SCENE_DESCRIPTION_GENERATOR(text)))

    # 2. Generate image prompt.
    print("Generating image prompt...")
    image_prompt_subj = chatmodel_predict(to_enc(PROMPT_IMAGE_PROMPT_GENERATOR(scene_desc)))

    # 3. Generate image.
    print("Generating image...")
    image_prompt = get_image_prompt(image_prompt_subj)
    print(image_prompt)
    image_urls = generate_image_dalle(to_enc(image_prompt), num_images=4)
    image_paths = []

    # Save each of the image URL's.
    for i, image_url in enumerate(image_urls):
        # Download image, using the same Name and Extension as the URL.
        print("Downloading image...")
        # parse URL to get the filename
        filename = urllib.parse.urlparse(image_url).path.split('/')[-1]
        image_path = "results/experiment-1/images/{}_{}_{}".format(take['nft_id'], i, filename)
        urllib.request.urlretrieve(image_url, image_path)
        image_paths.append(image_path)

    # Save.
    print("Saving...")
    with open("results/experiment-1/index.md", "a") as f:
        f.write("## {}\n\n".format(text))
        f.write("### Scene description\n\n")
        f.write(scene_desc)
        f.write("\n\n")
        f.write("### Image prompt\n\n")
        f.write(image_prompt)
        f.write("\n\n")
        f.write("### Images\n\n")
        for image_path in image_paths:
            image_path = image_path.replace("results/experiment-1/", "")
            f.write("![]({})\n\n".format(image_path))
        f.write("\n\n")
    
    # open index.json and read its contents as json
    data = []
    if os.path.exists("results/experiment-1/index.json"):
        with open("results/experiment-1/index.json", "r") as f:
            data = json.load(f)

    with open("results/experiment-1/index.json", "w") as f:
        obj = {
            "take": {
                "nft_id": take['nft_id'],
                "text": text,
            },
            "scene_desc": scene_desc,
            "image_prompt": image_prompt,
            "image_paths": image_paths,
        }
        data.append(obj)
        f.write(json.dumps(data))


# open takes.json
takes_list = []
with open('../data/takes.json') as f:
    takes = json.load(f)
    i = 1
    for take in takes['results']:
        text = take['text']
        
        # Ignore empty entries.
        if text.strip() == "":
            continue
        
        # Skip entries.
        i += 1
        # if i < 30:
        #     continue
        
        try:
            generate_image_for_take(take)
        except Exception as e:
            print("Error: {}".format(e))
            continue