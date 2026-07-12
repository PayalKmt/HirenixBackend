

import {z} from "zod";
const userValidation = 
z.object({
fullname:z.string().min(3,"Fullname must be at least 3 characters"),
password:z.string().min(6,"Password must be at least 6 characters"),
email:z.string().email("Invalid email format")
});

const userLoginValidator =
z.object({
password:z.string().min(6,"Password must be at least 6 characters"),
email:z.string().email("Invalid email format"),
enable30Day: z.boolean().optional().default(false)
});

export {userValidation,userLoginValidator};
