import { useEffect, useRef, useState } from 'react'
import { native } from './interpret.ts'
import { errorText } from '../ui.tsx'

// On-device dictation. The live text is a preview only; the caller interprets the final text.
// A generation counter drops events from an earlier session, and a ref blocks double taps
// before React renders (both ideas come from the CBT-Quest composer).

export type VoicePhase = 'idle' | 'starting' | 'listening' | 'stopping'

export function useVoice() {
	const [phase, setPhase] = useState<VoicePhase>('idle')
	const [preview, setPreview] = useState('')
	const [level, setLevel] = useState(0)
	const [error, setError] = useState<string | null>(null)
	const current = useRef<VoicePhase>('idle')
	const revision = useRef(0)
	const generation = useRef(0)

	const move = (next: VoicePhase) => {
		current.current = next
		setPhase(next)
	}

	useEffect(() => {
		if (!native) {
			return
		}
		const transcript = native.addListener('onTranscript', event => {
			if (event.revision > revision.current) {
				revision.current = event.revision
				setPreview(event.text)
			}
		})
		const audio = native.addListener('onAudioLevel', event => setLevel(event.level))
		return () => {
			transcript.remove()
			audio.remove()
			void native?.cancelListening()
		}
	}, [])

	const start = async (locale: string, hints: string[]) => {
		if (!native || current.current !== 'idle') {
			return
		}
		const session = ++generation.current
		move('starting')
		revision.current = 0
		setPreview('')
		setError(null)
		try {
			await native.startListening(locale, hints)
			if (session === generation.current) {
				move('listening')
			}
		} catch (reason) {
			move('idle')
			setError(reason instanceof Error ? errorText(reason) : 'Cannot start listening.')
		}
	}

	/** Stops listening and returns the final text, or null when there was none. */
	const stop = async (): Promise<string | null> => {
		if (!native || current.current !== 'listening') {
			return null
		}
		const session = generation.current
		move('stopping')
		try {
			const text = (await native.stopListening()).trim()
			return session === generation.current && text !== '' ? text : null
		} catch (reason) {
			setError(reason instanceof Error ? errorText(reason) : 'Cannot finish listening.')
			return null
		} finally {
			move('idle')
			setLevel(0)
		}
	}

	return { available: native !== null, phase, preview, level, error, start, stop }
}
