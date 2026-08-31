import OpenAI from 'openai'

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed'
        })
    }

    try {
        const { messages } = req.body

        const completion = await client.chat.completions.create({
            model: 'gpt-5-mini',
            messages: messages
        })

        const reply =
            completion.choices[0]?.message?.content ||
            'No response.'

        return res.status(200).json({
            reply
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            error: 'AI request failed.'
        })
    }
}