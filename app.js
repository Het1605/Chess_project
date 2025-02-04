const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");
const { title } = require("process");

const app = express();


const server = http.createServer(app);
const io = socket(server);   // for real time communication 


const chess=new Chess(); // Chess ke jitne bhi functionality hai vo chess name ke const me ajayege.


let player = {};
let currentPlayer = "w";

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,"public")));  // isse ham static file use kar payege

app.get("/", (req, res) => {
    res.render("index", {title: "Chess Game"});
});

io.on("connection",function(uniquesocket){
    console.log("connected")

    if(!player.white){
        player.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }   else if(!player.black){
        player.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }   else{
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", function(){
        if(socket.id === player.white){
            delete player.white;
        } else if(uniquesocket.id === player.black){
            delete player.black;
        }
    });

    uniquesocket.on("move",(move)=>{
        try{
            if(chess.turn() === 'w' && uniquesocket.id!== player.white) return;
            if(chess.turn() === 'b' && uniquesocket.id!== player.black) return;

           const result = chess.move(move);

           if(result){
            currentPlayer = chess.turn();
            io.emit("move",move);
            io.emit("boardState",chess.fen())  // chess fen() board ke current state bhejega
           }

           else{
            console.log("Invalid move :",move);
            uniquesocket.emit("Invalid Move" , move)
            
           }
        }
        catch(err){
            console.log(err);
            uniquesocket.emit("Invalid Move" , move)
            
        }
    })
            
})

server.listen(3000, function(){
    console.log("listining on port 3000")
})

