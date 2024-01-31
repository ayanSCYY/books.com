const mongoose=require("mongoose");

mongoose.connect("mongodb://localhost:27017");

const UserSchema=new mongoose.Schema({
    username:String,
    password:String,

})
const BookSchema=new mongoose.Schema({
    Bookname:String,
    author:String,
    price_1_5:Number,
    availablestock: {
        type: Number,
        default: 1},
    //image:URL,
    bookpostedby:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    }],
    bookspostedby:[{
         type:mongoose.Schema.Types.ObjectId,
         ref:'user'
    }]
})

const user=mongoose.model('user',UserSchema);
const books=mongoose.model('Books',BookSchema);

module.exports = {
    user,
    books
}
