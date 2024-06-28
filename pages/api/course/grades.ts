import { iron_api_options } from "../../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";

export default withIronSessionApiRoute(async (req, res) => {
  if (req.method === "DELETE") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    const { grade_id } = req.body;

    const response = await fetch(
      process.env.BACKEND_URL + "/api/grades/" + grade_id,
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

    const { course_id, user_id, grade, out_of, weight } = req.body;

    const response = await fetch(process.env.BACKEND_URL + "/api/grades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user_token,
      },
      body: JSON.stringify({
        course_id: course_id,
        user_id: user_id,
        grade: grade,
        out_of: out_of,
        weight: weight / 100,
      }),
    });

    const json_response = await response.json();
    res.status(response.status).json(json_response);
  } else {
    res.status(405).json({ error: "Method not allowed!" });
  }
}, iron_api_options);
