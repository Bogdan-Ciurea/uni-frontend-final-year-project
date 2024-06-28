import { iron_api_options } from "../../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";

export default withIronSessionApiRoute(async (req, res) => {
  if (req.method === "DELETE") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    const { announcement_id, answer_id } = req.body;

    const response = await fetch(
      process.env.BACKEND_URL +
        "/api/announcement/" +
        announcement_id +
        "/answers?answer_id=" +
        answer_id,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + user_token,
        },
      }
    );

    const json_response = await response.json();

    res.status(response.status).json(json_response);
  } else if (req.method === "POST") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    const { content, announcement_id } = req.body;

    const response = await fetch(
      process.env.BACKEND_URL +
        "/api/announcement/" +
        announcement_id +
        "/answers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + user_token,
        },
        body: JSON.stringify({
          content,
        }),
      }
    );

    const json_response = await response.json();
    res.status(response.status).json(json_response);
  } else {
    res.status(405).json({ error: "Method not allowed!" });
  }
}, iron_api_options);
