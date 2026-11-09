import uiGradients from '@/data/ui-gradients.json'

export type UiGradient = typeof uiGradients[number]

export function getRandomGradients(count: number): UiGradient[] {
    const shuffled = [...uiGradients]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        const gradient = shuffled[index]
        shuffled[index] = shuffled[randomIndex]
        shuffled[randomIndex] = gradient
    }

    return Array.from({length: count}, (_, index) => shuffled[index % shuffled.length])
}
