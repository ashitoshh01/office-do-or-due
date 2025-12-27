import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import {
    doc,
    setDoc,
    getDoc,
    query,
    where,
    getDocs,
    collection,
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

    // Helper: Verify Access Code (Global Search)
    async function verifyAccessCode(accessCode) {
        if (!accessCode) throw new Error("Access Code is required");

        // Sanitize: remove spaces and force uppercase (since all our generated keys are UPPERCASE)
        const cleanCode = accessCode.trim().toUpperCase();
        console.log(`Verifying Access Code: '${cleanCode}'`);

        // 1. Check if it's a Manager Code
        try {
            const qManager = query(collection(db, "companies"), where("managerCode", "==", cleanCode));
            const snapManager = await getDocs(qManager);

            if (!snapManager.empty) {
                const doc = snapManager.docs[0];
                console.log("Found Manager Code for:", doc.id);
                return { role: 'manager', companyId: doc.id, companyName: doc.data().name };
            }

            // 2. Check if it's an Employee Code
            const qEmployee = query(collection(db, "companies"), where("employeeCode", "==", cleanCode));
            const snapEmployee = await getDocs(qEmployee);

            if (!snapEmployee.empty) {
                const doc = snapEmployee.docs[0];
                console.log("Found Employee Code for:", doc.id);
                return { role: 'employee', companyId: doc.id, companyName: doc.data().name };
            }
        } catch (error) {
            console.error("Firestore Query Error:", error);
            throw new Error("Database connection failed during verification.");
        }

        console.warn("No company matches this code.");
        throw new Error("Invalid Access Code. Please check with your administrator.");
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
    async function signup(email, password, name, accessCode, expectedCompanyId = null) {
        // Verify code
        const { role, companyId, companyName } = await verifyAccessCode(accessCode);

        // Security Check: Ensure key matches the company URL
        if (expectedCompanyId && companyId !== expectedCompanyId) {
            throw new Error(`This License Key belongs to '${companyName}', but you are trying to register for '${expectedCompanyId}'. Please check your URL or Key.`);
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await createUserProfile(user.uid, name, email, companyId, companyName, role);
        return userCredential;
    }

    // NEW: Link Existing User to Company
    async function joinCompany(email, password, accessCode, expectedCompanyId = null) {
        // 1. Verify credentials by signing in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Verify Code
        const { role, companyId, companyName } = await verifyAccessCode(accessCode);

        if (expectedCompanyId && companyId !== expectedCompanyId) {
            throw new Error(`Key mismatch: expected ${expectedCompanyId} but key is for ${companyName}`);
        }

        // 3. Create Profile for this company
        // Note: We use existing user's display name if available, or just email
        await createUserProfile(user.uid, user.displayName || email.split('@')[0], email, companyId, companyName, role);

        return userCredential;
    }

    // Login function with company and role validation
    async function login(email, password, companySlug, expectedRole = null) {
        // First authenticate with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch user profile to validate company and role
        const usersQuery = query(
            collectionGroup(db, "users"),
            where("uid", "==", user.uid)
        );

        const querySnapshot = await getDocs(usersQuery);

        if (querySnapshot.empty) {
            // User doesn't have a profile - they weren't approved yet
            await signOut(auth);
            throw new Error("No account found. Please wait for your join request to be approved.");
        }

        const userData = querySnapshot.docs[0].data();

        // Validate company (only if strict validation is requested)
        if (companySlug && userData.companyId !== companySlug) {
            await signOut(auth);
            throw new Error("Invalid company credentials");
        }

        // Check if user is active
        // We use a deny-list approach to allow various work statuses (e.g. 'requesting_task', 'busy')
        if (userData.status === 'inactive' || userData.status === 'banned') {
            await signOut(auth);
            throw new Error("Your account is not active. Please contact your administrator.");
        }

        // If expectedRole is provided, validate it matches
        if (expectedRole && userData.role !== expectedRole) {
            // Don't sign out - just let the redirect handle it
            console.log(`User role (${userData.role}) doesn't match expected (${expectedRole}), will redirect`);
        }

        return userCredential;
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
        login,
        joinCompany,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
