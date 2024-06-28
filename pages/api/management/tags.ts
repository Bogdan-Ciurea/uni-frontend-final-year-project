import { iron_api_options } from "../../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";

export default withIronSessionApiRoute(async (req, res) => {
  if (req.method === "DELETE") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    const { id } = req.body;

    const response = await fetch(process.env.BACKEND_URL + "/api/tags/" + id, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + user_token,
      },
    });

    const json_response = await response.json();
    res.status(response.status).json(json_response);
  } else if (req.method === "POST") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    const { name, colour } = req.body;

    const response = await fetch(process.env.BACKEND_URL + "/api/tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user_token,
      },
      body: JSON.stringify({
        name: name,
        colour: colour,
      }),
    });

    const json_response = await response.json();
    res.status(response.status).json(json_response);
  } else if (req.method === "PUT") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    const { name, colour, id } = req.body;

    const response = await fetch(process.env.BACKEND_URL + "/api/tags/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user_token,
      },
      body: JSON.stringify({
        name: name,
        colour: colour,
      }),
    });

    const json_response = await response.json();
    res.status(response.status).json(json_response);
  } else {
    res.status(405).json({ error: "Method not allowed!" });
  }
}, iron_api_options);
