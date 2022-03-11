import type { RawData } from 'ws'

function parseMessage(buffer: RawData): TuiWSMessage | null {
  let data: TuiWSMessage | null | undefined
  try {
    data = JSON.parse(buffer.toString())
  } catch (error) {
    console.error('Malformed message from server:', buffer.toString())
    return null
  }

  if (!data?.type || !data?.payload) {
    console.error('Ignoring message from server:', data)
    return null
  }

  return data
}

// Convenience types for parsing messages

export function parseClientMessage(buffer: RawData): TuiWSMessageClient | null {
  return parseMessage(buffer) as TuiWSMessageClient
}

export function parseServerMessage(buffer: RawData): TuiWSMessageServer | null {
  return parseMessage(buffer) as TuiWSMessageServer
}

export interface TuiWSMessage_Base {
  type: string
  payload: any
}

export interface TuiWsMessage_Crash {
  type: 'crash'
  payload: Error
}

export interface TuiWsMessage_Restart {
  type: 'restart'
  payload: null
}

/**
 * A message coming from the server.
 */
export type TuiWSMessageClient = TuiWsMessage_Crash

/**
 * A message coming from the client.
 */
export type TuiWSMessageServer = TuiWsMessage_Restart

/**
 * A message coming from the server or the client. Used for types mostly
 */
export type TuiWSMessage = TuiWSMessageServer | TuiWSMessageClient

/**
 * Define a message to be sent over a WebSocket connection.
 *
 * @param message - message object
 * @returns a JSON version of the message ready to send
 */
export function defineMessage<T extends TuiWSMessage>(message: T): string {
  return JSON.stringify(message)
}
