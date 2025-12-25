import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export function useTasks(userProfile) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const companyId = userProfile?.companyId;
    const uid = userProfile?.uid;

    useEffect(() => {
        if (!companyId || !uid) {
            setLoading(false);
            return;
        }

        const activitiesRef = collection(db, "companies", companyId, "users", uid, "activities");
        const q = query(activitiesRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTasks(fetchedTasks);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error("Error fetching tasks:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [companyId, uid]);

    return { tasks, loading, error };
}
