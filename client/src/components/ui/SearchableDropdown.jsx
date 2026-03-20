import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

const SearchableDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select...", 
  onAddNew, 
  addNewLabel = "Add New",
  isMulti = false,
  loading = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(opt => 
    opt.name?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionId) => {
    if (isMulti) {
      const newValue = Array.isArray(value) ? [...value] : [];
      const index = newValue.indexOf(optionId);
      if (index > -1) {
        newValue.splice(index, 1);
      } else {
        newValue.push(optionId);
      }
      onChange(newValue);
    } else {
      onChange(optionId);
      setIsOpen(false);
    }
    setSearch("");
  };

  const handleAddClick = () => {
    if (onAddNew) {
      onAddNew();
      setIsOpen(false);
    }
  };

  return (
    <div className={`custom-dropdown ${isOpen ? "open" : ""}`} ref={dropdownRef}>
      <div 
        className={`dropdown-toggle form-input ${isOpen ? "open" : ""} ${error ? "has-error" : ""}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="chip-container">
          {isMulti ? (
            Array.isArray(value) && value.length > 0 ? (
              value.map((id) => {
                const option = options.find((o) => o._id === id);
                const imageUrl = option?.profile_avatar?.secure_url || option?.photo?.secure_url;
                return (
                  <span key={id} className="tag-chip">
                    {imageUrl && (
                      <img 
                        src={imageUrl} 
                        alt="" 
                        style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    )}
                    {option?.name || id}
                    <button 
                      type="button" 
                      className="remove-chip"
                      onClick={(e) => { e.stopPropagation(); handleSelect(id); }}
                    >&times;</button>
                  </span>
                );
              })
            ) : (
              <span className="placeholder">{placeholder}</span>
            )
          ) : (
            <div className="selected-value-wrapper">
              {(() => {
                const selectedOpt = options.find((o) => o._id === value);
                const imageUrl = selectedOpt?.profile_avatar?.secure_url || selectedOpt?.photo?.secure_url;
                return (
                  <>
                    {imageUrl && (
                      <img 
                        src={imageUrl} 
                        alt="" 
                        className="dropdown-selected-img"
                      />
                    )}
                    <span className={value ? "selected-value" : "placeholder"}>
                      {selectedOpt?.name || placeholder}
                    </span>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        <FiChevronDown className={`chevron ${isOpen ? "up" : ""}`} />
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-search">
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="dropdown-list">
            {loading ? (
              <div className="no-options">Loading...</div>
            ) : error ? (
              <div className="no-options">Error loading options.</div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option._id}
                  className={`dropdown-item ${
                    isMulti 
                      ? (Array.isArray(value) && value.includes(option._id) ? "selected" : "") 
                      : (value === option._id ? "selected" : "")
                  }`}
                  onClick={() => handleSelect(option._id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {(option.profile_avatar?.secure_url || option.photo?.secure_url) && (
                      <img 
                        src={option.profile_avatar?.secure_url || option.photo?.secure_url} 
                        alt="" 
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    )}
                    {option.name}
                  </div>
                  {(isMulti ? (Array.isArray(value) && value.includes(option._id)) : (value === option._id)) && (
                    <span className="check-icon">✓</span>
                  )}
                </div>
              ))
            ) : (
              <div className="no-options">No options found</div>
            )}
          </div>
          {onAddNew && (
            <div className="add-new-btn" onClick={handleAddClick}>
              <span className="plus-icon">+</span> {addNewLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
