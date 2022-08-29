require('dotenv').config()

const client = require('twilio')(process.env.ACCOUNT_ID,process.env.AUTH_TOKEN);
const serviceSid=process.env.TWILIO_SERVICEID

             module.exports={
                dosms:(noData)=>{
                    let res={}
                    return new Promise(async(resolve,reject)=>{
                        try {
                            await client.verify.services(serviceSid).verifications.create({
                                to :`+91${noData.phone}`,
                                channel:"sms"
                            }).then((res)=>{
                                res.valid=true;
                                resolve(res)
                              
                            })
                        } catch (error) {
                            reject(error)
                        }
                    })
                },
                otpVerify:(otpData,nuData)=>{
                    let resp={}

                   
                    return new Promise(async(resolve,reject)=>{
                       try {
                         await client.verify.services(serviceSid).verificationChecks.create({
                             to:   `+91${nuData.phone}`,
                             code:otpData.otp
                         }).then((resp)=>{
                            
                             resolve(resp)
                         })
                       } catch (error) {
                        reject(error)
                       }
                    })
                }

             }