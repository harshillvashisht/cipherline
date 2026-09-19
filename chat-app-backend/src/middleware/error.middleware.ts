import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import type { Response, Request, NextFunction,} from "express";

export const errormiddleware = (err: unknown, req: Request, res: Response, next: NextFunction) => {

    if(err instanceof ApiError){

        const statuscode: number = err.statusCode ?? 500;
        const errormessage: string = err.message ?? "internal server error";

        return res.status(statuscode).json({
            success: false,
            message: errormessage
        })

    }
    else if (err instanceof ZodError){
        const message = err.issues[0].message;
        const statusCode = 400;

        return res.status(statusCode).json({
            success: false,
            message: message
        })
    }
    else{
        const message = "internal server error";
        const statusCode = 500;
        console.log(err);

        return res.status(statusCode).json({
            success: false,
            message: message

        })
    }

}