const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const StudentSchema = new Schema({
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
    favTeacher:[{
        type:Schema.Types.ObjectId,
        ref:'Teacher'
    }]
})

module.exports = mongoose.model('Student',StudentSchema);