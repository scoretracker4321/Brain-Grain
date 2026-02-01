// Brain Grain Platform - Core Utilities (Optimized)
window.CoreUtils = (function() {
    'use strict';

    // DOM helpers
    const $ = (selector, parent = document) => parent.querySelector(selector);
    const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
    const create = (tag, props = {}, ...children) => {
        const el = document.createElement(tag);
        Object.entries(props).forEach(([key, value]) => {
            if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else if (key === 'className') {
                el.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else {
                el[key] = value;
            }
        });
        children.forEach(child => {
            el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
        });
        return el;
    };

    // Debounce utility
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Validation helpers
    const validators = {
        email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        phone: (phone) => /^[0-9]{10}$/.test(phone),
        name: (name) => name && name.trim().length >= 2,
        required: (value) => value !== null && value !== undefined && value.toString().trim() !== ''
    };

    const validateField = (input, rules) => {
        const value = input.value.trim();
        const errors = [];
        
        rules.forEach(rule => {
            if (typeof rule === 'function') {
                const result = rule(value);
                if (result !== true) errors.push(result);
            } else if (validators[rule] && !validators[rule](value)) {
                errors.push(`Invalid ${rule}`);
            }
        });
        
        const errorElement = input.nextElementSibling?.classList.contains('error-message') 
            ? input.nextElementSibling 
            : null;
        
        if (errors.length > 0) {
            input.classList.add('error');
            input.classList.remove('valid');
            if (errorElement) {
                errorElement.textContent = errors[0];
                errorElement.classList.remove('hidden');
            }
            return false;
        } else {
            input.classList.remove('error');
            input.classList.add('valid');
            if (errorElement) errorElement.classList.add('hidden');
            return true;
        }
    };

    // Modal management
    const openModal = (modalId) => {
        const modal = $(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };

    const closeModal = (modalId) => {
        const modal = $(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    // Tab management
    const switchTab = (tabName) => {
        $$('.tab-content').forEach(content => content.classList.remove('active'));
        $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
        
        const activeContent = $(`#${tabName}Tab`);
        const activeBtn = $(`[data-tab="${tabName}"]`);
        
        if (activeContent) activeContent.classList.add('active');
        if (activeBtn) activeBtn.classList.add('active');
    };

    // Toast notifications
    const showToast = (message, type = 'success', duration = 3000) => {
        const toast = create('div', {
            className: `toast toast-${type}`,
            style: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '16px 24px',
                borderRadius: '8px',
                background: type === 'success' ? '#22c55e' : '#ef4444',
                color: 'white',
                zIndex: '9999',
                animation: 'slideIn 0.3s ease'
            }
        }, message);
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    // Loading state
    const showLoading = (target) => {
        if (typeof target === 'string') target = $(target);
        if (!target) return;
        
        const spinner = create('div', { className: 'spinner' });
        target.innerHTML = '';
        target.appendChild(spinner);
    };

    // Format utilities
    const formatDate = (date) => {
        if (!(date instanceof Date)) date = new Date(date);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        if (!(date instanceof Date)) date = new Date(date);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    // Export public API
    return {
        $, $$, create,
        debounce,
        validators, validateField,
        openModal, closeModal,
        switchTab,
        showToast,
        showLoading,
        formatDate, formatTime,
        capitalize
    };
})();
