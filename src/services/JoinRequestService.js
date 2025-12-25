import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Service to handle join request operations
 */
class JoinRequestService {
    constructor() {
        this.collectionName = 'joinRequests';
    }

    /**
     * Create a new join request
     * @param {Object} requestData - The join request data
     * @param {string} requestData.name - User's full name
     * @param {string} requestData.email - User's email
     * @param {string} requestData.roleRequested - EMPLOYEE, MANAGER, or ADMIN
     * @param {string} requestData.companySlug - Company slug (e.g., 'primecommerce')
     * @param {string} [requestData.managerEmail] - Manager email (for EMPLOYEE requests)
     * @param {string} [requestData.adminEmail] - Admin email (for MANAGER requests)
     * @param {string} [requestData.superAdminEmail] - Super Admin email (for ADMIN requests)
     * @returns {Promise<string>} - The ID of the created request
     */
    async createJoinRequest(requestData) {
        console.log('Starting createJoinRequest with data:', requestData);
        // Add uid to destructuring
        const { uid, name, email, roleRequested, companySlug, managerEmail, adminEmail, superAdminEmail } = requestData;

        // Validate required fields
        if (!name || !email || !roleRequested || !companySlug) {
            console.error('Missing required fields');
            throw new Error('Missing required fields: name, email, roleRequested, companySlug');
        }

        // Validate role-specific approver emails
        if (roleRequested === 'EMPLOYEE' && !managerEmail) {
            throw new Error('Manager email is required for employee requests');
        }
        if (roleRequested === 'MANAGER' && !adminEmail) {
            throw new Error('Admin email is required for manager requests');
        }
        if (roleRequested === 'ADMIN' && !superAdminEmail) {
            throw new Error('Super Admin email is required for admin requests');
        }

        // Check if a pending request already exists for this email
        // SKIPPED: This requires read permissions which unauthenticated users don't have.
        // Duplicates will be handled by Admins during approval.
        /*
        const existingRequest = await this.getPendingRequestByEmail(email, companySlug);
        if (existingRequest) {
            throw new Error('A pending join request already exists for this email');
        }
        */

        const joinRequest = {
            ...(uid && { uid }), // Conditionally add UID if present
            name,
            email: email.toLowerCase(),
            roleRequested,
            companySlug,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            ...(managerEmail && { approverEmail: managerEmail.toLowerCase() }),
            ...(adminEmail && { approverEmail: adminEmail.toLowerCase() }),
            ...(superAdminEmail && { approverEmail: superAdminEmail.toLowerCase() })
        };

        try {
            console.log('Attempting to add document to collection:', this.collectionName);
            const docRef = await addDoc(collection(db, this.collectionName), joinRequest);
            console.log('Document written with ID: ', docRef.id);
            return docRef.id;
        } catch (e) {
            console.error('Error adding document: ', e);
            throw e;
        }
    }

    /**
     * Get a pending request by email
     * @param {string} email - User's email
     * @param {string} companySlug - Company slug
     * @returns {Promise<Object|null>} - The request data or null
     */
    async getPendingRequestByEmail(email, companySlug) {
        const q = query(
            collection(db, this.collectionName),
            where('email', '==', email.toLowerCase()),
            where('companySlug', '==', companySlug),
            where('status', '==', 'PENDING')
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            return { id: querySnapshot.docs[0].id, ...docData };
        }
        return null;
    }

    /**
     * Get all pending requests for an approver (manager/admin/superadmin)
     * @param {string} approverEmail - Approver's email
     * @returns {Promise<Array>} - Array of pending requests
     */
    async getPendingRequestsForApprover(approverEmail) {
        const q = query(
            collection(db, this.collectionName),
            where('approverEmail', '==', approverEmail.toLowerCase()),
            where('status', '==', 'PENDING')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Update request status
     * @param {string} requestId - Request document ID
     * @param {string} status - New status (APPROVED, REJECTED)
     * @returns {Promise<void>}
     */
    async updateRequestStatus(requestId, status) {
        const requestRef = doc(db, this.collectionName, requestId);
        await updateDoc(requestRef, {
            status,
            updatedAt: new Date().toISOString()
        });
    }
}

export default new JoinRequestService();
