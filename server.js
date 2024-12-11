const express = require('express');
const server = express();
const port = 8888;
server.use(express.json());
const db_access = require('./myDB.js')
const db = db_access.db



//Register
server.post('/user/register', (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let age = req.body.age;
    if (!name || !email || !password) {
        return res.status(400).send("name, email, and password are required.");
    }
    const insertquery = `INSERT INTO USER(name, email, password) Values('${name}', '${email}', '${password}')`;
    db.run(insertquery, (err) => {
        if (err) {
            return res.status(500).send(`Error during registration: ${ err.message }`);
        } else {
            return res.status(200).send("Registration successful");
        }
    })
})


//Login
server.post('/user/login', (req, res) => {
    const email = req.body.email
    const password = req.body.password
    db.get(`SELECT * FROM USER WHERE EMAIL = '${email}' AND PASSWORD = '${password}'`, (err, row) => {
        if (err || !row)
            return res.status(401).send("Invaild Credentials!")
        else
            return res.status(200).send("Login Successful")
    })
})

//Get All Users
server.get('/users', (req, res) => {
    const getusersquery = 'SELECT * FROM user';
    db.all(getusersquery, [], (err, rows) => {
        if (err) {
            return res.status(500).send(`Error during presentation: ${ err.message }`);
        }
        if (rows.length == 0) {
            return res.send("no users found")
        } else {
            return res.status(200).json(rows);
        }
    })
})

//Add Products
server.post('/products/addproducts', (req, res) => {
    const productName = req.body.productName
    const price = parseInt(req.body.price, 10)
    const category = req.body.category
    const description = req.body.description
    const stockQuantity = parseInt(req.body.stockQuantity, 10)


    if (!productName || !price || !category || !stockQuantity) {
        return res.status(400).send("Product Name, Price, Quantity, and Category are required.");
    }
    const insertquery = `INSERT INTO products(productName, Price, category, stockQuantity) Values('${productName}', ${price},'${category}', ${stockQuantity})`;
    db.run(insertquery, (err) => {
        if (err) {
            return res.status(500).send(`Error during registration: ${ err.message }`);
        } else {
            return res.status(200).send("Product was successfully added.");
        }
    })
})

//List All Products
server.get('/products', (req, res) => {
    const getquery = 'SELECT * FROM products';
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).send(`Error during presentation: ${ err.message }`);
        }
        if (rows.length == 0) {
            return res.send("no products found")
        } else {
            return res.status(200).send("products presentation successful");
        }
    })
})

db.serialize(() => {
    db.run(db_access.createUsertable, (err) => {
        if (err) {
            console.error("Error creating user table:", err);
        } else {
            console.log("User table created successfully!");
        }
    })

    db.run(db_access.createProductstable, (err) => {
        if (err) {
            console.error("Error creating products table:", err);
        } else {
            console.log("Products table created successfully!");
        }
    })

})



server.listen(port, () => {
    console.log(`Server is listening at port ${ port }`)
});