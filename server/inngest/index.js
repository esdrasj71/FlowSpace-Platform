import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import sendEmail from "../configs/nodemailer.js";

export const inngest = new Inngest({ id: "my-FlowSpace" });

const syncUserCreation = inngest.createFunction(
    { 
        id: 'sync-user-from-clerk',
        triggers: [{ event: 'clerk/user.created' }] 
    },
    async ({ event }) => {
        try {
            const { data } = event;
            
            await prisma.user.create({
                data: {
                    id: data.id,
                    email: data?.email_addresses[0]?.email_address || '',
                    name: (data?.first_name || '') + ' ' + (data?.last_name || ''),
                    image: data?.image_url || '',
                }
            });
            return { success: true, userId: data.id };
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    }
);

const syncUserDeletion = inngest.createFunction(
    { 
        id: 'delete-user-from-clerk',
        triggers: [{ event: 'clerk/user.deleted' }]  
    },
    async ({ event }) => {
        try {
            const { data } = event;
            
            await prisma.user.delete({
                where: {
                    id: data.id,
                }
            });
            return { success: true, userId: data.id };
        } catch (error) {
            console.error('Failed to delete user:', error);
            throw error;
        }
    }
);

const syncUserUpdation = inngest.createFunction(
    { 
        id: 'update-user-from-clerk',
        triggers: [{ event: 'clerk/user.updated' }]  
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
            return { success: true, userId: data.id };
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }
);

const syncWorkspaceCreation = inngest.createFunction(
    { 
        id: 'sync-workspace-from-clerk',
        triggers: [{ event: 'clerk/organization.created' }]  
    },
    async ({ event }) => {
        try {
            const { data } = event;
            
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
            
            return { success: true, workspaceId: data.id };
        } catch (error) {
            console.error('Failed to create workspace:', error);
            throw error;
        }
    }
);

const syncWorkspaceUpdation = inngest.createFunction(
    { 
        id: 'update-workspace-from-clerk',
        triggers: [{ event: 'clerk/organization.updated' }]  
    },
    async ({ event }) => {
        try {
            const { data } = event;
            
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
            
            return { success: true, workspaceId: data.id };
        } catch (error) {
            console.error('Failed to update workspace:', error);
            throw error;
        }
    }
);

const syncWorkspaceDeletion = inngest.createFunction(
    { 
        id: 'delete-workspace-from-clerk',
        triggers: [{ event: 'clerk/organization.deleted' }]  
    },
    async ({ event }) => {
        try {
            const { data } = event;
            
            await prisma.workspace.delete({
                where: {
                    id: data.id
                }
            });
            
            return { success: true, workspaceId: data.id };
        } catch (error) {
            console.error('Failed to delete workspace:', error);
            throw error;
        }
    }
);

const syncWorkspaceMemberCreation = inngest.createFunction(
    { 
        id: 'sync-workspace-member-from-clerk',
        triggers: [{ event: 'clerk/organizationInvitation.accepted' }]  
    },
    async ({ event }) => {
        try {
            const { data } = event;
            
            await prisma.workspaceMember.create({
                data: {
                    userId: data.user_id,
                    workspaceId: data.organization_id,
                    role: String(data.role_name).toUpperCase(),
                }
            });
            
            return { success: true, memberId: data.user_id };
        } catch (error) {
            console.error('Failed to create workspace member:', error);
            throw error;
        }
    }
);

// Send email on Task creation
const sendTaskAssignmentEmail = inngest.createFunction(
    { 
        id: "send-task-assignment-email",
        triggers: [{ event: "app/task.assigned" }]  
    },
    async ({event, step}) => {
        const {taskId, origin} = event.data;
        const task = await prisma.task.findUnique({
            where: {id: taskId},
            include: {assignee: true, project: true}
        })

        await sendEmail({
            to: task.assignee.email,
            subject: `New Task Assignment in ${task.project.name}`,
            body: `Hi ${task.assignee.name}` `${task.title}` //design in process 4
            `${new Date(task,due_date).toLocaleDateString()}
            <a href=${origin}> View Task</a>`
        })
        if(new Date(task.due_date).toLocaleDateString()!== new Date().toDateString){
            await step.sleepUntil('wait-for-the-due-date', new Date(task.due_date));
            await step.run('check-if-task-is-completed', async () =>{
                const task = await prisma.task.findUnique({
                    where: {id: taskId},
                    include: {assignee: true, project:true},
                })
                if(!task) return;

                if(task.status !== "DONE"){
                    await step.run('send-task-reminder-all', async () => {
                        await sendEmail({
                            to: task.assignee.email,
                            subject: `Reminder for ${task.project.name}`,
                            body: `Reminder for ${task.project.name}
                            Please make sure to review it and complete it before
                            the due date.`, //design in process 4
                        })
                    })
                }
            });
        }
    }
)

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation,
    sendTaskAssignmentEmail
];