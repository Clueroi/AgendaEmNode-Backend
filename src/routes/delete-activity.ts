import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'
import {dayjs} from '../lib/dayjs'
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";




export async function deleteActivity(app:FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().put('/trips/:tripId/activities', {
        schema: {
            params:z.object({
                tripId:z.string().uuid()
            })
        },
    }, async (req)=>{
        const {tripId} = req.params

        const trip = await prisma.trip.findUnique({
            where:{id:tripId}
        })

        if(!trip){
            throw new ClientError('Trip not found')
        }


        const activity = await prisma.activity.delete({
            where:{id:tripId}
        })

        return {activity}
    }
)
}