import express from "express";
import connectDB from "./config/db.js";
import routes from './routes/routes.js';

const app = express();

// DB
connectDB();

// Pug
app.set('view engine', 'pug');
app.set('views', './views');

// Public folder
app.use( express.static('public') );

app.use('/', routes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
});