import { iron_api_options } from "../../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";

export default withIronSessionApiRoute(async (req, res) => {
  if (req.method === "DELETE") {
    
  } else if (req.method === "POST") {
    const user_token = req.session.user.token;
    if (!user_token) {
        res.status(401).json({error: "Not logged in!"});
    }

    const {tags, announcement_id} = req.body;

    const response = await fetch(process.env.BACKEND_URL + "/api/announcement/" + announcement_id + "/tags" , {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + user_token,
          },
          body: JSON.stringify({
            tags,
          }),
        });

    res.status(response.status).json(await response.json());
  } else {
    res.status(405).json({error: "Method not allowed!"});
  }

}, iron_api_options);