import { iron_api_options, UserType } from "../../lib/session";
import {withIronSessionApiRoute} from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";

export default withIronSessionApiRoute(
    async function login(req: NextApiRequest, res: NextApiResponse) {
        if (req.method !== "POST") {
            res.status(405).json({ error: "Method Not Allowed" });
            return;
        }

        const {email, password, school_id} = req.body;

        const response = await fetch(process.env.BACKEND_URL + "/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
                school_id,
            }),
        });
        
        // If the response is not 200, return the error
        if (response.status !== 200) {
            const response_json = await response.json() as {
                error: string;
            }
            res.status(response.status).json(response_json);
            return;
        }
        
        const response_json = await response.json() as {
            token: string;
            last_time_online: number;
            changed_password: boolean;
            phone_number: string;
            email: string;
            user_id: string;
            user_type: UserType;
            first_name: string;
            last_name: string;
            error: string;
        }


        req.session.user = response_json;
        await req.session.save();

        res.status(200).json({});
    },
    iron_api_options
);