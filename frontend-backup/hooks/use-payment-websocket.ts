import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'

interface PaymentWebSocketMessage {
  type: 'three_ds_request' | 'new_card_request' | 'payment_approved' | 'payment_rejected' | 'payment_update'
  deposit_id: string
  message: string
  status?: string
  amount?: string
  action?: string
}

interface UsePaymentWebSocketProps {
  onThreeDSRequest?: (depositId: string, message: string) => void
  onNewCardRequest?: (depositId: string, message: string) => void
  onPaymentApproved?: (depositId: string, message: string, amount: string) => void
  onPaymentRejected?: (depositId: string, message: string) => void
  onPaymentUpdate?: (depositId: string, action: string, message: string, status: string) => void
}

export function usePaymentWebSocket({
  onThreeDSRequest,
  onNewCardRequest,
  onPaymentApproved,
  onPaymentRejected,
  onPaymentUpdate
}: UsePaymentWebSocketProps = {}) {
  const { user } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!user) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/payments/${user.id}/`
    
    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      console.log('Payment WebSocket connected')
    }

    wsRef.current.onmessage = (event) => {
      try {
        const data: PaymentWebSocketMessage = JSON.parse(event.data)
        
        switch (data.type) {
          case 'three_ds_request':
            onThreeDSRequest?.(data.deposit_id, data.message)
            break
          case 'new_card_request':
            onNewCardRequest?.(data.deposit_id, data.message)
            break
          case 'payment_approved':
            onPaymentApproved?.(data.deposit_id, data.message, data.amount || '0')
            break
          case 'payment_rejected':
            onPaymentRejected?.(data.deposit_id, data.message)
            break
          case 'payment_update':
            onPaymentUpdate?.(data.deposit_id, data.action || '', data.message, data.status || '')
            break
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    wsRef.current.onclose = () => {
      console.log('Payment WebSocket disconnected')
              // Reconnection in 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 3000)
    }

    wsRef.current.onerror = (error) => {
      console.error('Payment WebSocket error:', error)
    }
  }, [user, onThreeDSRequest, onNewCardRequest, onPaymentApproved, onPaymentRejected, onPaymentUpdate])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    if (user) {
      connect()
    }
    
    return () => {
      disconnect()
    }
  }, [user, connect, disconnect])

  return { disconnect }
}

