import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import {
    doc,
    setDoc,
    getDoc,
    query,
    where,
    getDocs,
    collectionGroup
} from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null); // Stores role, company, etc.
    const [loading, setLoading] = useState(true);

    // Helper: Verify Access Code
    async function verifyAccessCode(companyName, accessCode) {
        if (!companyName || !accessCode) throw new Error("Company Name and Access Code are required");

        const cleanCode = accessCode.trim();
        const companyId = companyName.trim().toLowerCase().replace(/\s+/g, '-');

        const companyRef = doc(db, "companies", companyId);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
            throw new Error(`Company "${companyName}" not found. Please register the company first.`);
        }

        const data = companySnap.data();
        let role = '';

        console.log(`Verifying Code: Input="${cleanCode}", Manager="${data.managerCode}", Employee="${data.employeeCode}"`);

        // Check codes (case-sensitive)
        if (cleanCode === data.managerCode) {
            role = 'manager';
        } else if (cleanCode === data.employeeCode) {
            role = 'employee';
        } else {
            throw new Error("Invalid Access Code");
        }

        return { role, companyId };
    }

    // Helper to create profile in Firestore
    async function createUserProfile(uid, name, email, companyId, companyName, role) {
        const userRef = doc(db, "companies", companyId, "users", uid);
        const userData = {
            uid,
            name,
            email,
            role,
            companyId,
            companyName,
            status: role === 'employee' ? 'active' : 'admin', // Default status
            createdAt: new Date().toISOString()
        };

        await setDoc(userRef, userData);
        setUserProfile(userData);
    }

    // Signup function
    async function signup(email, password, name, companyName, accessCode) {
        // Verify code BEFORE creating auth user to prevent ghost accounts
        const { role, companyId } = await verifyAccessCode(companyName, accessCode);

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await createUserProfile(user.uid, name, email, companyId, companyName, role);
        return userCredential;
    }

    // Login function
    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Google Sign In
    function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    // Complete Profile (for Google Users)
    async function completeProfile(companyName, accessCode) {
        if (!currentUser) throw new Error("No user logged in");

        const { role, companyId } = await verifyAccessCode(companyName, accessCode);

        await createUserProfile(currentUser.uid, currentUser.displayName, currentUser.email, companyId, companyName, role);
    }

    // Logout function
    function logout() {
        setUserProfile(null);
        return signOut(auth);
    }

    // Fetch user profile on auth state change
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                setLoading(true);
                try {
                    // We need to find the user's document. Since it's nested under a variable companyId,
                    // we use a Collection Group Query to search all 'users' subcollections.
                    const usersQuery = query(
                        collectionGroup(db, "users"),
                        where("uid", "==", user.uid)
                    );

                    const querySnapshot = await getDocs(usersQuery);

                    if (!querySnapshot.empty) {
                        // Should be unique, so just take the first one
                        const userDoc = querySnapshot.docs[0];
                        const userData = userDoc.data();

                        // Update lastLoginAt (Fail gracefully if permissions/rules not yet propagated)
                        try {
                            await setDoc(userDoc.ref, { lastLoginAt: new Date().toISOString() }, { merge: true });
                        } catch (e) {
                            console.warn("Could not update lastLoginAt. Check Firestore Rules for collection group writes.", e);
                        }

                        setUserProfile(userData);
                    } else {
                        console.log("User document not found in Firestore (New Google User?)");
                        setUserProfile(null); // This signifies profile is incomplete
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                }
                setLoading(false);
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        signup,
        login,
        signInWithGoogle,
        completeProfile,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
