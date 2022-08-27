var db=require('../config/connection') 
var collection=require('../config/collection')
const objectId = require('mongodb').ObjectId
  
  module.exports={

  
addProduct:(product,images)=>{
      return new Promise((resolve,reject)=>{
        try {
          db.get().collection(collection.PRODUCT_COLLECTION).insertOne({
              name:product.name,
              price:parseInt(product.price),
              description:product.description,
              category:product.category,
              "deleted":false,
              images 
                     
          }).then((data)=>{
            resolve(data.insertedId)
          })
        } catch (error) {
          reject(error)
        }
      })
    },

addCategory:(category,images)=>{
      return new Promise((resolve,reject)=>{
      try {
          db.get().collection(collection.CATEGORY_COLLECTION).insertOne({
              category:category.category,
              images,
              "deleted":false,
                     
          }).then((data)=>{
            resolve(data.insertedId)
          })
      } catch (error) {
        reject(error)
      }
      })
    },

    

getproducts:(()=>{

return new Promise(async(resolve,reject)=>{
  try {
       let products= await db.get().collection(collection.PRODUCT_COLLECTION).find({deleted:false}).toArray()
         resolve(products)
      
  } catch (error) {
    reject(error)
  }       
})

}),


getCategory:(()=>{

  return new Promise(async(resolve,reject)=>{
      try {
         let Category= await db.get().collection(collection.CATEGORY_COLLECTION).find({deleted:false}).toArray()
           resolve(Category)
      } catch (error) {
        reject(error)
      }
             
  })
  
  }),



deleteProduct:(proId) => {
  return new Promise((resolve, reject) => {
   
    try {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id:objectId(proId)},
      {
        $set:{
          deleted:true
        }
      }).then((response) => {
        console.log("finishedt the operation db ");
          resolve(response);
        });
    } catch (error) {
      reject(error)
    }
  });
},


getAllproducts:((proId)=>{

  return new Promise((resolve,reject)=>{
try {
         db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
               resolve(product)
         })
} catch (error) {
  reject(error)
}
  
  })
  
  }),
  
getProductDetails:(proId) => {
    return new Promise((resolve, reject) => {
    try {
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id: objectId(proId)}).then((product) => {
            resolve(product);
          });
          
    } catch (error) {
      reject(error)
    }
    });
  },

getselectedproducts:(cId) => {
    return new Promise((resolve, reject) => {
     try {
       db.get().collection(collection.PRODUCT_COLLECTION).find({category:cId,deleted:false}).toArray().then((product) => {
           resolve(product);
         });
     } catch (error) {
       reject(error)
     }
       
    });
  },

editProduct:(proId,product,images)=>{
  return new Promise((resolve, reject) => {
   try {
     db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
     {
       $set:{
         name:product.name,
         price:product.price,
         description:product.description,
         category:product.category,
         images
       }
 
     }).then((response)=>{
    
       resolve()
     })
   } catch (error) {
    reject(error)
   }
  })
},


editCategory:(cId,category)=>{
  return new Promise((resolve, reject) => {
   try {
     db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(cId)},
     {
       $set:{
         category:category.category
       }
 
     }).then((response)=>{
    
       resolve()
     })
   } catch (error) {
    reject(error)
   }
  })
},

getOnecategory:((cId)=>{

  return new Promise((resolve,reject)=>{
    try {
         db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(cId)}).then((category)=>{
               resolve(category)
         })
    
    } catch (error) {
      reject(error)
    }
  })
  
  }),


deleteCategory:(cId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id:objectId(cId)},
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

  
}