import { body } from "express-validator";




const authValidator = () => {
    return[
     body("email").not().isEmpty().isEmail().withMessage("Invalid email address"),
        body("password").not().isEmpty().withMessage("Password is required"),
    ]
};


export default authValidator;