import { Request, Response } from 'express';
import { Book } from '../models/Book';

export const addBook = async (req: Request, res: Response) => {
  const { title, author, publicationDate, genres } = req.body;
  const book = new Book({ title, author, publicationDate, genres });
  await book.save();
  res.status(201).send(book);
};

export const getBooks = async (req: Request, res: Response) => {
  const books = await Book.find();
  res.send(books);
};

export const getBookById = async (req: Request, res: Response) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).send({ error: 'Book not found.' });
  }
  res.send(book);
};

export const updateBook = async (req: Request, res: Response) => {
  const { title, author, publicationDate, genres } = req.body;
  const book = await Book.findByIdAndUpdate(req.params.id, { title, author, publicationDate, genres }, { new: true });
  if (!book) {
    return res.status(404).send({ error: 'Book not found.' });
  }
  res.send(book);
};

export const deleteBook = async (req: Request, res: Response) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) {
    return res.status(404).send({ error: 'Book not found.' });
  }
  res.send({ message: 'Book deleted successfully.' });
};
