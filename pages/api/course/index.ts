import { iron_api_options } from "../../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";
export default withIronSessionApiRoute(async (req, res) => {
  if (req.method === "DELETE") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    const { course_id } = req.body;

    const response = await fetch(
      process.env.BACKEND_URL + "/api/course/" + course_id,
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
  } else if (req.method === "PUT") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    let { course_id, name, start_date, end_date } = req.body;

    if (name === "") {
      name = null;
    }

    if (start_date === "") {
      start_date = null;
    }

    if (end_date === "") {
      end_date = null;
    }

    if (name === null && start_date === null && end_date === null) {
      res.status(400).json({ error: "No data to update!" });
    }

    const response = await fetch(
      process.env.BACKEND_URL + "/api/course/" + course_id,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + user_token,
        },
        body: JSON.stringify({
          name: name,
          start_date: start_date,
          end_date: end_date,
        }),
      }
    );

    const json_response = await response.json();
    res.status(response.status).json(json_response);
  } else {
    res.status(405).json({ error: "Method not allowed!" });
  }
}, iron_api_options);
