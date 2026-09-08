import express from "express";
import { addMember, getUserWorkspaces } from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.put("/add-member", addMember);

export default workspaceRouter;