import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, getDocs, doc, updateDoc, addDoc, orderBy, increment, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

// --- Helpers ---
const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

// --- Hooks ---

// 1. Fetch Tasks (Employee View)
export function useTasks(userProfile) {
    return useQuery({
        queryKey: ['tasks', userProfile?.uid],
        queryFn: async () => {
            if (!userProfile?.companyId || !userProfile?.uid) return [];
            const activitiesRef = collection(db, "companies", userProfile.companyId, "users", userProfile.uid, "activities");
            const q = query(activitiesRef, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        enabled: !!userProfile?.uid,
    });
}

// 2. Fetch Employees (Manager View)
export function useEmployees(userProfile) {
    return useQuery({
        queryKey: ['employees', userProfile?.companyId],
        queryFn: async () => {
            if (!userProfile?.companyId) return [];
            const usersRef = collection(db, "companies", userProfile.companyId, "users");
            const snapshot = await getDocs(usersRef);
            const empList = snapshot.docs.map(doc => doc.data()).filter(u => u.role !== 'manager');

            // Sorting Logic
            return empList.sort((a, b) => {
                // Priority 1: Requesting Task (Active Status)
                if (a.status === 'requesting_task' && b.status !== 'requesting_task') return -1;
                if (b.status === 'requesting_task' && a.status !== 'requesting_task') return 1;

                // Priority 2: Pending Verifications (Red Dot logic)
                const pendingA = a.pendingTaskCount || 0;
                const pendingB = b.pendingTaskCount || 0;
                if (pendingA !== pendingB) return pendingB - pendingA;

                // Priority 3: Status Score
                const statusScore = (status) => {
                    if (status === 'available') return 3;
                    if (status === 'busy') return 2;
                    return 1;
                };
                return statusScore(b.status) - statusScore(a.status);
            });
        },
        enabled: !!userProfile?.companyId,
        refetchInterval: 10000, // Poll every 10s for status updates/notifications
    });
}

// 3. Fetch Specific Employee Tasks (Manager View)
export function useEmployeeTasks(userProfile, selectedEmployeeId) {
    return useQuery({
        queryKey: ['tasks', selectedEmployeeId],
        queryFn: async () => {
            if (!userProfile?.companyId || !selectedEmployeeId) return [];
            const activitiesRef = collection(db, "companies", userProfile.companyId, "users", selectedEmployeeId, "activities");
            const q = query(activitiesRef, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        enabled: !!userProfile?.companyId && !!selectedEmployeeId,
    });
}

// 3.5 Fetch Leaderboard
export function useLeaderboard(userProfile) {
    return useQuery({
        queryKey: ['leaderboard', userProfile?.companyId],
        queryFn: async () => {
            if (!userProfile?.companyId) return [];
            const usersRef = collection(db, "companies", userProfile.companyId, "users");
            const snapshot = await getDocs(usersRef);

            // Client-side sort is safer for small datasets than requiring a composite index immediately
            const allUsers = snapshot.docs.map(doc => doc.data()).filter(u => u.role !== 'manager');
            const sortedUsers = allUsers.sort((a, b) => {
                const pointsA = a.pointsStats?.totalEarned || 0;
                const pointsB = b.pointsStats?.totalEarned || 0;
                return pointsB - pointsA;
            });

            return sortedUsers; // Return all employees sorted by points
        },
        enabled: !!userProfile?.companyId,
    });
}


// --- Mutations ---

// 4. Update User Status (Request Work)
export function useUpdateUserStatus(userProfile) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ newStatus }) => {
            const userRef = doc(db, "companies", userProfile.companyId, "users", userProfile.uid);
            await updateDoc(userRef, { status: newStatus });
            return newStatus;
        },
        onMutate: async ({ newStatus }) => {
            // Optimistically update UI
            return { previousStatus: userProfile.status, newStatus };
        },
        onSuccess: (newStatus) => {
            toast.success(newStatus === 'requesting_task' ? "Work requested successfully!" : "Request cancelled.");
            queryClient.invalidateQueries(['employees', userProfile.companyId]);
        },
        onError: (error) => {
            console.error(error);
            toast.error("Failed to update status");
        }
    });
}

// 5. Upload Proof
export function useUploadProof(userProfile) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, uploadPayload }) => {
            const { type, data } = uploadPayload;
            let proofData = null;

            if (type === 'file') {
                const MAX_SIZE = 700 * 1024; // 700KB - Safe for Firestore with Base64 encoding
                if (data.size > MAX_SIZE) {
                    throw new Error(`File too large! Max ${(MAX_SIZE / 1024).toFixed(0)}KB allowed.`);
                }
                proofData = await convertToBase64(data);
            } else {
                proofData = data;
            }

            // 1. Update Task
            const taskRef = doc(db, "companies", userProfile.companyId, "users", userProfile.uid, "activities", taskId);
            await updateDoc(taskRef, {
                status: 'verification_pending',
                proofUrl: proofData,
                proofType: type,
                completedAt: new Date().toISOString()
            });

            // 2. Increment Pending Task Count for Manager Notification
            const userRef = doc(db, "companies", userProfile.companyId, "users", userProfile.uid);
            await updateDoc(userRef, {
                pendingTaskCount: increment(1)
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['tasks', userProfile.uid]);
            toast.success("Proof submitted successfully!");
        },
        onError: (error) => {
            console.error(error);
            toast.error(error.message || "Failed to submit proof");
        }
    });
}

// 6. Assign Task
export function useAssignTask(userProfile) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ employeeId, taskData }) => {
            // Validate userProfile
            if (!userProfile?.companyId || !userProfile?.uid) {
                throw new Error('User profile not loaded. Please refresh the page.');
            }

            // 1. Add Task
            const activitiesRef = collection(db, "companies", userProfile.companyId, "users", employeeId, "activities");
            await addDoc(activitiesRef, {
                ...taskData,
                points: taskData.points, // Points instead of Amount
                deadline: taskData.deadline || null, // NEW: Deadline
                status: 'assigned',
                assignedBy: userProfile.uid,
                createdAt: new Date().toISOString()
            });

            // 2. Update User Status
            const userRef = doc(db, "companies", userProfile.companyId, "users", employeeId);
            await updateDoc(userRef, {
                status: 'busy',
                lastAssignedAt: new Date().toISOString()
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['tasks', variables.employeeId]);
            queryClient.invalidateQueries(['employees', userProfile?.companyId]);
            toast.success("Task Assigned Successfully!");
        },
        onError: (error) => {
            console.error(error);
            toast.error(error.message || "Failed to assign task");
        }
    });
}

// 7. Verify Task
export function useVerifyTask(userProfile) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ employeeId, taskId, status, points, rejectionMessage }) => {
            const taskRef = doc(db, "companies", userProfile.companyId, "users", employeeId, "activities", taskId);

            const updateData = {
                status: status,
                verifiedAt: new Date().toISOString(),
                verifiedBy: userProfile.uid
            };

            // Add rejection message if rejecting
            if (status === 'rejected' && rejectionMessage) {
                updateData.rejectionMessage = rejectionMessage;
            }

            await updateDoc(taskRef, updateData);

            const userRef = doc(db, "companies", userProfile.companyId, "users", employeeId);

            // Updates to User Profile
            const updates = {
                // Decrement pending count since it's verified (or rejected)
                pendingTaskCount: increment(-1)
            };

            // Points Logic
            if (status === 'verified') {
                updates["pointsStats.totalEarned"] = increment(points);
                updates["pointsStats.currentBalance"] = increment(points);
            }

            await updateDoc(userRef, updates);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['tasks', variables.employeeId]);
            queryClient.invalidateQueries(['employees', userProfile.companyId]);
            queryClient.invalidateQueries(['leaderboard', userProfile.companyId]);
            toast.success(`Task ${variables.status === 'verified' ? 'Approved' : 'Rejected'}`);
        },
        onError: (error) => {
            console.error(error);
            toast.error("Failed to verify task");
        }
    });
}

// 8. Chat Hook
export function useChat(companyId, employeeId) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Strict validation to prevent Firestore crashes
        if (!companyId || typeof companyId !== 'string' || !employeeId || typeof employeeId !== 'string') {
            setMessages([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        let unsubscribe;
        try {
            const messagesRef = collection(db, "companies", companyId, "conversations", employeeId, "messages");
            const q = query(messagesRef, orderBy("createdAt", "asc"));

            unsubscribe = onSnapshot(q,
                (snapshot) => {
                    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setMessages(msgs);
                    setLoading(false);
                },
                (error) => {
                    console.error("Chat Error:", error);
                    // toast.error("Chat connection failed"); // Optional: Don't spam toasts
                    setLoading(false);
                }
            );
        } catch (err) {
            console.error("Error setting up chat listener:", err);
            setLoading(false);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [companyId, employeeId]);

    const sendMessage = async (text, senderId) => {
        if (!text.trim() || !companyId || !employeeId) return;
        try {
            const messagesRef = collection(db, "companies", companyId, "conversations", employeeId, "messages");
            await addDoc(messagesRef, {
                text,
                senderId,
                createdAt: new Date().toISOString(),
                read: false
            });
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
        }
    };

    return { messages, loading, sendMessage };
}
