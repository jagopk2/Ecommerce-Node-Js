var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var Cart = require('../models/cart');
var Product = require('../models/product');
var Order = require('../models/order');
var regexp = require('regexp')
var _ = require('lodash');
/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.query) {
    console.log('The Query Exists');
  }
  var successMsg = req.flash('success')[0];
  var products = Product.find(function (err, docs) {
    var productChunks = [];
    var chunkSize = 4;
    for (var i = 0; i < docs.length; i += chunkSize) {
      productChunks.push(docs.slice(i, i + chunkSize));
    }
    res.render('shop/index', {
      title: 'Express',
      products: productChunks,
      successMsg: successMsg,
      noMessages: !successMsg
    });
  });

});


router.post('/search', function (req, res) {

  // console.log();
  var searchItem = req.body.search;
  Product.find({
      title: {
        $regex: searchItem,
        $options:"$i" 
      }
    },
    function (error, products) {
      if (error) {
        console.log('Error to Find Object', error);
        return res.render('shop/search', {
          products: null
        });
      }
      // res.send(products);
      res.render('shop/search', {
        products: products
      });

    });
  // res.redirect('/');
});

router.get('/cat/:category',function(req,res){
  var mycat = req.params.category;
  // console.log(mycat);
  var products = Product.find({
    category:mycat
  },function (err, docs) {
    var productChunks = [];
    var chunkSize = 4;
    for (var i = 0; i < docs.length; i += chunkSize) {
      productChunks.push(docs.slice(i, i + chunkSize));
    }
    res.render('shop/category', {
      title: 'Express',
      products: productChunks,
      category:mycat
    });
  }).catch(function(e){
    console.log('error has accoured',e);
  });
  // console.log(products);
});


router.get('/add-to-cart/:id', function (req, res) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  Product.findById(productId, function (error, product) {
    if (error) {
      return res.redirect('/');
    }
    cart.add(product, productId);
    // console.log(product);
    req.session.cart = cart;
    // console.log(req.session.cart);
    res.redirect('/');
  });
});



router.get('/shopping-cart', function (req, res) {
  if (!req.session.cart) {
    return res.render('shop/shopping-cart', {
      products: null
    });
  }
  var cart = new Cart(req.session.cart);
  res.render('shop/shopping-cart', {
    products: cart.generateArray(),
    totalPrice: cart.totalPrice
  });
});
router.get('/checkout', isLoggedIn, function (req, res) {
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }

  var cart = new Cart(req.session.cart);
  var errMsg = req.flash('error')[0];
  res.render('shop/checkout', {
    totalPrice: cart.totalPrice,
    totalStripePrice: cart.totalPrice * 100,
    errMsg: errMsg,
    noError: !errMsg
  });
});
router.post('/checkout', isLoggedIn, function (req, res) {
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }
  var cart = new Cart(req.session.cart);

  var stripe = require("stripe")("sk_test_omOD5lbbBI7Rabdh3pX8JQyn");

  // Token is created using Checkout or Elements!
  // Get the payment token ID submitted by the form:
  const token = req.body.stripeToken; // Using Express

  const charge = stripe.charges.create({
    amount: cart.totalPrice * 100,
    currency: 'usd',
    description: 'Example charge',
    source: token,
  }, function (err, charge) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('/checkout');
    }
    var order = new Order({
      user: req.user,
      cart: cart,
      adress: 'Some Adresss',
      name: 'Some Name',
      paymentId: charge.id
    });
    order.save(function (err, result) {
      if (err) {
        return console.log('Cannot Save Order to the MonogoDb', err);
      }
      req.flash('success', 'Succesfully Bought the Product');
      req.session.cart = null;
      res.redirect('/');
    });

  });

});


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect('/user/signin');
}



module.exports = router;