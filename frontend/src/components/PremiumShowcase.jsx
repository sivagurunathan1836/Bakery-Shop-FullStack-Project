
import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import './PremiumShowcase.css';

const products = [
    {
        id: 'p1',
        name: 'Royal Chocolate Truffle',
        desc: 'Rich dark chocolate ganache layers',
        price: '₹120',
        image: '/assets/product-truffle.png',
        tag: 'Bestseller'
    },
    {
        id: 'p2',
        name: 'Classic Black Forest',
        desc: 'Fresh cream & cherries on fluffy sponge',
        price: '₹110',
        image: '/assets/product-blackforest.png',
        tag: 'New'
    },
    {
        id: 'p3',
        name: 'Crispy Salted Chips',
        desc: 'Golden fried, perfectly seasoned chips',
        price: '₹60',
        image: '/assets/product-chips.png',
        tag: 'Crunchy'
    },
    {
        id: 'p4',
        name: 'Golden Veg Roll',
        desc: 'Flaky puff pastry with spiced filling',
        price: '₹35',
        image: '/assets/product-vegroll.png',
        tag: 'Hot'
    }
];

const PremiumShowcase = () => {
    return (
        <section className="premium-section">
            <div className="container">
                <div className="section-header text-center">
                    <span className="section-subtitle">Specials</span>
                    <h2 className="section-title">Todays Premium Picks</h2>
                    <p className="section-description">
                        Indulge in our chef's exclusively curated selection of the day.
                    </p>
                </div>

                <div className="premium-grid">
                    {products.map((item) => (
                        <div key={item.id} className="premium-card">
                            <div className="premium-image-wrapper">
                                <img src={item.image} alt={item.name} />
                                <span className="premium-tag">{item.tag}</span>
                            </div>
                            <div className="premium-content">
                                <h3>{item.name}</h3>
                                <p>{item.desc}</p>
                                <div className="premium-footer">
                                    <span className="price">{item.price}</span>
                                    <button className="add-btn">
                                        <FiShoppingBag /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PremiumShowcase;
