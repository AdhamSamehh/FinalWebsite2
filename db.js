const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('FinalDatabase.db');

const createUsertable = `
  CREATE TABLE IF NOT EXISTS user (
    userID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, 
    email TEXT UNIQUE NOT NULL, 
    password TEXT NOT NULL
    )`;



const createProductstable = `
   CREATE TABLE IF NOT EXISTS products (
    productID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductName TEXT NOT NULL, 
    productDescription TEXT UNIQUE, 
    price INTEGER NOT NULL,
    category TEXT NOT NULL,
    stockQuantity INTEGER NOT NULL
    )`


const createOrderstable = `
   CREATE TABLE IF NOT EXISTS order (
    orderID INTEGER PRIMARY KEY AUTOINCREMENT,
    userID INTEGER FOREIGN KEY NOT NULL, 
    productID INTEGER FOREIGN KEY NOT NULL, 
    productsQuantity INTEGER NOT NULL,
    totalAmount INTEGER NOT NULL, 
    paymentStatus INTEGER NOT NULL,
    )`;

const createCartstable = `
   CREATE TABLE IF NOT EXISTS order (
    cartID INTEGER PRIMARY KEY AUTOINCREMENT,
    userID INTEGER FOREIGN KEY NOT NULL, 
    productID INTEGER FOREIGN KEY NOT NULL, 
    productsQuantity INTEGER NOT NULL,
    totalAmount INTEGER NOT NULL, 
    )`;

const createReviewstable = `
   CREATE TABLE IF NOT EXISTS order (
    reviewID INTEGER PRIMARY KEY AUTOINCREMENT,
    userID INTEGER FOREIGN KEY NOT NULL, 
    productID INTEGER FOREIGN KEY NOT NULL, 
    comment INTEGER NOT NULL, 
    rating INTEGER NOT NULL,
    )`;



//To export all tables
module.exports = { db, createUsertable, createProductstable, createOrderstable, createCartstable, createReviewstable }