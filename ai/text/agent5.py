# 
# A full remake of the ChatGPT "REPL" including formatting for code blocks.
# 
import openai
import sys

import sys
from termcolor import colored
import colorama
import re
import subprocess
import select

class Formatter:
    def __init__(self) -> None:
        # write some python fr fib
        self.in_code_block = False
    
    def format(self, text):
        return self.colorize(text)

    def colorize(self, text):
        colored_text = ''
        for c in text:
            if c == '`' and not self.in_code_block:
                # Start of code block
                self.in_code_block = True
                colored_text += colored(c, 'white', 'on_black')
            elif c == '`' and self.in_code_block:
                # End of code block
                self.in_code_block = False
                colored_text += colored(c, 'white', 'on_black')
            elif self.in_code_block:
                # Inside code block
                colored_text += colored(c, 'white', 'on_black')
            else:
                # Outside code block
                colored_text += c
        
        return colored_text
    
    def reset(self):
        self.in_code_block = False


messages = []
formatter = Formatter()


def extract_code_blocks(markdown):
    code_blocks = []
    pattern = re.compile(r"```(.+?)```", re.DOTALL)
    matches = pattern.findall(markdown)
    for match in matches:
        code_blocks.append(match.strip())
    return code_blocks

session_code = """
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

"""

def eval_python(code):
    global session_code
    full_code = session_code + "\n" + code

    # Write the code to a file
    with open("data/code.py", "w") as f:
        f.write(full_code)

    process = subprocess.Popen(["python", "-u", "data/code.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    # process = subprocess.Popen(["python", "-c", code], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output, err = process.communicate()

    output = output.decode() + "\n" + err.decode()
    
    # get the process error code
    errcode = process.poll()
    
    # if it wasn't an error
    if errcode is None:
        session_code += "\n"
        session_code += code
    
    # return output_bytes
    return output, errcode



import code
import sys
from io import StringIO

# Create an InteractiveConsole instance
console = code.InteractiveConsole()

def eval_python_repl(code):
    # Redirect standard output to a StringIO object
    stdout = sys.stdout
    sys.stdout = StringIO()

    # Execute the code
    console.runsource(code)

    # Start the Python REPL
    console.interact()

    # Retrieve the output of the Python REPL
    output = sys.stdout.getvalue()

    # Restore standard output
    sys.stdout = stdout

    return output



BASE_PROMPT = open("agent5.prompt").read()

messages.append({
    "role": "assistant",
    "content": BASE_PROMPT
})

def prompt_and_print_response():
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        stream=True,
        temperature=0.3, # more deterministic
    )

    full_message_content = ''
    
    for chunk in response:
        choice = chunk['choices'][0]
        delta = choice['delta']
        if 'role' in delta: continue

        finish_reason = choice['finish_reason']

        # check if delta is not {}
        if choice['delta'] != {}:
            # write raw chars to stdout
            c = choice['delta']['content']
            sys.stdout.write(formatter.format(c))
            full_message_content += c

        if finish_reason == None:
            continue
        elif finish_reason != "stop":
            print(response)
            # prompt to continue
            continue_input = input("Continue? ")
            if continue_input.lower() in ["y", "yes"]:
                return True
            else:
                exit(0)
    print("")

    formatter.reset()
    messages.append({
        "role": "assistant",
        "content": full_message_content
    })

    code_blocks = extract_code_blocks(full_message_content)
    has_python = filter(lambda x: x.splitlines()[0] == "python", code_blocks)

    if len(code_blocks) > 0 and has_python:
        for code_block in code_blocks:
            # code_block_lang = code_block.splitlines()[0]
            # if code_block_lang != "python":
            #     # content = "Error: cannot execute code block unless language is python"
            #     # print(">> " + content)
            #     # messages.append({
            #     #     "role": "user",
            #     #     "content": content
            #     # })
            #     # prompt_and_print_response()
            #     continue
            
            # check for presence of # AI: EXECUTE THIS in first line
            # if code_block_header == "# AI: EXECUTE THIS":
            if True:
                # execute code block
                code_block = code_block.splitlines()[0:]
                if code_block[0] == "python":
                    code_block = code_block[1:]
                code_block = "\n".join(code_block)

                # prompt confirmation
                # yes = input("Execute code block? (y/n)")
                # if yes.lower() in ["y", "yes"]:
                if True:
                    # print with colored.yellow
                    print(colored("Executing code block...", "yellow"))
                    # eval and get result
                    result, err = eval_python(code_block) or "no output??"
                    # print result
                    # print(result)
                    print(colored("Done", "yellow"))
                    # add result to messages
                    content = result
                    print(">> " + content)

                    
                    if err is not None:
                        messages.append({
                            "role": "user",
                            "content": f"Output: \n\n```{result}```"
                            # "content": result
                        })
                        prompt_and_print_response()
    else:
        content = "Error: no python code blocks found"
        print(">> " + content)
        print()

        messages.append({
            "role": "user",
            "content": content
        })
        prompt_and_print_response()


import json
def msg(*args):
    return json.dumps(args)


# Print base prompt as gray
print(colored(BASE_PROMPT, "grey"))


# if False:
if True:
    # test_prompt = "USER: what is the 5th fib number"
    # test_prompt = "USER: open chrome to the rickroll vid"
    # test_prompt = "{you have the ability to use persistent memory by writing python code. I want you to show me that you can develop a personality. A personality includes a name, and unique subtle features of how you speak. You should develop your personality over our conversations by storing it in your persistent memory. That way, the personality is not lost when the session ends. Upon reboot, you should refresh your memory of who you are by reading it from disk.}"
    # test_prompt = "figure out how to get the latest ethereum block hash by asking yourself questions and using code"
    # test_prompt = "User: " + msg("speech", test_prompt)
    # test_prompt = "generate some procgen art in ascii using python"
    # test_prompt = "get the total number of followers for the twitter account @elonmusk"
    # test_prompt = "generate ascii art which is a representation of the current ethereum block hash"
    test_prompt = """
Talk to yourself to learn about your existence and limitations. You can use the `ask` function.

Notes:
- remember to print the output of your code blocks so that i can see it.

Example code:

```python
answer = ask("who am I?")
print(answer)
```
"""

    print(">> " + test_prompt)
    messages.append({ "role": "user", "content": test_prompt })
    prompt_and_print_response()

while True:
    try:
        prompt = input(">> ")
        messages.append({"role": "user", "content": prompt})
        prompt_and_print_response()
    except (KeyboardInterrupt, EOFError):
        print("\nExiting...")
        break

colorama.deinit()