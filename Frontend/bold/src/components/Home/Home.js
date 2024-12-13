import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('http://localhost:4444/products');
            setProducts(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch products');
            setLoading(false);
        }
    };

    const handleBuyNow = async (productId) => {
        try {
            // Get userId from localStorage or context
            const userId = localStorage.getItem('userId');
            if (!userId) {
                alert('Please login to purchase products');
                return;
            }

            await axios.put('http://localhost:4444/products/buyNow', {
                productId,
                userId,
                quantity: 1
            });
            
            alert('Purchase successful!');
            fetchProducts(); // Refresh products list
        } catch (err) {
            alert('Failed to complete purchase');
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.ProductName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="home-container">
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="category-select"
                >
                    <option value="all">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="books">Books</option>
                    {/* Add more categories based on your database */}
                </select>
            </div>

            <div className="products-grid">
                {filteredProducts.map(product => (
                    <div key={product.productID} className="product-card">
                        <h3>{product.ProductName}</h3>
                        <p>{product.productDescription}</p>
                        <p className="price">${product.price}</p>
                        <p className="stock">In Stock: {product.stockQuantity}</p>
                        <button 
                            onClick={() => handleBuyNow(product.productID)}
                            disabled={product.stockQuantity === 0}
                            className="buy-button"
                        >
                            {product.stockQuantity === 0 ? 'Out of Stock' : 'Buy Now'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;