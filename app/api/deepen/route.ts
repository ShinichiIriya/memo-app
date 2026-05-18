import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  const { keyword } = await request.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `以下のキーワードについて日本語で答えてください。キーワード：「${keyword}」\n\n必ずJSON形式のみで返してください。説明文や\`\`\`は不要です。\n\n{"summary":"概要を2〜3文で","examples":["事例1","事例2","事例3"],"links":["参考1","参考2"],"tags":["タグ1","タグ2","タグ3"]}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}')
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ 
      summary: text, 
      examples: [], 
      links: [], 
      tags: [] 
    })
  }
}