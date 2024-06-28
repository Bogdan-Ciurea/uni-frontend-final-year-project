import { DeleteIcon, DownloadIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Flex,
  Icon,
  Text,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FaFileAlt } from "react-icons/fa";
import { MyFile, User, UserType } from "../../pages/announcements";
import { ActionType } from "./DisplayAnnouncement";

type Props = {
  file: MyFile;
  index: number;
  user: User;
  setFiles: Dispatch<SetStateAction<MyFile[]>>;
  setAction: Dispatch<SetStateAction<ActionType>>;
  setTempFile: Dispatch<SetStateAction<MyFile>>;
};

export default function DisplayAnnFile({
  file,
  index,
  user,
  setFiles,
  setAction,
  setTempFile,
}: Props) {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (isDownloading === false) return;

    async function download_file(): Promise<void> {
      const response = await fetch(
        "http://localhost:3000/api/announcement/files",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            file_path: file.path,
          },
        }
      );

      if (response.status !== 200) {
        const response_json = await response.json();
        console.log(response_json.error);
        return;
      }

      const blob = await response.blob(); // get the image data as a blob

      const url = window.URL.createObjectURL(new Blob([blob])); // create a URL for the blob data
      const link = document.createElement("a"); // create a link element
      link.href = url; // set the link URL to the blob URL
      link.setAttribute("download", file.name); // set the filename for the downloaded file
      document.body.appendChild(link); // add the link element to the DOM
      link.click(); // simulate a click on the link to trigger the download
      document.body.removeChild(link);
    }

    const download_promise = download_file();

    download_promise.then(() => {
      setIsDownloading(false);
    });
  }, [isDownloading]);

  return (
    <Card mt="20px">
      <Flex>
        <Box w="100%" key="description">
          <Flex mt="8px">
            <Icon key="desc_icon" as={FaFileAlt} w={6} h={6} />
            <Text key="desc_title">{file.name}</Text>
          </Flex>
        </Box>
        <Box w="30px" key="spacer"></Box>
        {isDownloading ? (
          <CircularProgress isIndeterminate color="blue.300" size="40px" />
        ) : (
          <Button
            colorScheme="blue"
            key="download"
            onClick={() => {
              setIsDownloading(true);
            }}
          >
            <DownloadIcon />
          </Button>
        )}
        {user?.user_type === UserType.Admin ||
        user?.user_id === file.created_by ? (
          <Button
            colorScheme="red"
            key="delete"
            onClick={() => {
              setAction(ActionType.DeleteFile);
              setTempFile(file);
              setFiles((files) => {
                const newFiles = [...files];
                newFiles.splice(index, 1);
                return newFiles;
              });
            }}
          >
            <DeleteIcon />
          </Button>
        ) : (
          <></>
        )}
      </Flex>
    </Card>
  );
}
