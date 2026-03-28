import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import "../../styles/Tasks.css";

const StatusDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const options = [
        { value: "pending", label: "Pending", color: "#64748b" },
        { value: "in_progress", label: "In Progress", color: "#0ea5e9" },
        { value: "completed", label: "Completed", color: "#10b981" },
        { value: "verified", label: "Verified", color: "#8b5cf6" },
        { value: "cancelled", label: "Cancelled", color: "#ef4444" },
    ];

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`status-custom-dropdown ${isOpen ? "open" : ""}`} ref={dropdownRef}>
            <div
                className="status-dropdown-toggle"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="status-selected">
                    <span className="status-dot" style={{ backgroundColor: selectedOption.color }}></span>
                    <span className="status-label">{selectedOption.label}</span>
                </div>
                <FiChevronDown className={`status-chevron ${isOpen ? "up" : ""}`} />
            </div>

            {isOpen && (
                <div className="status-dropdown-menu">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`status-dropdown-item ${value === option.value ? "selected" : ""}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            <span className="status-dot" style={{ backgroundColor: option.color }}></span>
                            {option.label}
                            {value === option.value && <span className="status-check">✓</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StatusDropdown;
