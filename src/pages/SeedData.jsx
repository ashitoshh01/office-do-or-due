import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function SeedData() {
    const [status, setStatus] = useState('');

    const seed = async () => {
        try {
            setStatus('Seeding...');
            // Create "BMW" company with Codes
            // ID: bmw
            await setDoc(doc(db, "companies", "bmw"), {
                name: "BMW",
                managerCode: "ABC",
                employeeCode: "123",
                createdAt: new Date().toISOString()
            });
            setStatus('Success! Created BMW (Manager: ABC, Employee: 123)');
        } catch (error) {
            console.error(error);
            setStatus('Error: ' + error.message);
        }
    };

    return (
        <div className="p-10 text-center">
            <h1 className="text-2xl font-bold mb-4">Database Seeder</h1>
            <button
                onClick={seed}
                className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
            >
                Create "BMW" Company
            </button>
            {status && <p className="mt-4 font-mono">{status}</p>}
        </div>
    );
}
