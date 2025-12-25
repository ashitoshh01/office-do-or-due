# Firestore Rules Deployment Guide

## Quick Fix: Deploy Firestore Rules

### Step-by-Step Instructions:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Log in with your Google account

2. **Select Your Project**
   - Click on your project (the one used for this DoOrDue application)

3. **Navigate to Firestore Database**
   - In the left sidebar, find and click "Firestore Database"
   - Click on the "Rules" tab at the top

4. **Replace the Rules**
   - Delete all existing rules
   - Copy and paste the following rules:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isUser(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    // Companies Collection
    match /companies/{companyId} {
      // Allow reading company info to check existence during signup
      allow read: if true; 
      // Allow creation during first user signup or seeding
      allow write: if true;

      // Nested Users Collection
      match /users/{userId} {
        
        // Helper to check if the requestor is a manager of this company
        function isManagerOfCompany() {
           return get(/databases/$(database)/documents/companies/$(companyId)/users/$(request.auth.uid)).data.role == 'manager';
        }

        // Users can read/write their own profile
        allow read, write: if isUser(userId);
        // Managers of the same company can read employee profiles and update status
        allow read, update: if isManagerOfCompany();

        // Nested Activities Collection
        match /activities/{activityId} {
          // Owner (Employee) can read/write their own activities
          allow read, create: if isUser(userId);
          allow update: if isUser(userId) || isManagerOfCompany();
          // Managers can read all activities, create new ones (assign), and delete
          allow read, create, delete: if isManagerOfCompany();
        }
      }
    }
    
    // Allow collection group query for users finding their own profile
    match /{path=**}/users/{userId} {
      allow read, write: if request.auth.uid == resource.data.uid;
    }

    // Join Requests Collection
    match /joinRequests/{requestId} {
      // Anyone can create a join request (unauthenticated signup)
      allow create: if true;
      
      // Authenticated users can read requests
      allow read: if isAuthenticated();
      
      // Only specific approvers can update the status
      // Managers/Admins can update join requests where they are the approver
      allow update: if isAuthenticated() && 
        (request.auth.token.email == resource.data.approverEmail);
    }
  }
}
```

5. **Publish the Rules**
   - Click the blue "Publish" button at the top right
   - Wait for confirmation message

6. **Test the Join Request**
   - Go back to your app: http://localhost:5173/primecommerce/admin/signup
   - Fill in the form and try submitting again
   - The "Missing or insufficient permissions" error should be gone!

---

## What We've Built Today

### ✅ Completed Features:

1. **Company-Based Routing**
   - `/primecommerce/login` - Employee login
   - `/primecommerce/signup` - Employee signup (creates join request)
   - `/primecommerce/manager/login` - Manager login
   - `/primecommerce/manager/signup` - Manager signup (creates join request)
   - `/primecommerce/admin/login` - Admin login
   - `/primecommerce/admin/signup` - Admin signup (creates join request)

2. **Super Admin Portal**
   - Created super admin account: `superadmin@primecommerce.com` / `vvvvvvvv`
   - Super admin dashboard at: `/superadmin/dashboard`
   - Approve/Reject admin join requests

3. **Join Request System**
   - Users submit join requests (no direct signup)
   - Requests stored in Firestore `joinRequests` collection
   - Approval workflow:
     - ADMIN requests → Super Admin approves
     - MANAGER requests → Admin approves
     - EMPLOYEE requests → Manager approves

4. **Auth Layout**
   - Split-screen design
   - Prime Commerce logo and branding on left
   - Contact information displayed
   - Form on right side

5. **Role-Based Redirects**
   - Super Admin → `/superadmin/dashboard`
   - Admin → `/primecommerce/admin/dashboard`
   - Manager → `/primecommerce/manager/dashboard`
   - Employee → `/primecommerce/dashboard`

---

## Testing Checklist

### After Deploying Firestore Rules:

- [ ] Test Admin Signup:
  - Go to `/primecommerce/admin/signup`
  - Fill: Name: "Test Admin", Email: "testadmin@primecommerce.com"
  - Submit request
  - No error should appear

- [ ] Test Super Admin Dashboard:
  - Log in as super admin at `/primecommerce/admin/login`
  - Go to `/superadmin/dashboard`
  - See the admin join request
  - Click "Approve"
  - User should receive password reset email

- [ ] Test New Admin Login:
  - Check email for password reset
  - Set new password
  - Log in at `/primecommerce/admin/login`
  - Should redirect to admin dashboard

---

## Next Steps (Future Enhancements)

1. **Admin Dashboard** - Build UI for admins to approve manager requests
2. **Manager Dashboard** - Build UI for managers to approve employee requests
3. **Email Notifications** - Use Resend API for forgot password emails
4. **Employee/Manager Workflows** - Complete the approval chain
5. **Dashboard Features** - Add task management, analytics, etc.

---

## Important Notes

- **Super Admin Creation**: Use browser console with `window.createSuperAdmin()` if needed
- **Firestore Rules**: Must be deployed to Firebase Console for changes to take effect
- **Password Reset**: Firebase automatically sends password reset emails when users are approved
- **Security**: Current rules allow anyone to create join requests (by design for signup)
