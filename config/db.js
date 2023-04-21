import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const db = await mongoose.connect('mongodb://localhost:27017/caravans', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const url = `${db.connection.host}:${db.connection.port}`;
        console.log(`MongoDB connected on: ${url}`);

    } catch (error) {
        console.log(`error: ${error.message}`);
        process.exit(1);
    }
};


export default connectDB;