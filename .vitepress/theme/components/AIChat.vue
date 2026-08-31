<script setup lang="ts">
import { ref, nextTick } from 'vue'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const input = ref('')
const messages = ref<Message[]>([])
const loading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

async function sendMessage() {
  const text = input.value.trim()

  if (!text || loading.value) {
    return
  }

  messages.value.push({
    role: 'user',
    content: text
  })

  input.value = ''
  loading.value = true

  await nextTick()
  scrollToBottom()

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }

    messages.value.push({
      role: 'assistant',
      content: data.reply
    })

  } catch (error) {
    console.error(error)

    messages.value.push({
      role: 'assistant',
      content: 'Sorry, something went wrong.'
    })

  } finally {
    loading.value = false

    await nextTick()
    scrollToBottom()
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop =
        messagesContainer.value.scrollHeight
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="ai-chat">

    <!-- 标题 -->
    <div class="ai-header">
      <h1>Parker's AI Assistant</h1>
      <p>
        Ask questions about music, composers, works and catalogues.
      </p>
    </div>

    <!-- 消息区域 -->
    <div
        ref="messagesContainer"
        class="messages"
    >

      <!-- 初始状态 -->
      <div
          v-if="messages.length === 0"
          class="empty-state"
      >
        <div class="empty-title">
          How can I help?
        </div>

        <div class="empty-text">
          Ask about composers, works, instruments or catalogues.
        </div>
      </div>

      <!-- 消息 -->
      <div
          v-for="(message, index) in messages"
          :key="index"
          class="message"
          :class="message.role"
      >
        <div class="message-label">
          {{ message.role === 'user' ? 'You' : 'Parker\'s AI' }}
        </div>

        <div class="message-content">
          {{ message.content }}
        </div>
      </div>

      <!-- 加载状态 -->
      <div
          v-if="loading"
          class="message assistant"
      >
        <div class="message-label">
          Parker's AI
        </div>

        <div class="message-content loading">
          Thinking...
        </div>
      </div>

    </div>

    <!-- 输入区域 -->
    <div class="input-area">

      <textarea
          v-model="input"
          placeholder="Ask something..."
          rows="1"
          @keydown="handleKeydown"
      />

      <button
          :disabled="!input.trim() || loading"
          @click="sendMessage"
      >
        Send
      </button>

    </div>

    <div class="input-hint">
      Press Enter to send · Shift + Enter for a new line
    </div>

  </div>
</template>

<style scoped>
.ai-chat {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.ai-header {
  margin-bottom: 24px;
}

.ai-header h1 {
  margin-bottom: 8px;
}

.ai-header p {
  margin: 0;
  color: var(--vp-c-text-2);
}

.messages {
  min-height: 420px;
  max-height: 600px;
  overflow-y: auto;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.empty-state {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.empty-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-text {
  color: var(--vp-c-text-2);
}

.message {
  margin-bottom: 20px;
}

.message:last-child {
  margin-bottom: 0;
}

.message.user {
  text-align: right;
}

.message-label {
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.message-content {
  display: inline-block;
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user .message-content {
  background: var(--vp-c-brand-soft);
}

.loading {
  color: var(--vp-c-text-2);
}

.input-area {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.input-area textarea {
  flex: 1;
  min-height: 44px;
  max-height: 160px;
  resize: vertical;
  padding: 11px 13px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  line-height: 1.5;
}

.input-area textarea:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.input-area button {
  align-self: flex-end;
  padding: 10px 18px;
  border: 0;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: white;
  cursor: pointer;
  font: inherit;
}

.input-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-hint {
  margin-top: 8px;
  font-size: 12px;
  text-align: right;
  color: var(--vp-c-text-3);
}

@media (max-width: 640px) {
  .messages {
    min-height: 360px;
    padding: 14px;
  }

  .message-content {
    max-width: 90%;
  }

  .input-area {
    flex-direction: column;
  }

  .input-area button {
    align-self: stretch;
  }
}
</style>