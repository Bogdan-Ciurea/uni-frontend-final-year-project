import { iron_api_options } from "../../../lib/session";
import { withIronSessionApiRoute } from "iron-session/next";
import formidable from "formidable";
import FormData from "form-data";
import fs, {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "10mb",
  },
};

export default withIronSessionApiRoute(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed!" });
    return;
  }
  const user_token = req.session.user.token;
  if (!user_token) {
    res.status(401).json({ error: "Not logged in!" });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: "Error parsing form!" });
      return;
    }

    if (!fields.name || !fields.start_date || !fields.end_date || !files.file) {
      res.status(400).json({ error: "Missing fields!" });
      return;
    }

    let response = await fetch(process.env.BACKEND_URL + "/api/courses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user_token,
      },
      body: JSON.stringify({
        name: fields.name as string,
        start_date: parseInt(fields.start_date as string),
        end_date: parseInt(fields.end_date as string),
      }),
    });

    let json_response = await response.json();
    if (response.status !== 201) {
      res.status(response.status).json(json_response);
      return;
    }

    // Temporary measure
    res.status(response.status).json(json_response);
    return;

    if (!existsSync("uploads")) {
      mkdirSync("uploads");
    }
    const file = files.file as formidable.File;
    const file_path = file.filepath;
    const file_data = readFileSync(file_path);
    writeFileSync(`uploads/test_file.jpg`, file_data);
    unlinkSync(file.filepath);

    // Read the file from the uploads folder
    const fileData = await fs.promises.readFile("uploads/test_file.jpg");

    const formData = new FormData();
    formData.append("file", fileData, {
      filename: "filename.jpg",
      contentType: "image/jpeg",
    });

    response = await fetch(
      process.env.BACKEND_URL +
        "/api/course/" +
        json_response.id +
        "/thumbnail",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + user_token,
        },
        body: fileData,
      }
    );

    if (response.status !== 200) {
      res.status(response.status).json(json_response);
      return;
    }

    console.log(json_response);
    res.status(response.status).json(json_response);
  });
}, iron_api_options);
