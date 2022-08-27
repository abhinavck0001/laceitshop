var express = require("express");
const { response, render } = require("../app");
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelper = require("../helpers/product-helpers");
const { array } = require("../middlewares/multter");
const multer = require("../middlewares/multter");
const twlioHelpers = require("../helpers/twlio-helpers");
const session = require("express-session");
const { Db } = require("mongodb");
const collection = require("../config/collection");
var db = require("../config/connection");
const moment = require("moment");
const adminHelpers = require("../helpers/admin-helpers");

//verify login
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
 try {
   let user = req.session.user;
   let cartcount = null;
   let product = null;
   let username = null;
 console.log(req.session);
   if (req.session.user) {
     cartcount = await userHelpers.getCartcount(req.session.user._id);
     product = userHelpers.getcartProducts(req.session.user._id);
     username = await userHelpers.getUser(req.session.user._id);
   }


   productHelper.getproducts().then((products) => {
     productHelper.getCategory().then((Category) => {
       adminHelpers.viewBanner().then((banner)=>{
        adminHelpers.viewMessage().then((message)=>{
 
       
       res.render("index", {
         user,
         layout: "user-layout",
         products,
         Category,
         cartcount,
         product,
         username,
         banner,
         message
       });
     })
    })
     });
   });
 } catch (error) {
  next(error)
  
 }
});

//login
router.get("/login", (req, res, next) => {
 
 try {
   if (req.session.loggedIn) {
     res.redirect("/");
   } else {
     res.render("user/login", {
       loginErr: req.session.loginErr,
       layout: "user-layout",
     });
     req.session.loginErr = false;
   }
 } catch (error) {
  next(error)
 }
});

// post login
router.post("/login", (req, res,next) => {
try {
    userHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.loginErr = true;
        res.redirect("/login");
      }
    });
} catch (error) {
  next(error)
}
});

//signup
router.get("/signup", (req, res,next) => {
try {
    if (req.session.loggedIn) {
      res.redirect("/");
    } else {
      res.render("user/signup", {
        loginErr: req.session.loginErr,
        userErr: req.session.userError,
        layout: "user-layout",
      });
    }
} catch (error) {
  next(error)
}
});

//post signup
router.post("/signup", async (req, res, next) => {
 try {
   let user = await db
     .get()
     .collection(collection.USER_COLLECTION)
     .findOne({ email: req.body.email });
 
   if (user) {
     req.session.userError = "user already exist";
     res.redirect("/signup");
   } else {
     req.session.body = req.body;
     twlioHelpers.dosms(req.session.body).then((data) => {
       if (data.valid) {
         res.redirect("/otp");
       } else {
         res.redirect("/signup");
       }
     });
   }
 } catch (error) {
  next(error)
 }
});

//otp
router.get("/otp", (req, res,next) => {
try {
    if (req.session.loggedIn) {
      res.redirect("/");
    } else {
      res.render("user/otp", { layout: "user-layout" });
    }
} catch (error) {
  next(error)
}
});

// post otp
router.post("/otp", (req, res,next) => {
  try {
    twlioHelpers.otpVerify(req.body, req.session.body).then((data) => {
      if (data.valid) {
        userHelpers.doSignup(req.session.body).then((data) => {
            if (data.isUserValid) {
              req.session.isloggedin = true;
              req.session.user = data.user;
              res.redirect("/login");
            } else {
              req.session.isloggedin = false;
              res.redirect("/signup");
            }
          })
          .catch((err) => {
            req.session.err = err;
            res.redirect("/signup");
          });
      }
    });
  } catch (error) {
    next(error)
  }
});

//logout
router.get("/logout", (req, res,next) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    next(error)
  }
});

//quick view
router.get("/quick-view", (req, res,next) => {
 try {

  if (req.session.loggedIn) {
   productHelper.getProductDetails(req.query.id).then(async (product) => {
     let users = req.session.user;
     let cartcount = null;
     let username = await userHelpers.getUser(req.session.user._id);
     if (users) {
       cartcount = await userHelpers.getCartcount(req.session.user._id);
     }
     res.render("user/quick-view", {users,layout: "user-layout",product, cartcount, username,
     });
   });
  }else{
    productHelper.getProductDetails(req.query.id).then( (product) => {
      res.render("user/quick-view", {layout: "user-layout",product
    });
    });
  }
 } catch (error) {
  next(error)
 }
});

//cart
router.get("/cart",verifyLogin,async (req, res,next) => {
try {
    if (req.session.loggedIn) {
      let user = req.session.user;
      let cartcount = null;
      let products = await userHelpers.getcartProducts(user._id);
      let totalValue = await userHelpers.getTotalAmount(user._id);
      let username = await userHelpers.getUser(req.session.user._id);
      if (req.session.user) {
        cartcount = await userHelpers.getCartcount(user._id);
      }
      res.render("user/cart", {
        layout: "user-layout",
        user,
        totalValue,
        products,
        cartcount,
        username,
      });
    } else {
      res.redirect("/login");
    }
} catch (error) {
  next(error)
}
});

//add to cart
router.get("/add-to-cart/:id", verifyLogin, (req, res ,next) => {
  try {
    userHelpers.addtoCart(req.params.id, req.session.user._id).then(() => {});
  } catch (error) {
    next(error)
  }
});

//add to cart from whishlist
router.get("/add-to-cartFromWish/:id", verifyLogin, (req, res,next) => {
 try {
   userHelpers.addtoCart(req.params.id, req.session.user._id).then(() => {
     res.redirect("/whishlist");
   });
 } catch (error) {
  next(error)
 }
});

//selected category
router.get("/selected-category",async (req, res,next) => {
 try {
   if (req.session.loggedIn) {
    username = await userHelpers.getUser(req.session.user._id);
    user=req.session.user
    let cartcount = await userHelpers.getCartcount(req.session.user._id);
    productHelper.getselectedproducts(req.query.id).then((product) => {
      res.render("user/selected-category", {layout: "user-layout",product,user,cartcount,username
      });
    });
  }else{
    productHelper.getselectedproducts(req.query.id).then((product) => {
      res.render("user/selected-category", {layout: "user-layout",product
      });
    });

  }


 } catch (error) {
  next(error)
 }
});

//change product quantity
router.post("/change-product-quantity", async (req, res, next) => {
 
 try {
   userHelpers.changeProductQuantity(req.body).then(async (response) => {
     response.total = await userHelpers.getTotalAmount(req.body.user);
     res.json(response);
   });
 } catch (error) {
  next(error)
 }
});

//remove product from cart
router.post("/removeProductFromCart", (req, res,next) => {
 try {
   userHelpers.removeProductFromCart(req.body).then((response) => {
     res.json(response);
   });
 } catch (error) {
  next(error)
 }
});

//check-out
router.get("/checkout", verifyLogin, async (req, res,next) => {
 try {
   let user = req.session.user;
   let cartcount = await userHelpers.getCartcount(user._id);
   let totalValue = await userHelpers.getTotalAmount(user._id);
   let savedAddress = await userHelpers.getSavedAddress(user._id);
   let username = await userHelpers.getUser(req.session.user._id);
 let message= await adminHelpers.viewMessage()
   res.render("user/checkout", {
     layout: "user-layout",
     user,
     cartcount,
     totalValue,
     savedAddress,
     username,
     message
   });
 } catch (error) {
  next(error)
 }
});

//shop
router.get("/shop", async (req, res,next) => {
 try {
 
   if (req.session.loggedIn) {
    username = await userHelpers.getUser(req.session.user._id);
    user=req.session.user
    let cartcount = await userHelpers.getCartcount(req.session.user._id);
    productHelper.getproducts().then((products) => {
      res.render("user/shop", {layout: "user-layout",products,user,cartcount,username,
      });
    });
  }else{

    productHelper.getproducts().then((products) => {
      res.render("user/shop", {layout: "user-layout",products
      });
    });

  }
   
 
 } catch (error) {
  next(error)
 }
});

//post place order
router.post("/place-order", async (req, res,next) => {
try {
    let userId = "" + req.body.userId;
    let products = await userHelpers.getCartproductLIst(userId);
    let totalPrice = await userHelpers.getTotalAmount(userId);
  
    if (req.body.saveAddress == "on") {
      await userHelpers.addNewAddress(req.body, req.session.user._id);
    }
  
    let discountData = null;
    if (req.body.Coupon_Code) {
      await userHelpers.checkCoupon(req.body.Coupon_Code, totalPrice).then((response) => {
          discountData = response;
        })

        .catch(() => (discountData = null));
    }
  
  
    userHelpers.placeOrder(req.body, products, totalPrice,discountData).then((orderId) => {
        if (req.body["Pay_Method"] === "COD") {
          res.json({ codSuccess: true });
        } else {
          let netAmount = discountData ? discountData.amount : totalPrice;
          userHelpers.generateRazorpay(orderId, netAmount).then((response) => {
            res.json(response);
          });
        }
      });
} catch (error) {
  next(error)
}
});

//VERIFY PAYMENT
router.post("/verify-payment", (req, res,next) => {
  try {
    userHelpers.verifyPayment(req.body)
      .then(() => {
        userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
          console.log("Payment successfull");
          res.json({ status: true });
        });
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: false, errMsg: "" });
      });
  } catch (error) {
    next(error)
  }
});

//chechout
router.get("/checkout-ending", verifyLogin, async (req, res,next) => {
 try {
   let user = req.session.user;
   let username = await userHelpers.getUser(req.session.user._id);
   res.render("user/checkout-success", {
     layout: "user-layout",
     user,
     username,
   });
 } catch (error) {
  next(error)
 }
});

//my orders
router.get("/myorders", verifyLogin, async (req, res,next) => {
try {
    let user = req.session.user;
    let username = await userHelpers.getUser(req.session.user._id);
    let orders = await userHelpers.getUserOrders(req.session.user._id, username);
    orders.forEach((element) => {
      element.date = moment(element.date).format("DD-MM-YYYY  h:mm:ss A");
    });
    res.render("user/myorders", {
      layout: "user-layout",
      user,
      orders,
      username,
    });
} catch (error) {
  next(error)
}
});

//view-order-products
router.get("/view-order-products",verifyLogin,async (req, res,next) => {
  try {
    let user = req.session.user;
    let orderId = req.query.id;
    let products = await userHelpers.getOrderProducts(req.query.id);
    let orderBill = await userHelpers.getUserOrderBill(req.query.id);
    let username = await userHelpers.getUser(req.session.user._id);
    orderBill.forEach((element) => {
      element.date = moment(element.date).format("DD-MM-YYYY  h:mm:ss A");
    });
    res.render("user/view-order", {
      layout: "user-layout",
      user,
      products,
      orderBill,
      orderId,
      username,
    });

    
  } catch (error) {
    next(error)
  }
});

//bill
router.get("/bill",verifyLogin, async (req, res,next) => {
 try {
   let user = req.session.user;
   let products = await userHelpers.getOrderProducts(req.query.id);
   let orderBill = await userHelpers.getUserOrderBill(req.query.id);
   let username = await userHelpers.getUser(req.session.user._id);

   orderBill.forEach((element) => {
     element.date = moment(element.date).format("DD-MM-YYYY  h:mm:ss A");
   });
   res.render("user/bill", {
     layout: "user-layout",
     user,
     products,
     orderBill,
     username,
   });
 } catch (error) {
  next(error)
 }
});

// cancel  order
router.get("/cancel-order/:id", verifyLogin, (req, res,next) => {
  try {
    let proId = req.params.id;
    userHelpers.cancelOrder(proId).then((response) => {
      res.redirect("/myorders");
    });
  } catch (error) {
    next(error)
  }
});

//user profile
router.get("/user-profile", verifyLogin, async (req, res,next) => {
 try {
   let user = req.session.user;
   let cartcount = await userHelpers.getCartcount(user._id);
   let username = await userHelpers.getUser(user._id);
   res.render("user/user-profile", {
     layout: "user-layout",
     cartcount,
     username,
     user,
   });
 } catch (error) {
  next(error)
 }
});

//edit profile
router.get("/edit-user-profile", verifyLogin, async (req, res,next) => {
try {
    let user = req.session.user;
  
    let username = await userHelpers.getUser(user._id);
  
    let cartcount = await userHelpers.getCartcount(user._id);
  
    res.render("user/edit-user-profile", {
      layout: "user-layout",
      user,
      cartcount,
      username,
    });
} catch (error) {
  next(error)
}
});

//whishlist
router.get("/whishlist", verifyLogin, async (req, res,next) => {
 try {
   let user = req.session.user;
   let cartcount = await userHelpers.getCartcount(req.session.user._id);
   let username = await userHelpers.getUser(req.session.user._id);
 
   let products = await userHelpers.getwhishlistProducts(user._id);
   res.render("user/whishlist", {
     layout: "user-layout",
     cartcount,
     user,
     products,
     username,
   });
 } catch (error) {
  next(error)
 }
});

// add to whishlist
router.get("/add-to-whishlist/:id", verifyLogin, (req, res,next) => {
 try {
   userHelpers
     .addtoWhishlist(req.params.id, req.session.user._id)
     .then(() => {});
 } catch (error) {
  next(error)
 }
});

// remove from whishlist
router.get("/remove-from-whishlist", verifyLogin, (req, res,next) => {
  try {
    let details = {
      cartId: req.query.id,
      proId: req.query.proId,
    };
    userHelpers.removeProductFromWishlist(details).then((response) => {
      res.redirect("/whishlist");
    });
  } catch (error) {
    next(error)
  }
});

//saved address
router.get("/savedAddress", verifyLogin, async (req, res,next) => {
try {
    let user = req.session.user;
    let cartcount = await userHelpers.getCartcount(user._id);
    let savedAddress = await userHelpers.getSavedAddress(user._id);
    

    let username = await userHelpers.getUser(req.session.user._id);
  
    res.render("user/savedAddress", {
      layout: "user-layout",
      user,
      cartcount,
      savedAddress,
      username,
    });
} catch (error) {
  next(error) 
}
});

//check coupon
router.post("/check-coupon", async (req, res,next) => {
 try {
   let userId = req.session.user._id;
   let couponCode = req.body.coupon;
   let totalAmount = await userHelpers.getTotalAmount(userId);
   userHelpers.checkCoupon(couponCode,totalAmount).then((response) => {
       res.json(response);
     })
     .catch((response) => {
       res.json(response);
     });
 } catch (error) {
  next(error)
 }
});

//edit userprofile
router.post("/edit-userProfile", store.array("image", 1), async (req, res,next) => {
try {
    let images = [];
    let files = req.files;
    images = files.map((value) => {
      return value.filename;
    });
    console.log(req.body);
    userHelpers.editprofile(req.query.id, req.body, images).then((response) => {
      res.redirect("/user-profile");
    });
} catch (error) {
  next(error)
}
});

//edit address
router.get("/editAddress", verifyLogin, async (req, res,next) => {
 try {
   let user = req.session.user;
 
   let addressId = req.query.id;
   let addressData = await userHelpers.getSameAddress(addressId);
   let cartcount = await userHelpers.getCartcount(user._id);
   let username = await userHelpers.getUser(user._id);
   
   res.render("user/editAddress", {
     layout: "user-layout",
     cartcount,
     username,
     user,
     addressData,
   });
 } catch (error) {
  next(error)
 }
});

router.post("/editAddress", async (req, res,next) => {
  try {
    let addId = req.query.id;
    userHelpers.editAddress(addId, req.body).then((response) => {
      res.redirect("/savedAddress");
    });
  } catch (error) {
    next(error)
  }
});
//delete address
router.get("/deleteAddress", verifyLogin, (req, res,next) => {
 try {
   let userId = req.session.user._id;
   let adressId = req.query.id;
 
   userHelpers.deleteAddress(adressId, userId).then((response) => {
     res.redirect("/savedAddress");
   });
 } catch (error) {
  next(error)
 }
});

//add address
router.get('/AddAddress',verifyLogin,async(req,res,next)=>{
 try {
   let user=req.session.user
   let cartcount = await userHelpers.getCartcount(user._id);
   let username = await userHelpers.getUser(user._id);
  
 
   res.render('user/Addaddress',{layout:'user-layout',user,cartcount,username})
 } catch (error) {
  next(error)
 }


})

//post add address
router.post('/AddAddress',verifyLogin,(req,res,next)=>{
try {
  
    let user=req.session.user
   
    userHelpers.addNewAddress(req.body,user._id).then(() => {
      res.redirect('/savedAddress')
  })
} catch (error) {
  next(error)
}
  
})

//ruff
router.get('/ruff',verifyLogin,async(req,res,next)=>{
  try {
    let user=req.session.user
    let cartcount = await userHelpers.getCartcount(user._id);
    let username = await userHelpers.getUser(user._id);
   
    productHelper.getproducts().then((products) => {
    res.render('user/ruff',{layout:'user-layout',user,cartcount,username,products})
    })
  } catch (error) {
   next(error)
  }
 
 
 })


module.exports = router;
