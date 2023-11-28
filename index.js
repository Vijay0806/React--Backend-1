import express from 'express';
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import { auth } from './auth.js';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import cors from "cors";
import { ObjectId } from "mongodb";

dotenv.config();
const app=express();
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;
const client = new MongoClient(MONGO_URL);
await client.connect();
console.log("MongoDB connected 🤩 ☆☆☆☆!!!!");
app.use(express.json());
app.use(express.urlencoded({extended:false}))
app.use(cors());


app.get("/", function (request, response) {
    response.send("☆☆☆☆Hi This is VIJAY 🤩 ☆☆☆☆");
  });

  const ROLE_ID={
    ADMIN:"0",
    NORMAL_USER:"1",
  };
  app.get("/movies",async(request,response)=>{
    const movies=await client.db("hacathon").collection("movies").find({}).toArray();
    response.send(movies)
  })
  app.get("/movies/:id", async (request, response) => {
    const { id } = request.params;
    const movie = await getMovieById(id)
    console.log(movie)
    movie ? response.send(movie) : response.send({ message: "MOVIE NOT FOUND" });
  });
  app.post("/movies",async(request,response)=>{
    const data=request.body;
    const result=await client.db("hacathon").collection("movies").insertMany(data)
    response.send(result)
  })
  app.delete("/movies/:id",auth,async(request,response)=>{
    const id=request.params;
    const {roleId}=request;
    // console.log(roleId)
    // console.log(id)
    if(roleId==ROLE_ID.ADMIN &&request.params){
      request.params=+request.params;
    const movies=await client.db("hacathon").collection("movies").deleteOne({_id:new ObjectId(id)});
    movies.deletedCount> 0 ?response.send({message:"Mobile deleted sucessfully"}):response.send({message:"Mobile not found"});
    console.log(id) 
  } 
    else{
       
      response.status(401).send({message:`Unauthorized`})
      
    }
  })
  app.post("/movies/:id",async(request,response)=>{
    const data=request.body;
    const result=await client.db("hacathon").collection("movies").insertMany(data)
    response.send(result)
  })
  app.post("/signup", async (request, response) => {
    const {username,password} = request.body;
    // console.log(data);
    // const movie = await postMovies(data);
    const userFromDB=await getUserByName(username);
    console.log(userFromDB);
    if(userFromDB){
      response.send({message:"username already exits"})
    }
    else if(password.length<5){
  response.send({message:"password must be at 8 character"})
    }
    else{
      const hashpassword=await generateHashPassword(password)
      const result=await createUser({
        username:username,
        password:hashpassword,
    // default all user roleId set by one
        roleId:1,
      })
       response.send(result);
    }
    
  })
  app.post("/login", async (request, response) => {
    const {username,password} = request.body;
    // console.log(data);
    // const movie = await postMovies(data);
    const userFromDB=await getUserByName(username);
    // console.log(userFromDB);
    if(!userFromDB){
      response.status(401).send({message:"Invalid data"})
    }
    else{
      const storedDBPassword=userFromDB.password;
      const isPasswordCheck=await bcrypt.compare(password,storedDBPassword)
    //   console.log(isPasswordCheck);
    
    if(isPasswordCheck){
      const token=jwt.sign({id:userFromDB._id},process.env.SECRET_KEY);
      console.log(token);
      response.send({message:"SucessFul login",token:token,roleId:userFromDB.roleId});
    }
    else{
      response.status(401).send({message:"invalid data"});
    }
  }
})

  app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));

  export async function generateHashPassword(password){
    const NO_ROUND=10;
     const salt= await bcrypt.genSalt(NO_ROUND);
     const hashpassword= await bcrypt.hash(password,salt);
     console.log(salt);
     console.log(hashpassword);
  return hashpassword;
  }
  export async function createUser(data) {
    return await client.db("hacathon").collection('datas').insertOne(data);
}
export async function getUserByName(username) {
    return await client.db("hacathon").collection("datas").findOne({username:username});
}
export async function getMovieById(id) {
    console.log(id);
    return await client
      .db("hacathon")
      .collection("movies")
      .findOne({ _id:new ObjectId(id)});
  }

  