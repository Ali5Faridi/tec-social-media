import registerValidator from "../../validators/registerValidator.js";
import express from "express";
import userController from "../../controllers/userController.js";


const router = express.Router();

router.post("/register", registerValidator(), userController.register);

export default router;