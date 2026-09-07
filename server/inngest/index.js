import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

export const inngest = new Inngest({ id: "my-FlowSpace" });

// ✅ CORRECT: User Creation
const syncUserCreation = inngest.createFunction(
    { 
        id: 'sync-user-from-clerk',
        triggers: [{ event: 'clerk/user.created' }]  // ✅ Array syntax
    },
    async ({ event }) => {
        try {
            const { data } = event;
            console.log('🔄 Syncing user creation:', data.id);
            
            await prisma.user.create({
                data: {
                    id: data.id,
                    email: data?.email_addresses[0]?.email_address || '',
                    name: (data?.first_name || '') + ' ' + (data?.last_name || ''),
                    image: data?.image_url || '',
                }
            });
            console.log('✅ User created successfully');
            return { success: true, userId: data.id };
        } catch (error) {
            console.error('❌ Failed to create user:', error);
            throw error;
        }
    }
);

// ✅ CORRECT: User Deletion
const syncUserDeletion = inngest.createFunction(
    { 
        id: 'delete-user-from-clerk',
        triggers: [{ event: 'clerk/user.deleted' }]  // ✅ Array syntax
    },
    async ({ event }) => {
        try {
            const { data } = event;
            console.log('🔄 Syncing user deletion:', data.id);
            
            await prisma.user.delete({
                where: {
                    id: data.id,
                }
            });
            console.log('✅ User deleted successfully');
            return { success: true, userId: data.id };
        } catch (error) {
            console.error('❌ Failed to delete user:', error);
            throw error;
        }
    }
);

// ✅ CORRECT: User Update
const syncUserUpdation = inngest.createFunction(
    { 
        id: 'update-user-from-clerk',
        triggers: [{ event: 'clerk/user.updated' }]  // ✅ Array syntax
    },
    async ({ event }) => {
        try {
            const { data } = event;
            console.log('🔄 Syncing user update:', data.id);
            
            await prisma.user.update({
                where: {
                    id: data.id
                },
                data: {
                    email: data?.email_addresses[0]?.email_address || '',
                    name: (data?.first_name || '') + ' ' + (data?.last_name || ''),
                    image: data?.image_url || '',
                }
            });
            console.log('✅ User updated successfully');
            return { success: true, userId: data.id };
        } catch (error) {
            console.error('❌ Failed to update user:', error);
            throw error;
        }
    }
);

// ✅ FIXED: Workspace Creation
const syncWorkspaceCreation = inngest.createFunction(
    { 
        id: 'sync-workspace-from-clerk',
        triggers: [{ event: 'clerk/organization.created' }]  // ✅ Fixed: triggers array
    },
    async ({ event }) => {
        try {
            const { data } = event;
            console.log('🔄 Syncing workspace creation:', data.id);
            
            await prisma.workspace.create({
                data: {
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                    ownerId: data.created_by,
                    image_url: data.image_url || '',
                }
            });
            
            // Add creator as admin
            await prisma.workspaceMember.create({
                data: {
                    userId: data.created_by,
                    workspaceId: data.id,
                    role: "ADMIN"
                }
            });
            
            console.log('✅ Workspace created successfully');
            return { success: true, workspaceId: data.id };
        } catch (error) {
            console.error('❌ Failed to create workspace:', error);
            throw error;
        }
    }
);

// ✅ FIXED: Workspace Update
const syncWorkspaceUpdation = inngest.createFunction(
    { 
        id: 'update-workspace-from-clerk',
        triggers: [{ event: 'clerk/organization.updated' }]  // ✅ Fixed: triggers array
    },
    async ({ event }) => {
        try {
            const { data } = event;
            console.log('🔄 Syncing workspace update:', data.id);
            
            await prisma.workspace.update({
                where: {
                    id: data.id
                },
                data: {
                    name: data.name,
                    slug: data.slug,
                    image_url: data.image_url || '',
                }
            });
            
            console.log('✅ Workspace updated successfully');
            return { success: true, workspaceId: data.id };
        } catch (error) {
            console.error('❌ Failed to update workspace:', error);
            throw error;
        }
    }
);

// ✅ FIXED: Workspace Deletion
const syncWorkspaceDeletion = inngest.createFunction(
    { 
        id: 'delete-workspace-from-clerk',
        triggers: [{ event: 'clerk/organization.deleted' }]  // ✅ Fixed: triggers array
    },
    async ({ event }) => {
        try {
            const { data } = event;
            console.log('🔄 Syncing workspace deletion:', data.id);
            
            await prisma.workspace.delete({
                where: {
                    id: data.id
                }
            });
            
            console.log('✅ Workspace deleted successfully');
            return { success: true, workspaceId: data.id };
        } catch (error) {
            console.error('❌ Failed to delete workspace:', error);
            throw error;
        }
    }
);

// ✅ FIXED: Workspace Member Creation
const syncWorkspaceMemberCreation = inngest.createFunction(
    { 
        id: 'sync-workspace-member-from-clerk',
        triggers: [{ event: 'clerk/organizationInvitation.accepted' }]  // ✅ Fixed: triggers array
    },
    async ({ event }) => {
        try {
            const { data } = event;
            console.log('🔄 Syncing workspace member creation:', data.user_id);
            
            await prisma.workspaceMember.create({
                data: {
                    userId: data.user_id,
                    workspaceId: data.organization_id,
                    role: String(data.role_name).toUpperCase(),
                }
            });
            
            console.log('✅ Workspace member created successfully');
            return { success: true, memberId: data.user_id };
        } catch (error) {
            console.error('❌ Failed to create workspace member:', error);
            throw error;
        }
    }
);

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation
];