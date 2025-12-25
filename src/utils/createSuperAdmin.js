import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Script to create the Super Admin account
 * Email: superadmin@primecommerce.com
 * Password: vvvvvvvv
 */

async function createSuperAdmin() {
    try {
        console.log('Creating Super Admin account...');

        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            'superadmin@primecommerce.com',
            'vvvvvvvv'
        );

        const user = userCredential.user;
        console.log('Firebase Auth user created with UID:', user.uid);

        // Create Firestore user document
        const userRef = doc(db, 'companies', 'primecommerce', 'users', user.uid);
        const userData = {
            uid: user.uid,
            name: 'Super Admin',
            email: 'superadmin@primecommerce.com',
            role: 'admin',
            companyId: 'primecommerce',
            companyName: 'Prime Commerce',
            status: 'admin',
            isSuperAdmin: true,  // Special flag for super admin
            createdAt: new Date().toISOString()
        };

        await setDoc(userRef, userData);
        console.log('Firestore user document created successfully!');
        console.log('Super Admin account is ready to use.');

        return user;
    } catch (error) {
        console.error('Error creating Super Admin:', error.message);

        // If user already exists, just log it
        if (error.code === 'auth/email-already-in-use') {
            console.log('Super Admin account already exists. You can log in now.');
        } else {
            throw error;
        }
    }
}

export default createSuperAdmin;
