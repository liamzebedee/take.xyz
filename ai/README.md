Generative AI based experiments
===============================

These are experiments with generative AI and the Take meme dataset. 

## Experiments.

### Generating images for any take.

This is a full generative AI pipeline:

 1. Input: a take.
 2. Use GPT to generate a "scene description". Transforms an abstract take into a concrete scenario.
 3. Use GPT to translate a "scene description" into an "image-generator prompt" that is suitable for DALL-E.
 4. Generate image using DALL-E.

See `images/results/index.md`.

A DALL-E image generation costs about $0.01c. 

**Usage**:

  1. Setup. 
  
    ```sh
    # Setup virutalenv
    python3 -m venv env
    source env/bin/activate
    # Install deps.
    pipenv install
    ```
  2. Register for an OpenAI account. Generate an API key. Set it `export OPENAI_API_KEY`. That's all you need to do.
  3. `cd images/ && python gen.py`


## Layout.

```sh
data/
  # contains takes.json and takes.txt, for processing
images/
  # experiments with DALL-E
text/
  # experiments with GPT
prompts/
  # R&D into different prompt structurs
```

## Resources.

 - https://docs.google.com/document/d/1WAZ7v1vi4tcBOXPCfXL0SeOUaEmGw4IhBjcrLYMDsRU/edit
 - https://docs.google.com/document/d/11WlzjBT0xRpQhP9tFMtxzd0q6ANIdHPUBkMV-YB043U/edit#
 - https://every.to/divinations/dall-e-2-and-the-origin-of-vibe-shifts
 - https://dallery.gallery/wp-content/uploads/2022/07/The-DALL%C2%B7E-2-prompt-book-v1.02.pdf 
