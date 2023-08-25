var express = require('express');
var router = express.Router();
const User =require("../models/userModel");
const TodoModel = require("../models/todoModel");
const fs=require("fs")

const upload =require("../utils/multer")

const { sendmail } = require("../utils/mail");

const passport =require("passport");
const LocalStartegy =require("passport-local")

passport.use(new LocalStartegy(User.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Homepage',user: req.user });
});


router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Signup-page',user: req.user });
});


router.post('/signup', async function(req,res,next){
  try {
    const {username,email,password}=req.body;

    const newuser =new User({username,email});

    const user = await User.register(newuser,password);

    res.redirect("/signin")
  } catch (error) {
    res.send(error.message);
    
  }
})


router.get('/signin', function(req, res, next) {
  res.render('signin', { title: 'Signin-page',user: req.user });
});


router.post('/signin',passport.authenticate("local",{
  failureRedirect:"/signin",
  successRedirect:"/home",
}), async function(req, res, next)
 {}
 ); 

 router.get("/home", isLoggedIn, async function (req, res, next) {
  try {
      console.log(req.user);
      // const user = await UserModel.findById(req.user._id).populate("todos");
      const { todos } = await req.user.populate("todos");
      console.log(todos);
      res.render("home", { title: "Homepage", todos, user: req.user });
  } catch (error) {
      res.send(error);
  }
});




router.get('/profile',isLoggedIn ,async function(req, res, next) {
try {
  console.log(req.user);
  const users = await User.find();
  res.render('profile', { title: 'profile-page' , users,user:req.user});
} catch (error) {
  res.send(error);
}

});

router.post(
  "/avatar",
  upload.single("avatar"),
  isLoggedIn,
  async function (req, res, next) {
      try {
          if (req.user.avatar !== "default.jpg") {
              fs.unlinkSync("./public/images/" + req.user.avatar);
          }
          req.user.avatar = req.file.filename;
          req.user.save();
          res.redirect("/profile");
      } catch (error) {
          res.send(error);
      }
  }
);

router.get("/signout",function(req,res,next){
  req.logout(()=>{
    res.redirect("/signin")
  })
})


router.get('/delete/:id', async function(req, res, next) {
  try {
    
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/profile");
  } catch (error) {
    res.send(error);
  }
  
  }); 




router.get('/update/:id', async function(req, res, next) {
  var currentUser = await User.findOne(
    {
      _id: req.params.id
    }
  )


  
 
    res.render('update', { title: 'update-page' , ser: currentUser,user: req.user});
});


router.post('/updateUser/:id', async function(req, res, next) {
  console.log(req.body)
  const currentUser = await User.findByIdAndUpdate({_id: req.params.id},{
    username:req.body.username,
    email:req.body.email,
    password:req.body.password,
  });

  res.redirect("/profile")
   
 });


 
 router.get('/get-email', function(req, res, next) {
  res.render('getemail', { title: 'getemail-page',user: req.user });
});


router.post("/get-email", async function (req, res, next) {
  try {
      const user = await User.findOne({ email: req.body.email });

      if (user === null) {
          return res.send(
              `User not found. <a href="/get-email">Forget Password</a>`
          );
      }else(

        sendmail(req, res, user)
      )
  } catch (error) {
      res.send(error);
  }
});


router.get('/change-password/:id', function(req, res, next) {
  res.render('changepassword', { title: 'changepassword-page',id:req.params.id,user: req.user });
});





router.post('/change-password/:id', async function(req, res, next) {
  try {
  //   await User.findByIdAndUpdate(req.params.id,req.body);
  // res.redirect("/signin")
    const user=await User.findById(req.params.id);
    if (user.passwordResetToken === 1) {
      await user.setPassword(req.body.password);
      user.passwordResetToken = 0;
  } else {
      res.send(
          `link expired try again <a href="/get-email">Forget Password</a>`
      );
  }
  await user.save();

  res.redirect("/signin");

  } catch (error) {
    res.send(error);
  }
});


router.get('/reset/:id',isLoggedIn, function(req, res, next) {
 res.render("reset",{title:"reset password",id:req.params.id,user: req.user})
});

router.post('/reset/:id', async function(req, res, next) {
  try {
   
    await req.user.changePassword(req.body.oldpassword, req.body.password);
    await req.user.save();
    res.redirect("/profile");
   
    
    
  } catch (error) {
    res.send(error);
  }
});



function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  res.redirect("/signin");
}


router.get("/createtodo", isLoggedIn, async function (req, res, next) {
  res.render("createtodo", {
      title: "Create Todo",
      user: req.user,
  });
});

router.post("/createtodo", isLoggedIn, async function (req, res, next) {
  try {
      const todo = new TodoModel(req.body);
      todo.user = req.user._id;
      req.user.todos.push(todo._id);
      await todo.save();
      await req.user.save();
      res.redirect("/home");
  } catch (error) {
      res.send(error);
  }
})

router.get("/deletetodo/:id",async function(req,res,next){
  try {
    await TodoModel.findByIdAndDelete(req.params.id);
    res.redirect("/home")
    
  } catch (error) {
    
  }
})


router.get("/updatetodo/:id",isLoggedIn,async function(req,res,next){
  try {
    const todo = await TodoModel.findById(req.params.id);
    res.render("updatetodo",{title:"update-todo",user:req.user,todo})
    
  } catch (error) {
    res.send(error)
  }
})

router.post("/updatetodo/:id", isLoggedIn, async function (req, res, next) {
  try {
      await TodoModel.findByIdAndUpdate(req.params.id, req.body);
      res.redirect("/home");
  } catch (error) {
      res.send(error);
  }
});
  

module.exports = router;
 