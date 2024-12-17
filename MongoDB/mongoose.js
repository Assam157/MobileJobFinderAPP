const mongoose = require("mongoose");

mongoose.connect(
    "mongodb+srv://Maitreya:killdill12@cluster0.sk6ugig.mongodb.net/UserModelBlendVidya?retryWrites=true&w=majority&tls=true", 
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
)
.then(() => console.log("Connected to MongoDB!"))
.catch(err => console.error("Connection error:", err));
