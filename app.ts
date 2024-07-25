import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';
import userRoutes from './routes/userRoutes';

const app = express();

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/bookcollection', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

app.use('/users', authRoutes);
app.use('/books', bookRoutes);
app.use('/users', userRoutes);

export default app;
