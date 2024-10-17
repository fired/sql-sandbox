'use client'

import { useEffect } from 'react'
import SQLSandbox from '@/components/SQLSandbox'

export default function SandboxPage({ params }: { params: { userId: string } }) {
  useEffect(() => {
    localStorage.setItem('sqlSandboxUserId', params.userId)
  }, [params.userId])

  return <SQLSandbox />
}