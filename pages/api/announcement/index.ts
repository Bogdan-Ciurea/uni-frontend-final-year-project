import { iron_api_options } from "../../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";

export default withIronSessionApiRoute(async (req, res) => {
  if (req.method === "DELETE") {
    const user_token = req.session.user.token;
    if (!user_token) {
        res.status(401).json({error: "Not logged in!"});
    }

    const {announcement_id} = req.body;

    const response = await fetch(process.env.BACKEND_URL + "/api/announcement/" + announcement_id, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + user_token,
      },
    });
    
    const json = await response.json();

    res.status(response.status).json(json);
  } else if (req.method === "GET") {
  } else if (req.method === "POST") {
    const user_token = req.session.user.token;
    if (!user_token) {
        res.status(401).json({error: "Not logged in!"});
    }
    const {title, content, allow_answers } = req.body;

    const response = await fetch(process.env.BACKEND_URL + "/api/announcements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + req.session.user.token,
    },
      body: JSON.stringify({
        title,
        content,
        allow_answers,
      }),
    });

    res.status(response.status).json(await response.json());
  } else if (req.method === "PUT") {
  } else {
    res.status(405).json({error: "Method not allowed!"});
  }

}, iron_api_options);