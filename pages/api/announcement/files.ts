import { iron_api_options } from "../../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";

export default withIronSessionApiRoute(async (req, res) => {
  if (req.method === "DELETE") {
    const user_token = req.session.user.token;
    if (!user_token) {
        res.status(401).json({error: "Not logged in!"});
    }

    const {file_id, announcement_id} = req.body;

    const response = await fetch(process.env.BACKEND_URL + "/api/announcement/" + announcement_id + "/files?file_id=" + file_id, {
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + user_token,
          },
      }
    );

    res.status(response.status).json(response.body);
  } else if (req.method === "GET") {
    const user_token = req.session.user.token;
    if (!user_token) {
        res.status(401).json({error: "Not logged in!"});
    }

    const {file_path} = req.headers;

    const response = await fetch(process.env.BACKEND_URL + "/api/" + file_path, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + user_token,
          },
        }
    );

    if (response.status !== 200) {
      res.status(response.status).json(response.body);
    }

    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', response.headers.get('Content-Type'));
    res.statusCode = response.status;
    res.send(Buffer.from(buffer));
  } else if (req.method === "POST") {
    const user_token = req.session.user.token;

    if (!user_token) {
      res.status(401).json({error: "Not logged in!"});
    }

    const {announcement_id} = req.headers;

    const response = await fetch(process.env.BACKEND_URL + "/api/announcement/" + announcement_id + "/files" , {
      method: "POST",
      headers: {
        'Content-Type': req.headers['content-type'],
        'Authorization': 'Bearer ' + user_token,
      },
      body: req.body,
    });

    const json_response = await response.json();
    
    res.status(response.status).json(json_response);
  } else {
    res.status(405).json({error: "Method not allowed!"});
  }

}, iron_api_options);