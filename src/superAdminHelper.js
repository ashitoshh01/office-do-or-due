import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Quick function to create super admin - call this from browser console
 * Just type: window.createSuperAdmin()
 */
window.createSuperAdmin = async function (email = 'superadmin@primecommerce.com', password = 'vvvvvvvv') {
    try {
        console.log(`Creating Super Admin account for ${email}...`);

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;
        console.log('✓ Firebase Auth user created with UID:', user.uid);

        const userRef = doc(db, 'companies', 'primecommerce', 'users', user.uid);
        const userData = {
            uid: user.uid,
            name: 'Super Admin',
            email: email,
            role: 'admin',
            companyId: 'primecommerce',
            companyName: 'Prime Commerce',
            status: 'admin',
            isSuperAdmin: true,
            createdAt: new Date().toISOString()
        };

        await setDoc(userRef, userData);
        console.log('✓ Firestore user document created');
        console.log('✓ SUCCESS! Super Admin account is ready.');
        console.log(`You can now log in with:\nEmail: ${email}\nPassword: ${password}`);

        alert('Super Admin account created successfully! You can now log in.');

        return { success: true, uid: user.uid };
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('✓ Super Admin account already exists. You can log in now.');
            alert('Super Admin account already exists with this email. You can log in now.');
        } else {
            console.error('✗ Error:', error.message);
            alert('Error: ' + error.message);
        }
        return { success: false, error: error.message };
    }
}

console.log('Super Admin helper loaded! Type window.createSuperAdmin(email, password) to create the account.');
