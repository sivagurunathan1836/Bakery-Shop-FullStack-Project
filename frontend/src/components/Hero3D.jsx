
import { Link } from 'react-router-dom';
import { FiArrowRight, FiStar } from 'react-icons/fi';
import './Hero3D.css';

const Hero3D = () => {
    return (
        <section className="hero-3d">
            <div className="hero-3d-container">
                {/* Content Side */}
                <div className="hero-3d-content">
                    <div className="hero-badge wobble-vertical">
                        <FiStar /> Fresh Baked Daily
                    </div>

                    <h1 className="hero-3d-title">
                        Taste the <span className="highlight-text">Magic</span> in<br />
                        Every <span className="highlight-text">Crumble</span>
                    </h1>

                    <p className="hero-3d-description">
                        Experience an explosion of flavors with our handcrafted cakes,
                        crispy chips, and golden rolls. Baked with passion, served with love.
                    </p>

                    <div className="hero-3d-buttons">
                        <Link to="/products" className="btn btn-primary btn-lg glow-effect">
                            Shop Now <FiArrowRight />
                        </Link>
                        <Link to="/categories" className="btn btn-secondary btn-lg">
                            Explore Menu
                        </Link>
                    </div>

                    {/* Stats or Trust Markers */}
                    <div className="trust-markers">
                        <div className="marker">
                            <span className="marker-val">100%</span>
                            <span className="marker-label">Fresh</span>
                        </div>
                        <div className="marker-divider"></div>
                        <div className="marker">
                            <span className="marker-val">50+</span>
                            <span className="marker-label">Varieties</span>
                        </div>
                    </div>
                </div>

                {/* 3D Stage Side */}
                <div className="hero-3d-stage">
                    <div className="stage-lighting"></div>

                    {/* Floating Elements */}
                    <div className="floating-group">
                        <div className="float-item item-cake parallax-layer" data-speed="2">
                            <img src="/assets/hero-cake.png" alt="Delicious Chocolate Cake" />
                            <div className="item-shadow"></div>
                        </div>

                        <div className="float-item item-chips parallax-layer" data-speed="5">
                            <img src="/assets/hero-chips.png" alt="Crispy Chips" />
                            <div className="item-shadow"></div>
                        </div>

                        <div className="float-item item-rolls parallax-layer" data-speed="3">
                            <img src="/assets/hero-rolls.png" alt="Golden Rolls" />
                            <div className="item-shadow"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero3D;
