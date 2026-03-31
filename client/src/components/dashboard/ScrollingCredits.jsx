import React from 'react';
import '../../styles/dashboard.css';

const ScrollingCredits = () => {
    const credits = [
        { role: 'DEVELOPER, DESIGNER, TESTER', name: 'SUKESH' },
        { role: 'DESIGNER, TESTER', name: 'PRITHIVIRAAJ J N' },
        { role: 'TESTER', name: 'VERAADITHYA N' },
    ];

    return (
        <div className="scrolling-credits-container">
            <div className="credits-wrapper">
                {credits.map((item, index) => (
                    <div
                        key={index}
                        className="credit-slide"
                        style={{ animationDelay: `${index * 4}s` }}
                    >
                        <span className="credit-role">{item.role}</span>
                        <span className="credit-name">"{item.name}"</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScrollingCredits;
