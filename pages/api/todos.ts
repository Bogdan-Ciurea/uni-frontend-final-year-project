import { iron_api_options } from "../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";

export default withIronSessionApiRoute(async (req, res) => {
    if (req.method === "PUT") {
      const user_token = req.session.user.token;
      if (!user_token) {
          res.status(401).json({error: "Not logged in!"});
      }

      const {todo_id, string_type} = req.body;

      const options = {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + user_token,
          },
          body: JSON.stringify({
            type: string_type,
          })
      };

      const path = process.env.BACKEND_URL + "/api/todos/" + todo_id;
      const response = await fetch(path, options);

      res.status(response.status).json(response.body);
    } else if ( req.method === "POST" ) {
      const user_token = req.session.user.token;
      console.log(user_token);
      if (!user_token) {
          res.status(401).json({error: "Not logged in!"});
      }

      const {text, type} = req.body;
      const options = {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + user_token,
          },
          body: JSON.stringify({
            type,
            text,
          })
      };

      const path = process.env.BACKEND_URL + "/api/todos";

      const response = await fetch(path, options);
      const response_json = await response.json();

      res.status(response.status).json(response_json);
    } else if (req.method === "DELETE") {
      const user_token = req.session.user.token;
      if (!user_token) {
          res.status(401).json({error: "Not logged in!"});
      }

      const {todo_id} = req.body;

      const options = {
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + user_token,
          },
      };

      const path = process.env.BACKEND_URL + "/api/todos/" + todo_id;

      const response = await fetch(path, options);

      res.status(response.status).json(response.body);
    } else {
      res.status(405).json({error: "Method not allowed!"});
    }

}, iron_api_options);
