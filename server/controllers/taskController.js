import prisma from '../configs/prisma.js';
import { inngest } from '../inngest/index.js';

// Create task
export const createTask = async (req, res) => {
    try {
        const {userId} = await req.auth();  
        const {projectId, title, description, type, status, priority, assigneeId, due_date} = req.body;
        const origin = req.get('origin')

        // Check if user has admin role
        const project = await prisma.project.findUnique({
            where: {id: projectId},
            include: {members: {include: {user: true}}}
        })
        if (!project) {
            return res.status(404).json({message: 'Project not found'});
        } else if (project.team_lead !== userId) {
            return res.status(403).json({message: 'Access denied - You dont have access to this project'});
        } else if (assigneeId && !project.members.find((member) => member.userId === assigneeId)) {
            return res.status(403).json({message: 'Access denied - Assignee is not a member of this project/workspace'});
        }

        const task = await prisma.task.create({
            data: {
                projectId,
                title,      
                description,
                type,
                priority,
                assigneeId,
                status, 
                due_date: due_date ? new Date(due_date) : null,
            }
        })

        const taskWithAssignee = await prisma.task.findUnique({
            where: {id: task.id},
            include: {assignee: true}
        })

        await inngest.send({
            name: "app/task.assigned",
            data: {
                taskId: task.id, origin
            }
        })

        res.json({task: taskWithAssignee, message: "Task created successfully"})

    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message || 'Internal server error'});
    }
}

// Update Task 
export const updateTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id } = req.params;

        // Check if task exists
        const task = await prisma.task.findUnique({
            where: { id }
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Check permissions
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: project.workspaceId },
            include: { members: { include: { user: true } } }
        });

        const isAdmin = workspace?.members.some((member) => member.userId === userId && member.role === 'ADMIN');
        const isTeamLead = project.team_lead === userId;

        if (!isAdmin && !isTeamLead) {
            return res.status(403).json({ message: 'Access denied - You do not have permission to update this task' });
        }

        const { title, description, type, status, priority, assigneeId, due_date } = req.body;

        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                title,
                description,
                type,
                status,
                priority,
                assigneeId,
                due_date: due_date ? new Date(due_date) : null,
            },
            include: { assignee: true }
        });

        res.json({ task: updatedTask, message: "Task updated successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
}

// Delete Task
export const deleteTask = async (req, res) => {
    try {
        
        const {userId} = await req.auth();
        const { tasksIds } = req.body

        if(!tasksIds || tasks.length === 0){
            return res.status(404).json({message: "Task not found"});
        }  

        const tasks = await prisma.task.findMany({
            where: {id: {in: tasksIds}}
        })
          
        if (tasks.length === 0) {
            return res.status(404).json({ message: "Tasks not found" });
        }
       
        const project = await prisma.project.findUnique({
            where: {id: tasks[0].projectId},
            include: {members: {include: {user: true}}}
        })

        if (!project) {
            return res.status(404).json({message: 'Project not found'});
        } 

        const workspace = await prisma.workspace.findUnique({
            where: { id: project.workspaceId },
            include: { members: { include: { user: true } } }
        });

        const isAdmin = workspace?.members.some((member) => member.userId === userId && member.role === 'ADMIN');
        const isTeamLead = project.team_lead === userId;

        if (!isAdmin && !isTeamLead) {
            return res.status(403).json({ message: 'Access denied - You do not have permission to delete tasks in this project' });
        }

        // Delete tasks
        await prisma.task.deleteMany({
            where: {id: {in: tasksIds}}
        })
         
        res.json({message: "Task(s) deleted successfully"})

    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
}