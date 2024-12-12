const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken')
const server = express();
const bcrypt = require('bcryptjs')
const port = 4444;
const db_access = require('./db.js')
const db = db_access.db
const cookieParser = require('cookie-parser')
server.use(cors({
    origin: "https://localhost:4444",
    credentials: true
}))
server.use(express.json());
server.use(cookieParser())

//Generate Token
const generateToken = (id, isAdmin) => {
    return jwt.sign({ id, isAdmin }, secret_key, { expiresIn: '1h' })
}

const verifyToken = (req, res, next) => {
    if (!token)
        return res.status(401).send('Unauthorized')
    jwt.verify(token, secret_key, (err, details) => {
        if (err)
            return res.status((403).send('invalid or expired token'))
        req.userDetails = details
        next()
    })
}

function verifyAdminToken(req, res, next) {
    const token = req.cookies.authToken; // Assuming token is sent via cookies

    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
            return res.status(403).send("Invalid or expired token.");
        }

        // Check if the user is an admin
        if (decoded.role !== 'admin') {
            return res.status(403).send("Access denied. You are not an admin.");
        }

        // Attach user information to the request object
        req.user = decoded;
        next(); // Continue to the route handler
    });
}
// Admin Registration Route
server.post('/admin/register', async(req, res) => {
    const { username, email, password, } = req.body;

    if (!username || !password || !email) {
        return res.status(400).send("Missing required fields: username, password.");
    }

    // Check if username already exists
    const checkUserQuery = `SELECT * FROM admins WHERE username = ?`;
    db.get(checkUserQuery, [username], async(err, row) => {
        if (err) {
            return res.status(500).send("Error checking username: " + err.message);
        } else if (row) {
            return res.status(400).send("Username already exists.");
        }
        const checkEmailQuery = `SELECT * FROM admins WHERE email = ?`;
        db.get(checkEmailQuery, [email], async(err, row) => {
            if (err) {
                return res.status(500).send("Error checking email: " + err.message);
            } else if (row) {
                return res.status(400).send("Email already exists.");
            }

            // Hash password
            const bcrypt = require('bcryptjs');
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const insertQuery = `INSERT INTO admins (username,email, password) VALUES (?, ?,?)`;

            db.run(insertQuery, [username, email, hashedPassword], function(err) {
                if (err) {
                    return res.status(500).send("Error registering admin: " + err.message);
                }
                return res.status(201).json({
                    message: "Admin registered successfully.",
                    userID: this.lastID,
                    username: username
                });
            });
        });
    });
});

server.post('/admin/login', (req, res) => {
    const { username, email, password } = req.body;

    if (!username && !email || !password) {
        return res.status(400).send("Missing required fields: username/email and password.");
    }

    let query;
    let queryParams;

    if (username) {
        query = `SELECT * FROM admins WHERE username = ?`;
        queryParams = [username];
    } else if (email) {
        query = `SELECT * FROM admins WHERE email = ?`;
        queryParams = [email];
    }

    db.get(query, queryParams, async(err, row) => {
        if (err) {
            return res.status(500).send("Error retrieving admin: " + err.message);
        } else if (!row) {
            return res.status(404).send("Username or Email not found.");
        }

        const bcrypt = require('bcryptjs');
        const passwordMatch = await bcrypt.compare(password, row.password);

        if (!passwordMatch) {
            return res.status(401).send("Incorrect password.");
        }

        // Generate a token (optional, if you're using JWT for authentication)
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ adminID: row.adminID }, 'your_secret_key', { expiresIn: '1h' });

        return res.status(200).json({
            message: "Login successful.",
            token: token
        });
    });
});


//User Register
server.post('/user/register', (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    // Validation of Inputs
    if (!username || !email || !password) {
        return res.status(400).send("username, email, and password are required.");
    }

    // Hashing the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send("Error hashing the password: " + err.message);
        }

        // Insert into the database
        const insertQuery = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
        db.run(insertQuery, [username, email, hashedPassword], function(err) {
            if (err) {
                return res.status(500).send(`Error during registration: ${err.message}`);
            } else {
                return res.status(200).send("Registration successful");
            }
        });
    });
});

//Login
server.post('/user/login', (req, res) => {
    const { username, email, password } = req.body;

    if (!username && !email || !password) {
        return res.status(400).send("Missing required fields: username/email and password.");
    }

    let query;
    let queryParams;

    if (username) {
        query = `SELECT * FROM users WHERE username = ?`;
        queryParams = [username];
    } else if (email) {
        query = `SELECT * FROM users WHERE email = ?`;
        queryParams = [email];
    }

    db.get(query, queryParams, async(err, row) => {
        if (err) {
            return res.status(500).send("Error retrieving user: " + err.message);
        } else if (!row) {
            return res.status(404).send("Username or Email not found.");
        }

        const bcrypt = require('bcryptjs');
        const passwordMatch = await bcrypt.compare(password, row.password);

        if (!passwordMatch) {
            return res.status(401).send("Incorrect password.");
        }

        // Generate a token (optional, if you're using JWT for authentication)
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ userID: row.userID, role: row.role }, 'your_secret_key', { expiresIn: '1h' });

        return res.status(200).json({
            message: "Login successful.",
            token: token
        });
    });
});

server.get('/users', (req, res) => {
    const getusersquery = 'SELECT * FROM users'; // Make sure you reference 'users' table correctly
    db.all(getusersquery, [], (err, rows) => {
        if (err) {
            return res.status(500).send(`Error during presentation: ${ err.message }`);
        }
        if (rows.length == 0) {
            return res.send("No users found");
        } else {
            return res.status(200).json(rows);
        }
    });
});

// Add Products
server.post('/products/add', (req, res) => {
    const productName = req.body.productName;
    const price = parseFloat(req.body.price);
    const category = req.body.category;
    const description = req.body.description;
    const stockQuantity = parseInt(req.body.stockQuantity, 10);
    // Validate input fields
    if (!productName || !price || !category || !stockQuantity) {
        return res.status(400).send("Product Name, Price, Category, and Stock Quantity are required.");
    }
    const insertQuery = `INSERT INTO PRODUCTS (productName, price, category, productDescription, stockQuantity) VALUES (?, ?, ?, ?, ?)`;
    db.run(insertQuery, [productName, price, category, description, stockQuantity], (err) => {
        if (err) {
            return res.status(500).send("Error adding product: " + err.message);
        }
        return res.status(200).send("Product added successfully.");
    });
});

// List All Products
server.get('/products', (req, res) => {
    const query = 'SELECT * FROM PRODUCTS';
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).send("Error retrieving products: " + err.message);
        }
        if (rows.length === 0) {
            return res.status(404).send("No products found.");
        }
        return res.status(200).json(rows);
    });
});

// Search for a Product by ID
server.get('/products/search/:id', (req, res) => {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
        return res.status(400).send("Invalid product ID.");
    }
    const query = `SELECT * FROM PRODUCTS WHERE productID = ?`;
    db.get(query, [productId], (err, row) => {
        if (err) {
            return res.status(500).send("Error retrieving product: " + err.message);
        } else if (!row) {
            return res.status(404).send(`Product with ID ${productId} not found.`);
        }
        return res.status(200).json(row);
    });
});


// Search for Products
server.get('/products/search', (req, res) => {
    const { productName, category, quantity } = req.query;
    let query = `SELECT * FROM PRODUCTS WHERE 1=1`;
    if (productName) {
        query += ` AND productName LIKE ?`;
    }
    if (category) {
        query += ` AND category = ?`;
    }
    if (quantity) {
        query += ` AND stockQuantity >= ?`;
    }
    const params = [];
    if (productName) {
        params.push(`%${productName}%`);
    }
    if (category) {
        params.push(category);
    }
    if (quantity) {
        params.push(parseInt(quantity, 10));
    }
    db.all(query, params, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error searching for products: " + err.message);
        } else {
            return res.status(200).json(rows);
        }
    });
});

//create orders
server.put('/products/buyNow', (req, res) => {
    const { productId, userId, quantity } = req.body;
    if (!productId || !userId || !quantity) {
        return res.status(400).send("Product ID, User ID, and Quantity are required.");
    }
    const query = `SELECT * FROM PRODUCTS WHERE productID = ?`;
    db.get(query, [productId], (err, row) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error retrieving product: " + err.message);
        }
        if (!row) {
            return res.status(404).send(`Product with ID ${productId} not found.`);
        }
        if (row.stockQuantity < quantity) {
            return res.status(400).send("Insufficient stock available.");
        }
        const updatedQuantity = row.stockQuantity - quantity;
        const totalAmount = row.price * quantity; // Assuming `price` is a column in `PRODUCTS`
        // Insert the order into the `orders` table
        const insertQuery = `INSERT INTO orders (userID, productID, productsQuantity, totalAmount, paymentStatus) VALUES (?, ?, ?, ?, ?)`;
        db.run(insertQuery, [userId, productId, quantity, totalAmount, 0], (err) => { // Assuming 0 is for "pending" payment status
            if (err) {
                console.log(err);
                return res.status(500).send("Error recording order: " + err.message);
            }
            // Update the stock in the `PRODUCTS` table
            const updateQuery = `UPDATE PRODUCTS SET stockQuantity = ? WHERE productID = ?`;
            db.run(updateQuery, [updatedQuantity, productId], (err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Error updating product stock: " + err.message);
                }
                return res.status(200).send("Product purchased successfully.");
            });
        });
    });
});


// Add a Review for a Product
server.post('/reviews/add', (req, res) => {
    const { userID, productID, comment, rating } = req.body;
    if (!userID || !productID || !comment || !rating) {
        return res.status(400).send("Missing required fields.");
    }
    const query = `INSERT INTO reviews (userID, productID, comment, rating) 
                   VALUES (?, ?, ?, ?)`;
    db.run(query, [userID, productID, comment, rating], function(err) {
        if (err) {
            return res.status(500).send("Error adding review: " + err.message);
        }
        return res.status(201).json({
            message: "Review added successfully.",
            review: {
                reviewID: this.lastID,
                userID: userID,
                productID: productID,
                comment: comment,
                rating: rating
            }
        });
    });
});

// View All Reviews for a Product
server.get('/reviews/product/:productID', (req, res) => {
    const productID = parseInt(req.params.productID, 10);
    if (isNaN(productID)) {
        return res.status(400).send("Invalid product ID.");
    }
    const query = `SELECT * FROM reviews WHERE productID = ?`;

    db.all(query, [productID], (err, rows) => {
        if (err) {
            return res.status(500).send("Error retrieving reviews: " + err.message);
        } else if (rows.length === 0) {
            return res.status(404).send(`No reviews found for product with ID ${productID}.`);
        }
        return res.status(200).json({ reviews: rows });
    });
});

// View All Reviews by a User
server.get('/reviews/user/:userID', (req, res) => {
    const userID = parseInt(req.params.userID, 10);
    if (isNaN(userID)) {
        return res.status(400).send("Invalid user ID.");
    }
    const query = `SELECT * FROM reviews WHERE userID = ?`;
    db.all(query, [userID], (err, rows) => {
        if (err) {
            return res.status(500).send("Error retrieving reviews: " + err.message);
        } else if (rows.length === 0) {
            return res.status(404).send(`No reviews found for user with ID ${userID}.`);
        }
        return res.status(200).json({ reviews: rows });
    });
});

// Update a Review
server.put('/reviews/update/:reviewID', (req, res) => {
    const { comment, rating } = req.body;
    const reviewID = parseInt(req.params.reviewID, 10);

    if (isNaN(reviewID) || !comment || !rating) {
        return res.status(400).send("Missing required fields.");
    }
    const query = `UPDATE reviews SET comment = ?, rating = ? WHERE reviewID = ?`;
    db.run(query, [comment, rating, reviewID], function(err) {
        if (err) {
            return res.status(500).send("Error updating review: " + err.message);
        } else if (this.changes === 0) {
            return res.status(404).send("Review not found.");
        }
        return res.status(200).json({
            message: "Review updated successfully.",
            review: {
                reviewID: reviewID,
                comment: comment,
                rating: rating
            }
        });
    });
});

// Delete a Review
server.delete('/reviews/delete/:reviewID', (req, res) => {
    const reviewID = parseInt(req.params.reviewID, 10);
    if (isNaN(reviewID)) {
        return res.status(400).send("Invalid review ID.");
    }
    const query = `DELETE FROM reviews WHERE reviewID = ?`;
    db.run(query, [reviewID], function(err) {
        if (err) {
            return res.status(500).send("Error deleting review: " + err.message);
        } else if (this.changes === 0) {
            return res.status(404).send("Review not found.");
        }
        return res.status(200).json({
            message: "Review deleted successfully."
        });
    });
});




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
    db.run(db_access.createOrderstable, (err) => {
        if (err) {
            console.error("Error creating products table:", err);
        } else {
            console.log("Orders table created successfully!");
        }
    })

    db.run(db_access.createReviewstable, (err) => {
        if (err) {
            console.error("Error creating products table:", err);
        } else {
            console.log("Reviews table created successfully!");
        }
    })
    db.run(db_access.createAdminstable, (err) => {
        if (err) {
            console.error("Error creating products table:", err);
        } else {
            console.log("Admins table created successfully!");
        }
    })
})

server.listen(port, () => {
    console.log(`Server is listening at port ${ port }`)
});