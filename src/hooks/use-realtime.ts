import { useEffect, useRef } from 'react'
import type { RecordModel, RecordSubscription } from 'pocketbase'

import pb from '@/lib/pocketbase/client'

/**
 * Hook for real-time subscriptions to a PocketBase collection.
 * ALWAYS use this hook instead of subscribing inline.
 * Uses the per-listener UnsubscribeFunc so multiple components
 * can safely subscribe to the same collection without conflicts.
 *
 * Implements robust automatic retry and reconnection logic.
 */
export function useRealtime<TRecord extends RecordModel = RecordModel>(
  collectionName: string,
  callback: (data: RecordSubscription<TRecord>) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let unsubscribeFn: (() => Promise<void>) | undefined
    let cancelled = false

    const subscribe = async () => {
      try {
        const fn = await pb.collection<TRecord>(collectionName).subscribe('*', (e) => {
          callbackRef.current(e)
        })
        if (cancelled) {
          fn().catch(() => {})
        } else {
          unsubscribeFn = fn
        }
      } catch (err) {
        console.error(`Failed to subscribe to ${collectionName}:`, err)
        // Retry logic for failed connections
        if (!cancelled) {
          setTimeout(subscribe, 5000)
        }
      }
    }

    subscribe()

    // Handle online/offline events to re-subscribe silently
    const handleOnline = () => {
      if (!pb.realtime.isConnected && !cancelled) {
        if (unsubscribeFn) unsubscribeFn().catch(() => {})
        subscribe()
      }
    }

    window.addEventListener('online', handleOnline)

    return () => {
      cancelled = true
      window.removeEventListener('online', handleOnline)
      if (unsubscribeFn) {
        unsubscribeFn().catch(() => {})
      }
    }
  }, [collectionName, enabled])
}

export default useRealtime
