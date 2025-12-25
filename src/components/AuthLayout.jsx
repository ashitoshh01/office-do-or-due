import React from 'react';

/**
 * AuthLayout - Split screen layout for authentication pages
 * Left: Company branding and details
 * Right: Form content
 */
export default function AuthLayout({ children, companySlug = 'primecommerce' }) {
    // Company data (hardcoded for Prime Commerce - can be made dynamic later)
    const companyData = {
        primecommerce: {
            name: 'Prime Commerce',
            tagline: 'Trusted Global Partner',
            logo: '/prime-commerce-logo.png',
            contact: {
                phone: '+91 97655 78650',
                email: 'info@primecommerce.in',
                address: 'Office No 32/33, S No 39 PL 392/4, Santosh Heights, Shankar Sheth road Pune - 411037, Maharashtra, India'
            }
        }
    };

    const company = companyData[companySlug] || companyData.primecommerce;

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Company Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-800 p-12 flex-col justify-between text-white">
                <div>
                    {/* Company Logo */}
                    <div className="mb-12">
                        <img
                            src={company.logo}
                            alt={company.name}
                            className="h-16 mb-4"
                        />
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 mb-2">FOR ANY ENQUIRIES, PLEASE CALL OR EMAIL US</h3>
                            <p className="text-slate-200">
                                {company.contact.phone} | {company.contact.email}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 mb-2">OUR LOCATION</h3>
                            <p className="text-slate-200 text-sm leading-relaxed">
                                {company.contact.address}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-slate-400 text-sm">
                    © 2024 {company.name}. All rights reserved.
                </div>
            </div>

            {/* Right Side - Form Content */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}
