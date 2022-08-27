

const client = require('twilio')('AC25d5633f6d4795cb51eaed426f1d5df7','6733899334431cc115c99505fc22abb8');
const serviceSid='VA8d91bfbd37d87e679ed5f85114c01d3c'

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