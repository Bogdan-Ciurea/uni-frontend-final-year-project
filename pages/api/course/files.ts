import { iron_api_options } from "../../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";

export default withIronSessionApiRoute(async (req, res) => {
  if (req.method === "DELETE") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    const { file_id, course_id } = req.body;

    const response = await fetch(
      process.env.BACKEND_URL +
        "/api/course/" +
        course_id +
        "/files?file_id=" +
        file_id,
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
  } else if (req.method === "GET") {
    const user_token = req.session.user.token;
    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    const { file_path } = req.headers;

    const response = await fetch(
      process.env.BACKEND_URL + "/api/" + file_path,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + user_token,
        },
      }
    );

    if (response.status !== 200) {
      const json_response = await response.json();
      res.status(response.status).json(json_response);
    }

    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", response.headers.get("Content-Type"));
    res.statusCode = response.status;
    res.send(Buffer.from(buffer));
  } else if (req.method === "POST") {
    const user_token = req.session.user.token;

    if (!user_token) {
      res.status(401).json({ error: "Not logged in!" });
    }

    const {
      folder_id,
      course_id,
      type,
      file_name,
      visible_to_students,
      students_can_add,
    } = req.headers;

    // Get the file name from the request body

    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("multipart/form-data")) {
      res.status(400).send("Content type must be multipart/form-data");
      return;
    }

    const formData = new FormData();
    for await (const part of req) {
      if (part.filename) {
        const file = new Blob([part], { type: part.headers["content-type"] });
        formData.append("file", file, part.filename);
      }
    }

    console.log(formData.get("file"));

    if (!folder_id || folder_id === "undefined" || folder_id === "null") {
      const response = await fetch(
        process.env.BACKEND_URL + "/api/course/" + course_id + "/files",
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: "Bearer " + user_token,
            file_name: file_name as string,
            students_can_add: students_can_add as string,
            visible_to_students: visible_to_students as string,
            file_type: type as string,
          },
          body: formData,
        }
      );

      const json_response = await response.json();
      res.status(response.status).json(json_response);
    } else {
      const response = await fetch(
        process.env.BACKEND_URL + "/api/course/" + course_id + "/files",
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: "Bearer " + user_token,
            file_name: file_name as string,
            students_can_add: students_can_add as string,
            visible_to_students: visible_to_students as string,
            file_type: type as string,
            file_owner: folder_id as string,
          },
          body: formData,
        }
      );

      const json_response = await response.json();
      res.status(response.status).json(json_response);
    }
  } else {
    res.status(405).json({ error: "Method not allowed!" });
  }
}, iron_api_options);
