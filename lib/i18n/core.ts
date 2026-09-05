export type Messages = {
    [key: string]: string | Messages
}

export type TranslateValues = Record<string, string | number>

export type Translator = (key: string, values?: TranslateValues) => string

function lookup(messages: Messages, key: string): string | undefined {
    let node: string | Messages | undefined = messages
    for (const part of key.split('.')) {
        if (typeof node !== 'object' || node === null) return undefined
        node = node[part]
    }
    return typeof node === 'string' ? node : undefined
}

/**
 * Create a `t(key, values?)` translator from a message dictionary.
 * Supports dot-notation keys (`t('works.title')`) and `{name}` interpolation.
 * Returns the key itself when a translation is missing, so the UI never crashes.
 */
export function makeTranslator(messages: Messages): Translator {
    return (key, values) => {
        const template = lookup(messages, key)
        if (template === undefined) return key
        if (!values) return template

        let result = template
        for (const [name, value] of Object.entries(values)) {
            result = result.replaceAll(`{${name}}`, String(value))
        }
        return result
    }
}