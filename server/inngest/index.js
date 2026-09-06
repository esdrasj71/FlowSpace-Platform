import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

export const inngest = new Inngest({ id: "my-FlowSpace" });

// INNGEST function to save user data to a database
const syncUserCreation = inngest.createFunction(
    { 
        id: 'sync-user-from-clerk',
        triggers: { event: 'clerk/user.created' }  // ✅ Changed: event → triggers
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

// INNGEST function to delete user from db
const syncUserDeletion = inngest.createFunction(
    { 
        id: 'delete-user-from-clerk',
        triggers: { event: 'clerk/user.deleted' }  // ✅ Changed: event → triggers
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

// INNGEST function to update user data from db
const syncUserUpdation = inngest.createFunction(
    { 
        id: 'update-user-from-clerk',
        triggers: { event: 'clerk/user.updated' }  // ✅ Changed: event → triggers
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

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation
];