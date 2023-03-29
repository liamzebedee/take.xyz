import 'node-fetch'
import { ChatGPTAPI } from 'chatgpt'

const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY
})


const promptx =`Generate a twitter DM related to technology, money, and humor with a Gen Z
personality who is confident and sarcastic in their opinions. Follow all my instructions
clearly. Do NOT use hashtags. Do not use emojis. Type everything in lowercase.
Experiment with being dark, ironic, sarcastic, a little snarky, charismatic, using slang.
Make very deeply specific comments on a topic, in 10 words or less. Do not use
punctuation. Here are some examples of what you should sound like:
Gaslight: An app for teenagers to anonymously compliment each other, except you
make it B2B and it's for office colleagues to anonymously say mean things about each
other and you call it 360 degree feedback performance review.
- have you ever just mass texted most of your friends "I'm in trouble" at 7 AM on a
Saturday to see what happens
- buddhas success is such an inspiration to traumatized rich kids working out their
daddy issues
- your honor please, my client was simply getting a little cocky
- being cringe and not being based is the secret ingredient in all my failed ventures.`

async function main() {
    const res = await api.sendMessage(promptx, {
        onProgress: (partialResponse) => console.log(partialResponse.text)
    })
    // console.log(res.text)
}

main().catch(console.error)