import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export function useFileUpload(userProfile) {
    const [uploading, setUploading] = useState(false);

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const uploadProof = async (taskId, uploadPayload) => {
        if (!userProfile?.companyId || !userProfile?.uid || !taskId) return;

        setUploading(true);
        const { type, data } = uploadPayload;

        try {
            let proofData = null;

            if (type === 'file') {
                if (data.size > 700 * 1024) {
                    toast.error("File too large! Max size is 700KB. Use 'Paste Link' instead.");
                    setUploading(false);
                    return false;
                }
                proofData = await convertToBase64(data);
            } else {
                // Link
                proofData = data;
            }

            const taskRef = doc(db, "companies", userProfile.companyId, "users", userProfile.uid, "activities", taskId);

            await updateDoc(taskRef, {
                status: 'verification_pending',
                proofUrl: proofData,
                proofType: type,
                completedAt: new Date().toISOString()
            });

            toast.success("Proof submitted successfully!");
            return true;

        } catch (error) {
            console.error("Error uploading proof:", error);
            toast.error("Failed to submit proof. Please try again.");
            return false;
        } finally {
            setUploading(false);
        }
    };

    return { uploadProof, uploading };
}
