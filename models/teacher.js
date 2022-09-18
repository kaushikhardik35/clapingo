const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TeacherSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    favOf:[
        {type:Schema.Types.ObjectId,
        ref:'Student'
}]
})

module.exports = mongoose.model('Teacher',TeacherSchema);