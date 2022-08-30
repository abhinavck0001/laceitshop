var express = require("express");
const { response } = require("../app");
var router = express.Router();
var adminHelper = require("../helpers/admin-helpers");
var productHelper = require("../helpers/product-helpers");
const { verifyPayment } = require("../helpers/user-helpers");
var userHelpers = require("../helpers/user-helpers");
const multer=require('../middlewares/multter')
require('dotenv').config()


const adminData = {
  username:  process.env.ADMIN_NAME,
  password:  process.env.ADMIN_PASSWORD,
};


//get home
router.get("/",async(req, res, next)=> {

  if (req.session.isAdminLogedIn) {
      try {
    
    
      let delivery = {}
      delivery.pending = 'pending'
      delivery.Placed = 'placed'
      delivery.Shipped = 'shipped'
      delivery.Deliverd = 'delivered'
      delivery.Cancelled = 'canceled'
      const allData = await Promise.all
        ([
          adminHelper.onlinePaymentCount(),
          adminHelper.totalUsers(),
          adminHelper.totalOrder(),
          adminHelper.cancelOrder(),
          adminHelper.totalCOD(),
          adminHelper.totalDeliveryStatus(delivery.pending),
          adminHelper.totalDeliveryStatus(delivery.Placed),
          adminHelper.totalDeliveryStatus( delivery.Shipped),
          adminHelper.totalDeliveryStatus(delivery.Deliverd),
          adminHelper.totalDeliveryStatus(delivery.Cancelled),
          adminHelper.totalCost(),
        ]);
      res.render('admin/admin', {
         layout: 'admin-layout',

        OnlinePymentcount: allData[0],
        totalUser: allData[1],
        totalOrder: allData[2],
        cancelOrder: allData[3],
        totalCod: allData[4],
        pending: allData[5],
        Placed: allData[6],
        Shipped: allData[7],
        Deliverd: allData[8],
        Cancelled: allData[9],
        totalCost: allData[10],
      })
   
  } catch (err) {
    next(err)
  }

     } else {
    res.redirect("/admin/admin-login");      
  }
});


//admin login
router.get("/admin-login", (req,res,next) => {
  
  try {
    if (req.session.isAdminLogedIn) {
      res.redirect("/admin/");
    } else {
      res.render("admin/admin-login",{layout:"admin-layout",admin:true});
    }
  } catch (err) {
    next(err)
  }
});



//post admin login
router.post("/admin-login", (req, res,next) => {
  try {
    if (
      req.body.username === adminData.username &&
      req.body.password === adminData.password       
    ) {
      req.session.isAdminLogedIn = true;
      res.redirect("/admin/");
    } else {
      res.redirect("/admin/admin-login");
    }
  } catch (error) {
    next(error)
    
  }
});

//logout
router.get("/admin-logout", (req, res,next) => {
 try {
   req.session.isAdminLogedIn = null;
   res.redirect("/admin/admin-login"); 
 } catch (error) {
  next()
 } 
});


// user manage
router.get("/admin-manage-user", function (req, res, next) {
try {
    if (req.session.isAdminLogedIn) {
      adminHelper.getUserDtls().then((userDtls) => {    
        res.render("admin/admin-manage-user", { userDtls,layout:"admin-layout" });
      });
    } else {
      res.redirect("/admin/admin-login");      
    }
} catch (error) {
  next(error)
}
});


//view product
router.get("/view-product", function (req, res, next) {
  try {
    if (req.session.isAdminLogedIn) {
      productHelper.getproducts().then((products) => {    
        res.render("admin/view-product", { products,layout:"admin-layout" });
      });
    } else {
      res.redirect("/admin/admin-login");      
    }
  } catch (error) {
    next(error)
  }
});     



//get addproduct
router.get("/add-product", function (req, res, next) {
 try {
   if (req.session.isAdminLogedIn) {
 
     productHelper.getCategory().then((Category)=>{
       res.render("admin/add-product",{layout:'admin-layout',Category})
     })
     
 
   } else {
     res.redirect("/admin/admin-login");      
   }
 } catch (error) {
  next()
 }
}); 


//post addproduct
router.post('/add-product',store.array('image',4),function(req,res,next){
 try {
   if (req.session.isAdminLogedIn) {
   
   let images=[]
 let files=req.files
 
 
 images=files.map((value)=>{
  return value.filename
 
 })
 
   productHelper.addProduct(req.body,images).then((response)=>{
 
     res.redirect('/admin/view-product')
    
   })
 } else {
     res.redirect("/admin/admin-login");      
   }
   
 } catch (error) {
  next(error)
  
 }
 

});


//block user
router.get("/admin-manage-user/block-users/:id", (req, res,next) => {
 try {
   if (req.session.isAdminLogedIn) {
     adminHelper.blockUsers(req.params.id).then(() => {
       res.redirect("/admin/admin-manage-user");
     });
   } else {
     res.redirect("/admin/admin-login");
   }
 } catch (error) {
  next(error)
  
 }
});

//unblock user
router.get("/admin-manage-user/unblock-users/:id", (req, res,next) => {
 try {
   if (req.session.isAdminLogedIn) {
     adminHelper.unBlockUsers(req.params.id).then(() => {
       res.redirect("/admin/admin-manage-user");
     });
   } else {
     res.redirect("/admin/admin-login");
   }
 } catch (error) {
  next(error)
  
 }
});


//edit product
router.get('/edit-product',(req,res,next)=>{
  try {
    if (req.session.isAdminLogedIn) {
      
    productHelper.getProductDetails(req.query.id).then((product)=>{
      productHelper.getCategory().then((Category)=>{
        res.render('admin/edit-product',{layout:'admin-layout',product, Category})
      })
  
      
    })
  } else {
    res.redirect("/admin/admin-login");      
  }
    
  } catch (error) {
    next(error)
    
  }
})

//post edit product
router.post('/edit-product',store.array('image',4),(req,res,next)=>{
  try {
    if (req.session.isAdminLogedIn) {
    let images=[]
    let files=req.files
    console.log(req.body);
    console.log(req.files);
    images=files.map((value)=>{
     return value.filename
    
    })
    productHelper.editProduct(req.query.id,req.body,images).then((response)=>{
  
      res.redirect('/admin/view-product')
     
    })
  } else {
    res.redirect("/admin/admin-login");      
  }
  } catch (error) {
    next(error)
    
  }
  
})

//delet product
router.get("/delete-product", (req, res,next) => {
  try {
    if (req.session.isAdminLogedIn) {
          let proId=req.query.id
          productHelper.deleteProduct(proId).then((response) => {
            res.redirect("/admin/view-product");
          });
    } else {
      res.redirect("/admin/admin-login");
    }
  } catch (error) {
    next(error)
    
  }
});

//view category
router.get("/view-category",(req,res,next)=>{
try {
    if (req.session.isAdminLogedIn) {
    productHelper.getCategory().then((Category)=>{
      res.render("admin/view-category",{layout:'admin-layout',Category})
    })
    }else {
      res.redirect("/admin/admin-login");      
    }
} catch (error) {

  next(error)
  
}
})


//add category
router.get('/add-category',(req,res,next)=>{
  try {
    if (req.session.isAdminLogedIn) {
      res.render("admin/add-category",{layout:'admin-layout'})
      }else {
        res.redirect("/admin/admin-login");      
      }
  } catch (error) {
    next(error)
  }
  })

 //post add category
router.post('/add-category',store.array('image',1),function(req,res, next){
try {
    if (req.session.isAdminLogedIn) {
    
    let images=[]
  let files=req.files
  
  
  images=files.map((value)=>{
   return value.filename
  
  })
  
    productHelper.addCategory(req.body,images).then((response)=>{
  
      res.redirect('/admin/view-category')
     
    })
  } else {
      res.redirect("/admin/admin-login");      
    }
    
} catch (error) {
  next(error)
}
 

});


// edit category
  router.get('/edit-category',(req,res,next)=>{
    try {
      if (req.session.isAdminLogedIn) {
        productHelper.getOnecategory(req.query.id).then((Category)=>{
          res.render("admin/edit-category",{layout:'admin-layout',Category})
        })
      
        }else {
          res.redirect("/admin/admin-login");      
        }
    } catch (error) {
      next(error)
    }
    })


//post edit category
    router.post('/edit-category',store.array('image',1),(req,res,next)=>{
     try {
       if (req.session.isAdminLogedIn) {
       let images=[]
       let files=req.files
       images=files.map((value)=>{
        return value.filename
       
       })
       productHelper.editCategory(req.query.id,req.body,images).then((response)=>{
     
         res.redirect('/admin/view-category')
        
       })
     } else {
       res.redirect("/admin/admin-login");      
     }
     } catch (error) {
      next(error)
     }
      
    })

    //delete category
    router.get("/delete-category", (req, res,next) => {
   try {
       if (req.session.isAdminLogedIn) {
             let CId=req.query.id
             productHelper.deleteCategory(CId).then((response) => {
               res.redirect("/admin/view-category");
             });
       } else {
         res.redirect("/admin/admin-login");
       }
   } catch (error) {
    next(error)
    
   }
    });


    //user-orders
   router.get('/user-orders',async(req,res,next)=>{

  try {
        let orders=await userHelpers.getUserfullOrders()
      
        res.render('admin/user-orders',{layout:'admin-layout',orders})
       
  } catch (error) {
    next(error)
  }
    })

    //cancel order

    router.get("/admin-cancel-order/:id", (req, res,next) => {
      try {
        let proId=req.params.id
              userHelpers.cancelOrder(proId).then((response) => {
                res.redirect("/admin/user-orders");
              });
      } catch (error) {
        next(error)
      }
    });



    //change status

    router.get("/change-status1/:id", (req, res,next) => {
    try {
        let proId=req.params.id
        let data='shipped'
              adminHelper.changeStatus(proId,data).then((response) => {
                res.redirect("/admin/user-orders");
              });
    } catch (error) {
      next(error)
      
    }
    });
    
    router.get("/change-status2/:id", (req, res,next) => {
     try {
       let proId=req.params.id
       let data='delivered'
             adminHelper.changeStatus(proId,data).then((response) => {
               res.redirect("/admin/user-orders");
             });
     } catch (error) {
      next(error)
      
     }
    });




    router.get('/admin-view-order-products',async(req,res,next)=>{
     try {
       let orderId=req.query.id
       let products=await userHelpers.getOrderProducts(req.query.id)
       res.render('admin/admin-order-details',{layout:'admin-layout',products,orderId})
     } catch (error) {
      next(error)
     }
     
    })
 

    //coupon
    router.get('/coupon',async(req,res,next)=>{
     try {
       adminHelper.getcoupons().then((coupons)=>{
         res.render('admin/view-coupons',{layout:'admin-layout',coupons})
            
       })
     } catch (error) {
      next(error)
     }
    })



//get generate coupon
    router.get('/generate-coupon',async(req,res,next)=>{
     
     try {
       res.render('admin/generate-coupon',{layout:'admin-layout'})
     } catch (error) {
      next(error)
     }
     
    })


    // post generate coupon
    router.post('/generate-coupon',async(req,res,next)=>{
    try {
        adminHelper.generateCoupon(req.body).then((response)=>{
          res.redirect('/admin/coupon')
  
        })
    } catch (error) {
      next(error)
    }
     
    })

    // delete coupon
    router.get('/delete-coupon',async(req,res,next)=>{
   try {
      let couponId= req.query.id
      adminHelper.deleteCoupon(couponId).then((response)=>{
       res.redirect('/admin/coupon')
      })
   } catch (error) {
    next(error)
   }
    })

// banner
    router.get("/view-banner",(req,res,next)=>{
     try {
       if (req.session.isAdminLogedIn) {
       
         adminHelper.viewBanner().then((banner)=>{
         res.render("admin/banner", {layout:"admin-layout",banner});
       
       })
         
       } else {
         res.redirect("/admin/admin-login");
       }
     } catch (error) {
      next(error)
     }
        
      })

    //add banner
  router.get("/add-banner", function (req, res, next) {
   try {
     if (req.session.isAdminLogedIn) {
       res.render("admin/add-banner", { title: "Admin", layout:"admin-layout" });
     } else {
       res.redirect("/admin/admin-login");      
     }
   } catch (error) {
    next(error)
   }
  }); 


  //add banner post
  router.post('/add-banner',store.array('image',1),function(req,res,next){
  try {
      let images=[]
    let files=req.files
    images=files.map((value)=>{
     return value.filename
    
    })
    adminHelper.addBanner(req.body,images).then((response)=>{
    
        res.redirect('/admin/view-banner')
       
      })
  } catch (error) {
    next(error)
  }
  })



  //delete banner

  router.get("/delete-banner", (req, res,next) => {
    try {
      if (req.session.isAdminLogedIn) {
        
            let banId=req.query.id
           
            adminHelper.deleteBanner(banId).then((response) => {
    
          
              res.redirect("/admin/view-banner");
            });
      } else {
        res.redirect("/admin/admin-login");
      }
    } catch (error) {
      next(error)
    }
  });
  

  //message to user
  router.get("/messageTouser", function (req, res, next) {
    try {
      if (req.session.isAdminLogedIn) {
        adminHelper.viewMessage().then((message)=>{
          res.render("admin/usermessage", {layout:"admin-layout",message});
        
        })
      } else {
        res.redirect("/admin/admin-login");      
      }
    } catch (error) {
     next(error)
    }
   }); 

      //add message
  router.get("/add-message", function (req, res, next) {
    try {
      if (req.session.isAdminLogedIn) {
        res.render("admin/add-message", { title: "Admin", layout:"admin-layout" });
      } else {
        res.redirect("/admin/admin-login");      
      }
    } catch (error) {
     next(error)
    }
   }); 

   //post message
   router.post('/add-message',function(req,res,next){
    try {
      adminHelper.addMessage(req.body).then((response)=>{
          res.redirect('/admin/messageTouser')
         
        })
    } catch (error) {
      next(error)
    }
    })

    router.get("/delete-message", (req, res,next) => {
      try {
        if (req.session.isAdminLogedIn) {
          
              let mId=req.query.id
             
              adminHelper.deleteMessage(mId).then((response) => {
      
            
                res.redirect("/admin/messageTouser");
              });
        } else {
          res.redirect("/admin/admin-login");
        }
      } catch (error) {
        next(error)
      }
    });


  router.get('/*',(req,res)=>{

    res.render('admin/adminError')
  })
   

    
    
    






module.exports = router;
