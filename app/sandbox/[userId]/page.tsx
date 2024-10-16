'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SQLSandbox from '@/components/SQLSandbox'

export default function SandboxPage({ params }: { params: { userId: string } }) {
  const router = useRouter()

  useEffect(() => {
    localStorage.setItem('sqlSandboxUserId', params.userId)
  }, [params.userId])

  return <SQLSandbox />
}