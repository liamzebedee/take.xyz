import json

# open takes.json
takes_list = []
takes_str = ""
with open('takes.json') as f:
    takes = json.load(f)
    for i in range(50,300):
        # check if take contains [xx] [yy] or [zz]
        if "[xx]" in takes['results'][i]['text'] or "[yy]" in takes['results'][i]['text'] or "[zz]" in takes['results'][i]['text']:
            continue
        # ignore takes containing ETH or btc
        if "ETH" in takes['results'][i]['text'] or "btc" in takes['results'][i]['text']:
            continue
        # ignore takes less than 2 chars
        if len(takes['results'][i]['text']) < 2:
            continue
        takes_str += " - " + takes['results'][i]['text'] + "\n"
        # takes_list.append()

print(takes_str)