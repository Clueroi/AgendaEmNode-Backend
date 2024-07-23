import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'
import { prisma } from "../lib/prisma";
import nodemailer from 'nodemailer'

import { env } from "../env";
import {dayjs} from '../lib/dayjs'
import { getMailClient } from "../lib/mail";
import { ClientError } from "../errors/client-error";



export async function confirmTrip(app:FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
        schema: {
            params: z.object({
                tripId:z.string().uuid(),
            })
        },
    }, async (req, reply)=>{
        const {tripId } = req.params

        const trip = await prisma.trip.findUnique({
            where:{
                id:tripId,
            },
            include:{
                participants:{
                    where:{
                        is_owner:false,
                    }
                }
            }
        })

        if(!trip){
            throw new ClientError ('Trip not found')
        }
        if(trip.confirmed){
            return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
        }

        await prisma.trip.update({
            where:{id:tripId},
            data:{confirmed:true}
        })

        const formatedStartDate = dayjs(trip.starts_at).format('L')
        const formatedendDate = dayjs(trip.ends_at).format('L')


        const mail = await getMailClient()

        
        await Promise.all(
            trip.participants.map(async (participant)=>{
                const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`

                const message = await mail.sendMail({
                    from:{
                        name: 'Equipe Plan.er',
                        address:"eriicsouzaromeroo@gmail.com"
                    }, 
                    to: participant.email,
                    subject:`Confirmação de viagem para ${trip.destination} em ${formatedStartDate}`,
                    html:`
                        <div>
                            <p>Você foi convidado(a) para participar de uma viagem para ${trip.destination} nas datas de ${formatedStartDate} até ${formatedendDate}</p>
                            <p>Para confirmar a viagem clique abaixo</p>
                                <a href"${confirmationLink}"> Confirmar viagem <a/>
        
                            <p>Caso não saiba do que se trata, apenas ignore este e-mail</p>
                        </div>
                    `.trim()
                })
        
                console.log(nodemailer.getTestMessageUrl(message))
            })
        )

        return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
    }
)
}