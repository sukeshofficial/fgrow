import React from 'react';
import '../../styles/dashboard.css';
import { FaLinkedin } from 'react-icons/fa';


const ScrollingCredits = ({ className }) => {
    const credits = [
        {
            role: 'DEVELOPER, DESIGNER, TESTER',
            name: 'SUKESH (CEO & CTO)',
            linkedin: 'https://www.linkedin.com/in/sukeshd'
        },
        {
            role: 'DESIGNER, TESTER',
            name: 'PRITHIVIRAAJ (CPO)',
            linkedin: ''
        },
        {
            role: 'TESTER',
            name: 'VERAADITHYA (COO)',
            linkedin: ''
        },
    ];

    return (
        <div className={`scrolling-credits-container ${className || ''}`}>
            <div className="credits-wrapper">
                {credits.map((item, index) => (
                    <>
                        <div
                            key={index}
                            className="credit-slide"
                            style={{ animationDelay: `${index * 4}s` }}
                        >
                            <span className="credit-role">{item.role}</span>
                            <a
                                href={item.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="credit-name"
                            >
                                "{item.name} <span className='linkedin-logo'><FaLinkedin /></span>"
                            </a>
                        </div>
                    </>
                ))}
            </div>
        </div>
    );
};

export default ScrollingCredits;
