import { iron_api_options } from "../../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";

export default withIronSessionApiRoute(async (req, res) => {
  if (req.method === "GET") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    const { user_id } = req.headers;

    const response = await fetch(
      process.env.BACKEND_URL + "/api/users/" + user_id,
      {
        method: "GET",
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

    type User = {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      type: number;
    };

    const user = req.body as User;

    const response = await fetch(process.env.BACKEND_URL + "/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user_token,
      },
      body: JSON.stringify(user),
    });

    const json_response = await response.json();
    res.status(response.status).json(json_response);
  } else if (req.method === "PUT") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    type User = {
      user_id: string;
      first_name: string;
      password: string;
      last_name: string;
      email: string;
      phone_number: string;
      user_type: number;
    };

    const user = req.body as User;
    if (user.user_type) user.user_type = parseInt(user.user_type.toString());

    const response = await fetch(
      process.env.BACKEND_URL + "/api/users/" + user.user_id,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + user_token,
        },
        body: JSON.stringify(user),
      }
    );

    const json_response = await response.json();
    res.status(response.status).json(json_response);
  } else {
    res.status(405).json({ error: "Method not allowed!" });
  }
}, iron_api_options);
