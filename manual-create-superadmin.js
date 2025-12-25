// MANUAL SUPER ADMIN CREATION SCRIPT
// Copy and paste this into your browser console at http://localhost:5173

import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Create the super admin
createUserWithEmailAndPassword(auth, 'superadmin@primecommerce.com', 'vvvvvvvv')
    .then(async (userCredential) => {
        const user = userCredential.user;
        console.log('Firebase Auth user created with UID:', user.uid);

        // Create Firestore document
        const userRef = doc(db, 'companies', 'primecommerce', 'users', user.uid);
        const userData = {
            uid: user.uid,
            name: 'Super Admin',
            email: 'superadmin@primecommerce.com',
            role: 'admin',
            companyId: 'primecommerce',
            companyName: 'Prime Commerce',
            status: 'admin',
            isSuperAdmin: true,
            createdAt: new Date().toISOString()
        };

        await setDoc(userRef, userData);
        console.log('SUCCESS! Super Admin account created. You can now log in.');
    })
    .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
            console.log('Super Admin account already exists. You can log in now.');
        } else {
            console.error('Error:', error.message);
        }
    });
