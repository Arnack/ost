// Web Speech API wrapper for Russian voice input

export interface VoiceInputOptions {
  onResult: (text: string) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
  continuous?: boolean
  interimResults?: boolean
}

let recognition: SpeechRecognition | null = null

export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

export function startVoiceInput(options: VoiceInputOptions): void {
  if (!isVoiceSupported()) {
    options.onError?.('Голосовой ввод не поддерживается в этом браузере')
    return
  }

  // Stop any existing recognition
  if (recognition) {
    recognition.stop()
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition = new SpeechRecognition()

  recognition.lang = 'ru-RU'
  recognition.continuous = options.continuous ?? true
  recognition.interimResults = options.interimResults ?? true

  recognition.onstart = () => {
    options.onStart?.()
  }

  recognition.onresult = (event) => {
    let finalTranscript = ''
    let interimTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript += transcript
      }
    }

    // Send final result or interim if enabled
    if (finalTranscript) {
      options.onResult(finalTranscript)
    } else if (options.interimResults && interimTranscript) {
      options.onResult(interimTranscript)
    }
  }

  recognition.onerror = (event) => {
    let errorMessage = 'Ошибка распознавания речи'
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'Речь не обнаружена'
        break
      case 'audio-capture':
        errorMessage = 'Микрофон не найден'
        break
      case 'not-allowed':
        errorMessage = 'Доступ к микрофону запрещён'
        break
      case 'network':
        errorMessage = 'Ошибка сети'
        break
    }
    options.onError?.(errorMessage)
  }

  recognition.onend = () => {
    options.onEnd?.()
  }

  try {
    recognition.start()
  } catch (error) {
    options.onError?.('Не удалось запустить распознавание речи')
  }
}

export function stopVoiceInput(): void {
  if (recognition) {
    recognition.stop()
    recognition = null
  }
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
