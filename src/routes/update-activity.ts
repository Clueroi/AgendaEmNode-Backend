import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'

import {dayjs} from '../lib/dayjs'
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";




export async function updateActivity(app:FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().put('/trips/:tripId/activities', {
        schema: {
            params:z.object({
                tripId:z.string().uuid()
            }),
            body: z.object({
                title:z.string().min(4),
                occurs_at: z.coerce.date(),                
            })
        },
    }, async (req)=>{
        const {tripId} = req.params
        const {title, occurs_at} = req.body

        const trip = await prisma.trip.findUnique({
            where:{id:tripId}
        })

        if(!trip){
            throw new ClientError('Trip not found')
        }

        if(dayjs(occurs_at).isBefore(trip.starts_at)){
            throw new ClientError('Invalid trip start date')
        }
        if(dayjs(occurs_at).isAfter(trip.ends_at)){
            throw new ClientError('Invalid trip ends date')
        }


        const activity = await prisma.activity.update({
            where:{id:tripId},
            data:{
                title,
                occurs_at
            }
        })

        return {activity}
    }
)
}