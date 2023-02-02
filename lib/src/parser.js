/**
 * Take parsing
 */

export const parseTake = (str) => {
    // Parsing state.
    let i = 0
    let tokens = []
    let token = null

    const begin_var_parse = (j) => {
        token = {
            type: 'var',
            start: j,
            end: -1,
        }
    }

    const begin_string_parse = (j) => {
        token = {
            type: 'string',
            start: j,
            end: -1,
        }
    }

    const begin_takelink_parse = (j) => {
        token = {
            type: 'takelink',
            start: j,
            end: -1,
        }
    }

    const push_token = (j) => {
        if (j == -1) return
        if (token == null) return

        token.end = j
        tokens.push(token)
        token = null
    }

    // cond is from Lisp, the most beautiful proglang.
    const cond = (conds) => {
        for (let cond of conds) {
            const [predicate, body] = cond
            if (predicate) {
                const fallback = body()
                if (!fallback) break
            }
        }
    }

    const peek = (i, j) => {
        return str.substring(i, i + j)
    }

    while (i < str.length) {
        const c = str[i]

        cond([
            [c == '[', () => {
                push_token(i - 1)
                begin_var_parse(i)
            }],
            [c == ']', () => {
                push_token(i)
            }],
            [c == 't', () => {
                // match take#222
                if(peek(i, 5) == 'take#') {
                    // if(token.type == 'string') {  }
                    // TODO handle a take inside a variable - ie. [take#366]
                    push_token(i - 1)
                    
                    begin_takelink_parse(i)
                    // match until next space then skip ahead
                    while (i < str.length && str[i] != ' ') {
                        i++
                    }
                    push_token(i - 1)
                } else {
                    return true // fallback
                }
            }],
            [true, () => {
                if (token == null) begin_string_parse(i)
            }]
        ])

        i++

        // If we're at the end of the string, push the last token.
        if ((i + 1) == str.length) {
            push_token(i)
        }
    }

    return addContextToTokens(str, tokens)
}

export const addContextToTokens = (str, tokens) => {
    return tokens.map(token => {
        const { start, end } = token

        // String.
        const context = {
            string: str.substring(start, end + 1)
        }

        // Variable.
        const variableContext = {
            variableName: null
        }
        if (token.type == 'var') {
            variableContext.variableName = context.string.substring(1, context.string.length - 1)
        }

        // Takelink.
        const takelinkContext = {
            takeId: null
        }
        if (token.type == 'takelink') {
            takelinkContext.takeId = context.string.split('#').pop()
        }
        
        return {
            ...token,
            ...context,
            ...variableContext,
            ...takelinkContext
        }
    })
}

// Interpolates the variables, contained in square brackets,
// ie. [xx] or [what I desire] with their respective input values.
// If the variable is not set, it is left as the placeholder - ie. [xx] or [what I desire].
export const compileTake = (takeText, variables) => {
    const tokens = parseTake(takeText)

    const take = tokens.map(token => {
        if (token.type == 'var') {
            const value = variables[token.variableName] || token.string
            return value
        } else {
            return token.string
        }
    }).join('')

    return take
}

export const canRemixTake = (takeText) => {
    const tokens = parseTake(takeText)
    console.log('tokens', tokens)
    const canRemix = tokens.some(token => {
        if (token.type == 'var') {
            return true
        }
    })

    return canRemix
}