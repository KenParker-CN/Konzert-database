declare module 'country-list' {
    interface Country {
        code: string
        name: string
    }
    export function getData(): Country[]
    export function getName(code: string): string
    export function getCode(name: string): string
    export function getNames(): string[]
    export function getCodes(): string[]
}
