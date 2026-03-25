'use client'

import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOfflineSync } from '@/lib/hooks/useOfflineSync'
import { setOfflineSyncActivity } from '@/lib/offline/network'
import { processOfflineSyncQueue } from '@/lib/offline/sync'

const HAS_SUPABASE_ENV =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export function OfflineSyncBootstrap() {
  const queryClient = useQueryClient()
  const { isOnline } = useOfflineSync()
  const supabase = useMemo(() => (HAS_SUPABASE_ENV ? createClient() : null), [])

  useEffect(() => {
    if (!isOnline || !supabase) return

    void (async () => {
      setOfflineSyncActivity({
        isSyncing: true,
        lastStartedAt: new Date().toISOString(),
      })

      try {
        await processOfflineSyncQueue(supabase, queryClient)
      } finally {
        setOfflineSyncActivity({
          isSyncing: false,
          lastFinishedAt: new Date().toISOString(),
        })
      }
    })()
  }, [isOnline, queryClient, supabase])

  return null
}
