const jwt = require('jsonwebtoken');

module.exports.auth=async (req,res,next)=>{
    const {id}=req.params;
    const cookies = await req.cookies;
    console.log(cookies);
    if(!cookies.token){
        
        return res.redirect('/login/student');
    }
    const response = await jwt.verify(cookies.token,"thisisasecretkeyhelloonetwothreefour");

     if(response._id!=id){
        //req.flash("you do not have permission to do that")
        return res.redirect('/');
     }
    next();
     
}

