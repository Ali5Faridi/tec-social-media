import express from 'express';
import "dotenv/config";
import connectDB from './config/dbConfig.js';
import mongoose from 'mongoose';
import userRoutes from './routes/api/userRoutes.js';
import cookieParser from 'cookie-parser';


const app = express();
const PORT = process.env.PORT || 8000;

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use("/user", userRoutes);

mongoose.connection.once('open', () => {
    console.log('Database connected mongoDB');
    });





app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    });


   