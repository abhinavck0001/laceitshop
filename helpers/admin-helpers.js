const db = require("../config/connection");
const collection = require("../config/collection");
const objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
const { response } = require("../app");







module.exports={

getUserDtls :() => {
    return new Promise(async (resolve, reject) => {
     try {
       const users = await db.get().collection(collection.USER_COLLECTION).find().toArray();
       resolve(users);
     } catch (error) {
      reject(error)
     }
    });
  },

deleteUser : (usrId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: objectId(usrId) }).then(() => {
            resolve();
          });
      } catch (error) {
        reject(error)
      }
    });
  },

changeStatus :(proId, data) => {

    return new Promise((resolve, reject) => {
      
     try {
       db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(proId) },
         {
           $set: {
             status: data
           }
         }).then((response) => {
           resolve(response);
         });
     } catch (error) {
      reject(error)
     }
    });
  },

  editUser : (usrId) => {
    return new Promise((resolve, reject) => {
    try {
        db.get().collection(collection.USER_COLLECTION).findOne({_id: objectId(usrId)}).then((data) => {
            resolve(data);
          });
    } catch (error) {
      reject(error)
    }
    });
  },
  
  
  blockUsers : (usrId) => {
    return new Promise((resolve, reject) => {
    try {
        db.get().collection(collection.USER_COLLECTION).updateOne({ _id:objectId(usrId)},
        {
          $set:{
            blockUsers:true
          }
        }).then(() => {
            resolve();
          });
    } catch (error) {
      reject(error)
    }
    });
  },
  
  
  unBlockUsers : (usrId) => {
    return new Promise((resolve, reject) => {
     try {
       db.get().collection(collection.USER_COLLECTION).updateOne({ _id:objectId(usrId)},
       {
         $set:{
           blockUsers:false
         }
       }).then(() => {
           resolve();
         });
     } catch (error) {
      reject(error)
     }
    });
  },
  
  
  
  
  getcoupons:()=>{
  
    return new Promise (async(resolve,reject)=>{
      try {
        let coupons= await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
        resolve (coupons)
    
      } catch (error) {
        reject(error)
      }
    })
  },
  
  generateCoupon:(couponData)=>{
  
    const oneDay= 1000*60*60*24
  
    let couponObj={
      name: couponData.name.toUpperCase(),
      offer: parseFloat(couponData.offer),
      priceRange:couponData.priceRange,
      validity: new Date(new Date().getTime()+(oneDay*parseInt(couponData.validity)))
    }
  
    return new Promise ((resolve,reject)=>{
  
      try {
        db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((result)=>{
          if (result[0]==null){
            db.get().collection(collection.COUPON_COLLECTION).createIndex({"name":1},{unique:true})
            db.get().collection(collection.COUPON_COLLECTION).createIndex({"validity":1},{expireAfterSeconds:0})
            db.get().collection(collection.COUPON_COLLECTION).insertOne(couponObj).then((response)=>{
              resolve(response)
            })
          }else{
            db.get().collection(collection.COUPON_COLLECTION).insertOne(couponObj).then((response)=>{
              resolve(response)
            })
          }
    
        })
      } catch (error) {
        reject(error)
      }
  
    })
  },
  

  deleteCoupon:(couponId)=>{
    return new Promise (async(resolve,reject)=>{
      try {
         db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(couponId)}).then((response)=>{
    
               resolve()
         })
      } catch (error) {
        reject(error)
      }
  
    })
  },


onlinePaymentCount: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).find({ 
          PaymentMethod: "ONLINE" }).count()
        resolve(count)
       

      } catch (err) {
        reject(err)
      }

    })
  },


  totalUsers: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.USER_COLLECTION).find().count()
        resolve(count)
       
      } catch (err) {
        reject(err)
      }
    })
  },


totalOrder: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).find().count()
        resolve(count)
        
      } catch (err) {
        reject(err)
      }
    })
  },

cancelOrder: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {
              status: "canceled"
            }
          },

         {
            $count: 'number'
          }

        ]).toArray()
        resolve(count)
      
      } catch (err) {
        reject(err)
      }

    })
  },


totalCOD: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).find({ PaymentMethod: "COD", }).count()
        resolve(count)
       
      } catch (err) {
        reject(err)
      }
    })
  },

totalDeliveryStatus: (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        let statusCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {
            status: data
            }
          },

          {
            $count: 'number'
          }

        ]).toArray()
        resolve(statusCount)
       
      } catch (err) {
        reject(err)
      }
    })
  },


totalCost: () => {
    return new Promise(async (resolve, reject) => {
      try {
        total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
         
          {
            $project: {
              'total_amount': 1
            }
          },
          {
            $group: {
              _id: null,
              sum: { $sum: '$total_amount' }
            }
          }
        ]).toArray()
        resolve(total)
        
      } catch (err) {
        reject(err)
      }
    })
  },


  addBanner:(banner,images)=>{
    return new Promise((resolve,reject)=>{
     try {
       db.get().collection(collection.BANNER_COLLECTION).insertOne({
           banner:banner.banner,
           deleted:false,
          
           images 
                  
       }).then((data)=>{
         resolve(data.insertedId)
       })
     } catch (error) {
      reject(error)
     }
    })
  },

  viewBanner:(()=>{

    return new Promise(async(resolve,reject)=>{
         try {
          let banner= await db.get().collection(collection.BANNER_COLLECTION).find({deleted:false}).toArray()
            resolve(banner)
         } catch (error) {
          reject(error)
         }
               
    })
    
    }),

    deleteBanner:(BId) => {
      return new Promise((resolve, reject) => {
       try {
        
         db.get().collection(collection.BANNER_COLLECTION).updateOne({ _id:objectId(BId)},
         {
           $set:{
             deleted:true
           }
         }).then((response) => {
          
             resolve(response);
           });
       } catch (error) {
        reject(error)
       }
      });
    },


    deleteMessage:(mId) => {
      return new Promise((resolve, reject) => {
       try {
        
         db.get().collection(collection.MESSAGE_COLLECTION).updateOne({ _id:objectId(mId)},
         {
           $set:{
             deleted:true
           }
         }).then((response) => {
          
             resolve(response);
           });
       } catch (error) {
        reject(error)
       }
      });
    },

    addMessage:(message)=>{
      return new Promise((resolve,reject)=>{
       try {
         db.get().collection(collection.MESSAGE_COLLECTION).insertOne({
            


          message1:message.message1,
          message2:message.message2,
          message3:message.message3,
             deleted:false,
                    
         }).then((data)=>{
           resolve(data.insertedId)
         })
       } catch (error) {
        reject(error)
       }
      })
    },

    viewMessage:(()=>{

      return new Promise(async(resolve,reject)=>{
           try {
            let message= await db.get().collection(collection.MESSAGE_COLLECTION).find({deleted:false}).toArray()
              resolve(message)
           } catch (error) {
            reject(error)
           }
                 
      })
      
      }),

    

}