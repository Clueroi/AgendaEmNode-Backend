import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'
import nodemailer from 'nodemailer'

import {dayjs} from '../lib/dayjs'
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import { ClientError } from "../errors/client-error";



export async function createInvite(app:FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/invites', {
        schema: {
            params:z.object({
                tripId:z.string().uuid()
            }),
            body: z.object({
                email:z.string().email()
            })
        },
    }, async (req)=>{
        const {tripId} = req.params
        const {email} = req.body

        const trip = await prisma.trip.findUnique({
            where:{id:tripId}
        })

        if(!trip){
            throw new ClientError('Trip not found')
        }

        const participant = await prisma.participant.create({
            data:{
                email:email,
                trip_id:tripId,
                name:''
            }
        })

        const formatedStartDate = dayjs(trip.starts_at).format('L')
        const formatedendDate = dayjs(trip.ends_at).format('L')


        const mail = await getMailClient()

        
                const confirmationLink = `http://localhost:3333/participants/${participant.id}/confirm`

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

        return {participantId:participant.id}
    }
)
}