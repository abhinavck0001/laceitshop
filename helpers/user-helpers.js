var db=require('../config/connection')
var collection=require('../config/collection')
const objectId = require('mongodb').ObjectId 
const bcrypt=require('bcrypt')
const { response, use } = require('../app')
const { parse } = require('uuid')
const { v4 : uuidv4 } = require('uuid')
const Razorpay=require('razorpay');
const { Collection } = require('mongodb')
const { log } = require('console')

var instance = new Razorpay({
    key_id: 'rzp_test_TiZxuptYCWYf15',
    key_secret: '9AOj5oJg5JSub1dSOon1cFxr',
  });



module.exports={


doSignup:(userData)=>{

    const userInfo={}

  
        return new Promise(async(resolve, reject) => {
            userData.password=await bcrypt.hash(userData.password,10) 
            db.get().collection(collection.USER_COLLECTION).insertOne({
                
                
                username:userData.username,
                
                email:userData.email,
                
                password:userData.password,

                phone:userData.phone,
               
                "blockUsers":false


                
            }).then((data)=>{

                if(data){
                    userInfo.isUserValid=true;
                    userInfo.user=userData
                    resolve(userInfo)
                }else{
                    userInfo.isUserValid=false
                    resolve(userInfo)
                }


               
                resolve(data)

            }).catch((err)=>{
                reject(err)
            })
        })
        
         

},


doLogin:(userData)=>{
        return new Promise(async(resolve, reject) => {
           try {
             let loginStatus=false
             let response={}
             let user= await db.get().collection(collection.USER_COLLECTION ).findOne({username: userData.username,blockUsers:false})
             if(user){
                 bcrypt.compare(userData.password,user.password).then((status)=>{
                     if(status){
                        
                         response.user=user
                         response.status=true
                         resolve(response)
                     }else{
                         
                         resolve({status:false})
                     }
                 })
             }else{
               
                 resolve({status:false})
             }
           } catch (error) {
            reject(error)
           }
        })
},


addtoCart:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve, reject) => {
           try {
             let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
             if(userCart){
                 let proExist=userCart.products.findIndex(product=> product.item==proId)
                 console.log(proExist);
                 if(proExist!=-1){
                     db.get().collection(collection.CART_COLLECTION)
                     .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                     {
                         $inc:{'products.$.quantity':1}
                     }
                     ).then(()=>{
                         resolve()
                     })
                 }else{
                  db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                  {
                     $push:{products:proObj}
                  }
                  
                  ).then((response)=>{
                     resolve()
                  })
                 }
 
             }else{
                 let cartObj={
                     user:objectId(userId),
                     products:[proObj]
                 }
                 db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                     resolve()
 
                 })
             }
           } catch (error) {
            reject(error)
           }
        })
},


getcartProducts:(userId)=>{
        return new Promise(async(resolve, reject) => {
        try {
              let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
    
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
    
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $addFields:{
                        sum:{$multiply:['$quantity','$product.price']}
    
                    }
                }
               
              ]).toArray()
              resolve(cartItems) 
                
        } catch (error) {
            reject(error)
        }   
        }


)},
    
    
getCartcount:(userId)=>{

        
        return new Promise(async(resolve,reject)=>{
      try {
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
              count=cart.products.length
      
            }
            resolve(count)
      } catch (error) {
        reject(error)
      }

        })
},



changeProductQuantity:(details)=>{
    
    details.count=parseInt(details.count)
    details.quantity=parseInt(details.quantity)

    return new Promise((resolve, reject) => {
     try {
           if(details.count==-1 && details.quantity==1){
           db.get().collection(collection.CART_COLLECTION)
           .updateOne({_id:objectId(details.cart)},
           {
               $pull:{products:{item:objectId(details.product)}}
           }
           ).then((response)=>{
               resolve({removeProduct:true})
           }) 
       }else{
           db.get().collection(collection.CART_COLLECTION)
           .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
           {
               $inc:{'products.$.quantity':details.count}
           }
           ).then((response)=>{
               resolve({status:true})
           })
       }
     } catch (error) {
        reject(error)
     } 
    })
},


removeProductFromCart: (details) => {
   
    let productId = details.productId
    let cartId = details.cartId
    return new Promise((resolve, reject) => {
       try {
         db.get().collection(collection.CART_COLLECTION).updateOne({ _id:objectId(cartId) },
             {
                 $pull: { products: { item:objectId(productId) } }
             }
         ).then((response) => {
             resolve({ productRemoved: true })
         })
       } catch (error) {
        reject(error)
       }
    })

},


getTotalAmount:(userId)=>{
        
    return new Promise(async(resolve, reject) => {
   try {
         let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
           {
               $match:{user:objectId(userId)} 
           },
           {
               $unwind:'$products'
           },
           {
               $project:{
                   item:'$products.item',
                   quantity:'$products.quantity'
               }
           },
           {
               $lookup:{
                   from:collection.PRODUCT_COLLECTION,
                   localField:'item',
                   foreignField:'_id',
                   as:'product'
               }
 
           },
           {
               $project:{
                   item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
               }
           },
           {
             $group:{
                 _id:null,
                 total:{$sum:{$multiply:['$quantity','$product.price']}}
             }
           }
           
         ]).toArray()
         if(total.length==0){
             resolve(total)
         }else{
         resolve(total[0].total) 
     } 
   } catch (error) {
    reject(error)
   }
      }
  )

},



placeOrder:(order,products,total,discountData)=>{

  
  
    return new Promise((resolve,reject)=>{
        try {
            let status=order['Pay_Method']==='COD'?'placed':'pending'
            let netAmount = discountData ? discountData.amount : total;
            let discount = discountData ? discountData.discount : null;
            
            let orderObj={
                deliveryDetails:{
                    First_Name:order.First_Name,
                    Last_Name:order.Last_Name,
                    Company_Name:order.Company_Name,
                    Street_Address:order.Street_Address,
                    Extra_Details:order.Extra_Details,
                    Town_City:order.Town_City,
                    Country_State:order.Country_State,
                    Post_Code:order.Post_Code,
                    Phone: order.Phone,
                    Alt_Phone:order.Alt_Phone,
                    Coupon_Code:order.Coupon_Code,
                    usdToInr:order.usdToInr,
                   
                },
                userId:(objectId(order.userId)),         
                PaymentMethod:order['Pay_Method'],
                products:products,
                totalAmount:total,
                status:status,
                total_amount:netAmount,
                discountData:discount,
                date:new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                resolve(response.insertedId)
            })
    
        } catch (error) {
            reject(error)
        }

    })

},



getCartproductLIst:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       try {
         let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
         resolve(cart.products)
 
       } catch (error) {
        reject(error)
       }
    })
},

getUserOrders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       try {
         let orders= await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
        
         resolve(orders)
       } catch (error) {
        reject(error)
       }

    })
},

getOrderProducts:(orderId)=>{
    return new Promise(async(resolve, reject) => {
     try {
         let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
           {
               $match:{_id:objectId(orderId)}
           },
           {
               $unwind:'$products'
           },
           {
               $project:{
                   item:'$products.item',
                   quantity:'$products.quantity'
               }
   
           },
           {
               $lookup:{
                   from:collection.PRODUCT_COLLECTION,
                   localField:'item',
                   foreignField:'_id',
                   as:'product'
               }
   
           },
           {
               $project:{
                   item:1,
                   quantity:1,
                   product:{$arrayElemAt:['$product',0]}
               }
           }
          
         ]).toArray()
         resolve(orderItems) 
              
     } catch (error) {
        reject(error)
     }
    }


)},


generateRazorpay:(orderId,total)=>{

    return new Promise((resolve, reject) => {
      try {
          var options={
              amount:total*100,
              currency:'INR',
              receipt:""+orderId
          };
          instance.orders.create(options,function(err,order){
          if(err){
              console.log(err);
          }else{
       
         resolve(order)
          }
  
          });
      } catch (error) {
        reject(error)
      }
    })
},

verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', '9AOj5oJg5JSub1dSOon1cFxr');

        hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
        hmac = hmac.digest('hex')
        if (hmac == details['payment[razorpay_signature]']) {
            resolve()
        } else {
            reject()
        }

    })
},


changePaymentStatus:(orderId)=>{
    return new Promise((resolve, reject) => {
        try {
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve()
            })
        } catch (error) {
            reject(error)
        }
    })
},


cancelOrder:(proId) => {

    return new Promise((resolve, reject) => {
      try {
        db.get().collection(collection.ORDER_COLLECTION).updateMany({ _id:objectId(proId)},
        {
          $set:{
            status:'canceled',
            fixed:true
          }
        }).then((response) => {
            resolve(response);
          });
      } catch (error) {
        reject(error)
      }
    });
},

  getUserfullOrders:()=>{
    return new Promise(async(resolve,reject)=>{
       try {
         let orders= await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
        
         resolve(orders)
       } catch (error) {
        reject(error)
       }

    })
},

addtoWhishlist:(proId,userId)=>{
    let proObj={
        item:objectId(proId)
    }
    return new Promise(async(resolve, reject) => {
      try {
          let WHISHLIST=await db.get().collection(collection.WHISHLIST_COLLECTION).findOne({user:objectId(userId)})
          if(WHISHLIST){
              let proExist=WHISHLIST.products.findIndex(product=> product.item==proId)
             
              if(proExist!=-1){
                  db.get().collection(collection.WHISHLIST_COLLECTION).updateOne({user:objectId(userId)},
                  {
                     $pull:{products:proObj}
                  }
                  
                  ).then((response)=>{
                     resolve()
                  })
              }else{
               db.get().collection(collection.WHISHLIST_COLLECTION).updateOne({user:objectId(userId)},
               {
                  $push:{products:proObj}
               }
               
               ).then((response)=>{
                  resolve()
               })
              }
  
          }else{
              let WHISHObj={
                  user:objectId(userId),
                  products:[proObj]
              }
              db.get().collection(collection.WHISHLIST_COLLECTION).insertOne(WHISHObj).then((response)=>{
                  resolve()
  
              })
          }
      } catch (error) {
        reject(error)
      }
    })
},  

getwhishlistProducts:(userId)=>{
    return new Promise(async(resolve, reject) => {
     try {
         let whishlistItems=await db.get().collection(collection.WHISHLIST_COLLECTION).aggregate([
           {
               $match:{user:objectId(userId)}
           },
           {
               $unwind:'$products'
           },
           {
               $project:{
                   item:'$products.item',
                  
               }
   
           },
           {
               $lookup:{
                   from:collection.PRODUCT_COLLECTION,
                   localField:'item',
                   foreignField:'_id',
                   as:'product'
               }
   
           },
           {
               $project:{
                   item:1,
                   product:{$arrayElemAt:['$product',0]}
               }
           }
          
         ]).toArray()
         resolve(whishlistItems)
     } catch (error) {
        reject(error)
     }
           
    }


)},


removeProductFromWishlist: (details) => {
    let productId = details.proId
    let cartId = details.cartId
    return new Promise((resolve, reject) => {
   try {
         db.get().collection(collection.WHISHLIST_COLLECTION).updateOne({ _id:objectId(cartId) },
             {
                 $pull: { products: { item:objectId(productId) } }
             }
         ).then((response) => {
             resolve()
             
         })
   } catch (error) {
    reject(error)
   }
    })

},


getSavedAddress:(userId)=>{
    return new Promise((resolve,reject)=>{
    try {
         db.get().collection(collection.ADDRESS_COLLECTION).findOne({user: objectId(userId)}).then((savedAddress)=>{
            if(savedAddress){
                let addressArray=savedAddress.address
                if(addressArray.length > 0){
                    resolve(savedAddress)
                }else{
                    resolve(false)
                }
             }else{
                resolve(false)
             }
         })
    } catch (error) {
        reject(error)
    }
    
    })
},



addNewAddress: (address, userId) => {

    let addressData = {

        addressId: uuidv4(),
        First_Name: address.First_Name,
        Last_Name: address.Last_Name,
        Company_Name: address.Company_Name,
        Street_Address: address.Street_Address,
        Extra_Details: address.Extra_Details,
        Town_City: address.Town_City,
        Country_State: address.Country_State,
        Post_Code: address.Post_Code,
        Phone: address.phone,
        Alt_Phone: address.Alt_Phone

    }
    return new Promise(async(resolve, reject) => {
      try {
          let getAddress = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ user: objectId(userId) })
         
          if (getAddress) {
              db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ user: objectId(userId) },
                  {
                      $push: {
                          address: addressData
                      }
                  }).then((response) => {
                      resolve(response)
                    
                  })
  
          } else {
              let addressObj = {
                  user: objectId(userId),
                  address: [addressData]
              }
  
              db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addressObj).then((response) => {
                  resolve(response)
                
              })
          }
      } catch (error) {
        reject(error)
      }
    })
},


getUserOrderBill:(orderId)=>{
    return new Promise(async(resolve, reject) => {
      try {
          let orderBill=await db.get().collection(collection.ORDER_COLLECTION).find({_id:objectId(orderId)}).toArray()
          
          resolve(orderBill)
      } catch (error) {
        reject(error)
      }
    })
},



checkCoupon: (code,amount) => {
    const coupon = code.toString().toUpperCase();
    return new Promise((resolve, reject) => {
      try {
          db.get().collection(collection.COUPON_COLLECTION).findOne({ name: coupon }).then((response) => {
              
              if (response == null) {
              
                  reject({ status: false })
              } else {
                  let offerPrice = parseInt(amount * response.offer/100)
                
                  let newTotal = parseInt(amount - offerPrice)
                 
                  
                  resolve(response = {
                      couponCode: coupon,
                      status: true,
                      amount: newTotal,
                      discount: offerPrice
                  })
              }
          })
      } catch (error) {
        reject(error)
      }
    })
},


editprofile:(uId,data,image)=>{
    return new Promise((resolve, reject) => {
     try {
         db.get().collection(collection.USER_COLLECTION).update({_id:objectId(uId)},
         {
           $set:{
               username:data.username,
               email:data.email,
               phone:data.phone,
               image:image
           }
     
         }).then((response)=>{
        
           resolve()
         })
     } catch (error) {
        reject(error)
     }
    })
},

getUser:(userId) => {
    return new Promise((resolve, reject) => {
  try {
        db.get().collection(collection.USER_COLLECTION).findOne({_id: objectId(userId)}).then((user) => {
            resolve(user);
          });
  } catch (error) {
    reject(error)
  }
        
    });
  },

getSameAddress: (address_Id) => {
    return new Promise((resolve, reject) => {
       try {
         db.get().collection(collection.ADDRESS_COLLECTION).findOne({ "address.addressId": address_Id }).then((res) => {
             resolve(res)
         })
       } catch (error) {
        reject(error)
       }
    })
},

editAddress:(AId,addressData)=>{
    return new Promise((resolve, reject) => {
      try {
        db.get().collection(collection.ADDRESS_COLLECTION).updateOne({"address.addressId":AId},
        {
          $set:{
  
                          "address.$.First_Name": addressData.First_Name,
                          "address.$.Last_Name": addressData.Last_Name,
                          "address.$.Company_Name": addressData.Company_Name,
                          "address.$.Street_Address": addressData.Street_Address,
                          "address.$.Extra_Details": addressData.Extra_Details,
                          "address.$.Town_City": addressData.Town_City,
                          "address.$.Country_State": addressData.Country_State,
                          "address.$.Post_Code": addressData.Post_Code,
                          "address.$.Phone": addressData.Phone,
                          "address.$.Alt_Phone": addressData.Alt_Phone
            
          }
    
        }).then((response)=>{
       
          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  },

  deleteAddress: (addressId,userId) => {
   
    return new Promise(async (resolve, reject) => {
       try {
         db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ user: objectId(userId) },
             {
                 $pull: {
                     address: { addressId: addressId }
                 }
             },
             {
                 multi: true
             }).then(() => {
                 resolve()
                
             })
       } catch (error) {
        reject(error)
       }

    })
},


}