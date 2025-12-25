import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, getDocs, doc, updateDoc, addDoc, orderBy, increment, limit } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

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
                const statusScore = (status) => {
                    if (status === 'available') return 3; // Green
                    if (status === 'busy') return 2;      // Orange
                    return 1;                             // Red (idle/other)
                };
                return statusScore(b.status) - statusScore(a.status);
            });
        },
        enabled: !!userProfile?.companyId,
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

            return sortedUsers.slice(0, 3); // Top 3
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
        onSuccess: (newStatus) => {
            toast.success(newStatus === 'requesting_task' ? "Work requested successfully!" : "Request cancelled.");
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
                if (data.size > 700 * 1024) throw new Error("File too large! Max 700KB.");
                proofData = await convertToBase64(data);
            } else {
                proofData = data;
            }

            const taskRef = doc(db, "companies", userProfile.companyId, "users", userProfile.uid, "activities", taskId);
            await updateDoc(taskRef, {
                status: 'verification_pending',
                proofUrl: proofData,
                proofType: type,
                completedAt: new Date().toISOString()
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
            // 1. Add Task
            const activitiesRef = collection(db, "companies", userProfile.companyId, "users", employeeId, "activities");
            await addDoc(activitiesRef, {
                ...taskData,
                points: taskData.points, // Points instead of Amount
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
            queryClient.invalidateQueries(['employees', userProfile.companyId]);
            toast.success("Task Assigned Successfully!");
        },
        onError: (error) => {
            console.error(error);
            toast.error("Failed to assign task");
        }
    });
}

// 7. Verify Task
export function useVerifyTask(userProfile) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ employeeId, taskId, status, points }) => {
            const taskRef = doc(db, "companies", userProfile.companyId, "users", employeeId, "activities", taskId);

            await updateDoc(taskRef, {
                status: status,
                verifiedAt: new Date().toISOString(),
                verifiedBy: userProfile.uid
            });

            const userRef = doc(db, "companies", userProfile.companyId, "users", employeeId);
            // Points Logic
            if (status === 'verified') {
                await updateDoc(userRef, {
                    "pointsStats.totalEarned": increment(points),
                    "pointsStats.currentBalance": increment(points) // Optional if we want a spendable balance later
                });
            }
            // No penalty for rejection in points system yet
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
