import { Router, Request, Response } from 'express'
import { iotEmitter } from '../modules/iot/index.js'
import type { ImpactEvent } from '../modules/iot/index.js'

export const streamRouter = Router()

/**
 * GET/stream
 * flux SSE - FrontEnd connet 
 * all impact events are sent to the client as they occur 
 * 
 * SSE Format: 
 * data : { "speedResult": {...}, "timestamp": "..." }
 */
streamRouter.get('/', (req: Request, res: Response) => {
    // handler SSE connection
    res.set('Content-Type', 'text/event-stream')
    res.set('Cache-Control', 'no-cache')
    res.set('Connection', 'keep-alive')
    res.flushHeaders() // flush the headers to establish SSE connection

    // Send ping all 15s to keep connection alive
    const heartbeat = setInterval (() => {
        res.write(': ping\n\n') // comment line is a ping in SSE
    }, 15000)

    //push event for each impact
    const onImpact = (event: ImpactEvent) => { 
        res.write(`data: ${JSON.stringify(event)}\n\n`) // send event as SSE data
    }

    iotEmitter.on('impact', onImpact)

    // Cleanup on client disconnect
    req.on('close', () => {
        clearInterval(heartbeat)
        iotEmitter.off('impact', onImpact)
    })
})