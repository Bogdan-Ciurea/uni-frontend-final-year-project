import { iron_api_options } from "../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";

export default withIronSessionApiRoute(
    async function logout(req: NextApiRequest, res: NextApiResponse) {
        if (!req.session.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        
        const response = await fetch(process.env.BACKEND_URL + "/api/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + req.session.user.token,
            },
        });

        // If the response is not 200, return the error
        if (response.status !== 200) {
            const response_json = await response.json() as {
                error: string;
            }
            res.status(response.status).json(response_json);
            return;
        }

        req.session.user = null;
        await req.session.save();

        req.session.destroy();

        res.status(200).json({ message: "Logged out" });
    },
    iron_api_options
);