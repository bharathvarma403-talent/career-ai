import { useEffect, useState, useRef } from 'react'
import {
  Send,
  Plus,
  AlertCircle,
  Loader2,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Bot
} from 'lucide-react'

interface ChatMessage {
  id?: number | string
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface ConversationItem {
  id: number
  title: string
  created_at: string
}

const GUIDED_STARTERS = [
  'How can I improve my resume bullets?',
  'What skills should I learn for an AI Engineer track?',
  'Help me rewrite a bullet point with metrics.',
  'What system design questions come up in interviews?'
]

export default function Chatbot() {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const token = localStorage.getItem('token')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, sending])

  useEffect(() => {
    async function initChat() {
      if (!token) return
      setLoading(true)

      try {
        const res = await fetch('/api/chat/conversations', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (res.ok) {
          const list = await res.json()
          setConversations(list)

          if (list.length > 0) {
            setActiveConversationId(list[0].id)
            loadMessages(list[0].id)
          } else {
            createNewConversation()
          }
        } else {
          createNewConversation()
        }
      } catch (err) {
        console.error('Failed to initialize conversation:', err)
        createNewConversation()
      } finally {
        setLoading(false)
      }
    }

    initChat()
  }, [token])

  const createNewConversation = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: 'Career Chat' })
      })

      if (res.ok) {
        const newConv = await res.json()
        setConversations((prev) => [newConv, ...prev])
        setActiveConversationId(newConv.id)
        setMessages([
          {
            role: 'assistant',
            content:
              "Hi! I can help you improve your resume, analyze skill gaps, or prepare for technical interviews. What would you like to work on?"
          }
        ])
      }
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  const loadMessages = async (convId: number) => {
    if (!token) return
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        const msgs = await res.json()
        if (msgs.length === 0) {
          setMessages([
            {
              role: 'assistant',
              content:
                "Ask a question about your resume, career path, or interview prep."
            }
          ])
        } else {
          setMessages(msgs)
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || sending || !activeConversationId || !token) return

    setInputMessage('')
    setError(null)

    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setSending(true)

    try {
      const res = await fetch(`/api/chat/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: text })
      })

      if (!res.ok) {
        throw new Error('Failed to get response.')
      }

      const data = await res.json()
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response || data.content || 'I have analyzed your request.'
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      setError(err.message || 'Unable to communicate with chat service.')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Unable to reach the assistant. Please try again."
        }
      ])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessageContent = (content: string) => {
    const lines = content.split('\n')
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim()
          if (!trimmed) return <div key={idx} className="h-1" />

          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const bulletText = trimmed.replace(/^[\*\-•]\s*/, '')
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-zinc-500 mt-1 shrink-0">•</span>
                <span>{renderStyledText(bulletText)}</span>
              </div>
            )
          }

          if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^(\d+\.)\s/)?.[1]
            const text = trimmed.replace(/^\d+\.\s/, '')
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-zinc-400 font-mono font-semibold shrink-0">{num}</span>
                <span>{renderStyledText(text)}</span>
              </div>
            )
          }

          return <p key={idx}>{renderStyledText(line)}</p>
        })}
      </div>
    )
  }

  const renderStyledText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-70px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#202227] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded bg-[#121316] border border-[#22242A] text-zinc-400"
            title="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#181A1F] border border-[#272A31] flex items-center justify-center font-mono text-zinc-300 text-xs">
              C/
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Career Chat</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </h1>
              <p className="text-[11px] text-zinc-400">
                Ask about resume feedback, skill roadmap, or interview questions
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={createNewConversation}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#141519] hover:bg-[#1A1C22] border border-[#262830] text-zinc-200 transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Main Chat Body */}
      <div className="flex-1 flex gap-5 overflow-hidden pt-4">
        {/* Left Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'flex' : 'hidden'
          } md:flex flex-col w-72 lg:w-80 shrink-0 surface-panel p-4 overflow-y-auto space-y-5`}
        >
          {/* Guided Starters */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase text-zinc-400">
              Suggested Prompts
            </div>
            <div className="space-y-1.5">
              {GUIDED_STARTERS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-2 rounded bg-[#0E0F12] hover:bg-[#14161C] border border-[#202227] hover:border-[#2C2F38] text-xs text-zinc-300 hover:text-white transition flex items-start gap-2"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Past Chats */}
          {conversations.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-[#1E2026]">
              <div className="text-[11px] font-mono uppercase text-zinc-400">
                Past Chats
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveConversationId(c.id)
                      loadMessages(c.id)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs truncate transition ${
                      activeConversationId === c.id
                        ? 'bg-[#181A1F] text-white font-medium border border-[#282B33]'
                        : 'text-zinc-400 hover:text-white hover:bg-[#101216]'
                    }`}
                  >
                    {c.title || `Chat #${c.id}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Chat Stream */}
        <div className="flex-1 flex flex-col surface-panel overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {loading && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs py-12">
                <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                <span>Loading chat...</span>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isAssistant = msg.role === 'assistant'
                return (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-3xl ${
                      isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                        isAssistant
                          ? 'bg-[#181A1F] border border-[#272A31] text-zinc-300'
                          : 'bg-zinc-800 border border-zinc-700 text-white'
                      }`}
                    >
                      {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`p-3.5 sm:p-4 rounded-lg border text-xs sm:text-sm ${
                        isAssistant
                          ? 'bg-[#0E0F12] border-[#202227] text-zinc-200'
                          : 'bg-[#16181E] border-[#282B33] text-white'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1">
                        {isAssistant ? 'Assistant' : 'You'}
                      </div>
                      {formatMessageContent(msg.content)}
                    </div>
                  </div>
                )
              })
            )}

            {sending && (
              <div className="flex gap-3 max-w-xl mr-auto">
                <div className="w-6 h-6 rounded bg-[#181A1F] border border-[#272A31] text-zinc-300 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-lg bg-[#0E0F12] border border-[#202227] flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-[#0E0F12] border-t border-[#202227] shrink-0">
            {error && (
              <div className="mb-2 text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <textarea
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about resume rewrites, skills, or interview prep..."
                className="flex-1 px-3 py-2 rounded-md bg-[#121316] border border-[#22242A] text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition resize-none max-h-32"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || sending}
                className="p-2.5 rounded-md font-medium text-zinc-950 bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 pl-1 hidden sm:block">
              Press Enter to send, Shift+Enter for newline.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
