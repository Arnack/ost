// Web Speech API wrapper for Russian voice input

export interface VoiceInputOptions {
  onResult: (text: string, isFinal?: boolean) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
  continuous?: boolean
  interimResults?: boolean
  restartOnEnd?: boolean
}

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionResultEventLike = {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: {
        transcript: string
      }
    }
  }
}

let recognition: SpeechRecognitionLike | null = null
let shouldKeepListening = false
let restartTimer: number | null = null

export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

export function startVoiceInput(options: VoiceInputOptions): void {
  if (!isVoiceSupported()) {
    options.onError?.('Голосовой ввод не поддерживается в этом браузере')
    return
  }

  shouldKeepListening = true

  // Stop any existing recognition
  if (recognition) {
    recognition.onend = null
    recognition.stop()
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  const createRecognition = () => {
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
        options.onResult(finalTranscript, true)
      } else if (options.interimResults && interimTranscript) {
        options.onResult(interimTranscript, false)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        return
      }

      let errorMessage = 'Ошибка распознавания речи'
      switch (event.error) {
        case 'audio-capture':
          errorMessage = 'Микрофон не найден'
          shouldKeepListening = false
          break
        case 'not-allowed':
          errorMessage = 'Доступ к микрофону запрещён'
          shouldKeepListening = false
          break
        case 'network':
          errorMessage = 'Ошибка сети'
          break
      }
      options.onError?.(errorMessage)
    }

    recognition.onend = () => {
      if (options.restartOnEnd && shouldKeepListening) {
        restartTimer = window.setTimeout(() => {
          if (!shouldKeepListening) return

          try {
            createRecognition()
            recognition?.start()
          } catch (error) {
            options.onError?.('Не удалось продолжить распознавание речи')
          }
        }, 500)
        return
      }

      options.onEnd?.()
    }
  }

  createRecognition()

  try {
    recognition?.start()
  } catch (error) {
    options.onError?.('Не удалось запустить распознавание речи')
  }
}

export function stopVoiceInput(): void {
  shouldKeepListening = false

  if (restartTimer !== null) {
    window.clearTimeout(restartTimer)
    restartTimer = null
  }

  if (recognition) {
    recognition.onend = null
    recognition.stop()
    recognition = null
  }
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionLike
    webkitSpeechRecognition: new () => SpeechRecognitionLike
  }
}
