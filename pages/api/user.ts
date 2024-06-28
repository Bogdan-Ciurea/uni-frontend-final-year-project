import { iron_api_options } from "../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";

export default withIronSessionApiRoute(async (req, res) => {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const user = req.session.user;
    if (!user) {
        res.status(401).json({ error: "Not logged in" });
        return;
    }

    res.json({ user });
}, iron_api_options);