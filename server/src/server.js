import app from "./app.js";
import connectDB from './config/initDb.js'; 
import dotenv from 'dotenv';
dotenv.config();

const start = async () => {
  try {
    await connectDB(); // <- this must be awaited
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();