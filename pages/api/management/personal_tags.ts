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
      process.env.BACKEND_URL + "/api/tags/personal_tags?user_id=" + user_id,
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
  } else if (req.method === "PUT") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    type Data = {
      user_id: string;
      tags: {
        add: string[];
        remove: string[];
      };
    };
    const information = req.body as Data;

    // Send the request to the backend
    await information.tags.add.map(async (tag) => {
      const response = await fetch(
        process.env.BACKEND_URL +
          "/api/tags/" +
          tag +
          "/add_user?user_id=" +
          information.user_id,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + user_token,
          },
        }
      );

      if (response.status != 200) {
        const json_response = await response.json();
        console.log(json_response);
        res.status(response.status).json(json_response);
        return;
      }
    });

    await information.tags.remove.map(async (tag) => {
      const response = await fetch(
        process.env.BACKEND_URL +
          "/api/tags/" +
          tag +
          "/remove_user?user_id=" +
          information.user_id,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + user_token,
          },
        }
      );

      if (response.status != 200) {
        const json_response = await response.json();
        console.log(json_response);
        res.status(response.status).json(json_response);
        return;
      }
    });

    res.status(200).json({ message: "Success!" });
  } else {
    res.status(405).json({ error: "Method not allowed!" });
  }
}, iron_api_options);
