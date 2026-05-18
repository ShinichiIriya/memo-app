import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  const { keyword, mode, existing } = await request.json()

  const prompt = mode === 'more'
    ? `以下のキーワードについて、すでにある情報とは異なる新しい観点で深掘りしてください。

キーワード：「${keyword}」
すでにある情報：${existing}

重要：上記の「すでにある情報」と重複しない、全く新しい内容を生成してください。
以下の観点から1つ以上選んで深掘りしてください：
- 歴史的背景・時代的文脈
- 関連する人物・組織
- 批判的な見方・課題
- 最新の動向・トレンド
- 日本での事例・受容

必ずJSON形式のみで返してください。

{"summary":"新しい観点での深掘り内容を3〜5文で","examples":["新しい事例1","新しい事例2","新しい事例3"],"links":["参考1","参考2"],"tags":["タグ1","タグ2","タグ3"]}`
    : `以下のキーワードについて日本語で答えてください。キーワード：「${keyword}」\n\n必ずJSON形式のみで返してください。説明文や\`\`\`は不要です。\n\n{"summary":"概要を2〜3文で","examples":["事例1","事例2","事例3"],"links":["参考1","参考2"],"tags":["タグ1","タグ2","タグ3"]}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
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
      tags: [],
    })
  }
}