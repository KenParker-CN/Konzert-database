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
  color: var(--md-on-surface-variant);
}

.messages {
  min-height: 420px;
  max-height: 600px;
  overflow-y: auto;
  padding: 20px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-lg);
  background: var(--md-surface-container);
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
  color: var(--md-on-surface-variant);
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
  color: var(--md-on-surface-variant);
}

.message-content {
  display: inline-block;
  max-width: 80%;
  padding: 10px 14px;
  border-radius: var(--md-radius-md);
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user .message-content {
  background: var(--md-secondary-container);
  border-color: transparent;
  color: var(--md-on-secondary-container);
}

.loading {
  color: var(--md-on-surface-variant);
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
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-sm);
  background: var(--md-surface);
  color: var(--md-on-surface);
  font: inherit;
  line-height: 1.5;
}

.input-area textarea:focus {
  outline: none;
  border-color: var(--md-primary);
  box-shadow: 0 0 0 1px var(--md-primary);
}

.input-area button {
  align-self: flex-end;
  padding: 10px 18px;
  border: 0;
  border-radius: var(--md-radius-full);
  background: var(--md-primary);
  color: var(--md-on-primary);
  cursor: pointer;
  font: inherit;
  transition: background var(--md-duration-fast) var(--md-ease), box-shadow var(--md-duration-fast) var(--md-ease);
}

.input-area button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--md-primary) 88%, var(--md-on-primary));
  box-shadow: var(--md-shadow-1);
}

.input-area button:active:not(:disabled) {
  background: color-mix(in srgb, var(--md-primary) 78%, var(--md-on-primary));
}

.input-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-hint {
  margin-top: 8px;
  font-size: 12px;
  text-align: right;
  color: var(--md-outline);
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