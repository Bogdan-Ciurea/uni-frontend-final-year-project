import {
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spacer,
  Tag,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { withIronSessionSsr } from "iron-session/next";
import { GetServerSideProps } from "next";
import { useEffect, useReducer, useState } from "react";
import DisplayAnnFile from "../../components/announcements/createPage/DisplayAnnFileCreate";
import DisplayColumnCreate from "../../components/announcements/createPage/DisplayColumnCreate";
import Layout from "../../components/Layout";
import { UserType, iron_api_options } from "../../lib/session";
import { Announcement } from "./index";

export type MyFile = {
  name: string;
  file: File;
};

export type Tag = {
  id: string;
  name: string;
  colour: string;
  selected: boolean;
};

type FormState = {
  title: string;
  content: string;
  allow_answers: boolean;
  tags: Tag[];
  files: MyFile[];
};

type FormAction = {
  type: "setTitle" | "setContent" | "setAllowAnswers" | "setTags" | "setFiles";
  payload?: string | boolean | Tag[] | MyFile[];
};

const reducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case "setTitle":
      return {
        ...state,
        title: action.payload as string,
      };
    case "setContent":
      return {
        ...state,
        content: action.payload as string,
      };
    case "setAllowAnswers":
      return {
        ...state,
        allow_answers: action.payload as boolean,
      };
    case "setTags":
      return {
        ...state,
        tags: action.payload as Tag[],
      };
    case "setFiles":
      return {
        ...state,
        files: action.payload as MyFile[],
      };
    default:
      return state;
  }
};

const initialFormState: FormState = {
  title: "",
  content: "",
  allow_answers: false,
  tags: [],
  files: [],
};

type Props = {
  error: string;
  tags: Tag[];
  user_token: string;
};

function checkForm(form: FormState): boolean {
  if (form.title === "") {
    return false;
  }

  if (form.content === "") {
    return false;
  }

  // Just the selected tags
  const selected_tags = form.tags.filter((tag) => tag.selected);
  if (selected_tags.length === 0) {
    return false;
  }

  return true;
}

const ssp: GetServerSideProps<Props> = async ({ req }) => {
  if (!req.session || !req.session.user || !req.session.user.token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  if (req.session.user.user_type === UserType.Student) {
    return {
      redirect: {
        destination: "/announcements",
        permanent: false,
      },
    };
  }

  const response = await fetch(process.env.BACKEND_URL + "/api/tags", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + req.session.user.token,
    },
  });

  if (response.status !== 200) {
    return {
      props: {
        tags: null,
        error: (
          (await response.json()) as {
            error: string;
          }
        ).error,
        user_token: null,
      },
    };
  }

  const tags = (await response.json()) as Tag[];

  // Order tags by name
  tags.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  });

  // Set selected to false for all tags
  tags.forEach((tag) => {
    // Randomise the selected value
    tag.selected = false;
  });

  return {
    props: {
      tags: tags,
      error: null,
      user_token: req.session.user.token,
    },
  };
};

async function sendData(form: FormState, user_token: string): Promise<string> {
  // Create announcement
  const response = await fetch("http://localhost:3000/api/announcement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: form.title,
      content: form.content,
      allow_answers: form.allow_answers,
    }),
  });

  if (response.status !== 201) {
    return (
      (await response.json()) as {
        error: string;
      }
    ).error;
  }

  const announcement = (await response.json()) as Announcement;

  // Upload files
  for (const file of form.files) {
    if (file.file === null) {
      return "File " + file.name + " is null!";
    }

    var formData = new FormData(); // FormData object
    formData.append("file", file.file);
    formData.append("file_name", file.name);

    const response_files = await fetch(
      "http://localhost:3000/api/announcement/files",
      {
        method: "POST",
        headers: {
          announcement_id: announcement.id,
          Authorization: "Bearer " + user_token,
        },
        body: formData,
      }
    );

    if (response_files.status !== 201) {
      // Delete the newly created announcement
      await fetch("http://localhost:3000/api/announcement", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          announcement_id: announcement.id,
        }),
      });

      return (
        (await response_files.json()) as {
          error: string;
        }
      ).error;
    }
  }

  // form.files.forEach((file) => {
  //   if (file.file === null) {
  //     return "File " + file.name + " is null!";
  //   }
  //   var form = new FormData(); // FormData object
  //   form.append("file", file.file);
  //   form.append("file_name", file.name);

  //   const response_files = fetch("http://localhost:3000/api/announcement/files", {
  //     method: 'POST',
  //     headers: {
  //       "announcement_id": announcement.id,
  //       "Authorization": "Bearer " + user_token,
  //     },
  //     body: form,
  //   }).then( (response) => {
  //     if (response.status !== 201) {

  //       // Delete the newly created announcement
  //       fetch("http://localhost:3000/api/announcement", {
  //         method: "DELETE",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           announcement_id: announcement.id,
  //         }),
  //       });

  //       console.log(response.status);

  //       return "Error uploading file " + file.name;
  //     }
  //   }).catch((error) => console.log(error));
  // });

  // Upload tags

  const selected_tags_ids = form.tags
    .filter((tag) => tag.selected)
    .map((tag) => tag.id);
  const response_tags = await fetch(
    "http://localhost:3000/api/announcement/tags",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tags: selected_tags_ids,
        announcement_id: announcement.id,
      }),
    }
  )
    .then(async (response) => {
      if (response.status !== 200) {
        // Delete the newly created announcement
        await fetch("http://localhost:3000/api/announcement", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            announcement_id: announcement.id,
          }),
        });
        return response;
      }
    })
    .catch((error) => console.log(error));

  return null;
}

export const getServerSideProps = withIronSessionSsr(ssp, iron_api_options);

function CreateAnnouncementPage({ error, tags, user_token }: Props) {
  const [tempFileName, setTempFileName] = useState<string | null>(null);
  const [tempFileFile, setTempFileFile] = useState<File | null>(null);

  const [tagList, setTagList] = useState<Tag[]>(tags);
  const [index, setIndex] = useState<number | null>(null);
  const [files, setFiles] = useState<MyFile[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [state, dispatch] = useReducer(reducer, initialFormState);

  useEffect(() => {
    if (index === null) {
      return;
    }

    tagList[index].selected = !tagList[index].selected;
    setTagList(tagList);

    dispatch({
      type: "setTags",
      payload: tagList.filter((tag) => tag.selected),
    });
    setIndex(null);
  }, [index]);

  useEffect(() => {
    dispatch({ type: "setFiles", payload: files });
  }, [files]);

  function handleSubmit() {
    if (!checkForm(state)) {
      return;
    }

    dispatch({ type: "setFiles", payload: files });

    const error_promise = sendData(state, user_token);

    // If the promise is not null, then there was an error
    error_promise.then((error) => {
      if (error !== null) {
        alert(error);
      }
    });
  }

  return (
    <Layout>
      <Center m="20px">
        <Heading>Create Announcement</Heading>
      </Center>
      <Flex m="5vw">
        <Box w="45%">
          <Flex width="80%">
            {" "}
            {/** Title */}
            <Text fontSize="2xl">Title</Text>
            <Spacer />
            <Input
              width="300px"
              variant="filled"
              placeholder="Some Title"
              value={state.title}
              onChange={(e) =>
                dispatch({ type: "setTitle", payload: e.target.value })
              }
            />
          </Flex>

          <Flex mt="30px" width="80%">
            {" "}
            {/** Content */}
            <Text fontSize="2xl">Content</Text>
            <Spacer />
            <Input
              width="300px"
              variant="filled"
              placeholder="Some content"
              value={state.content}
              onChange={(e) =>
                dispatch({ type: "setContent", payload: e.target.value })
              }
            />
          </Flex>

          <Flex mt="30px" width="80%">
            {" "}
            {/** Allow answers */}
            <Text fontSize="2xl">Allow comments</Text>
            <Spacer />
            <Checkbox
              mt="10px"
              isChecked={state.allow_answers}
              onChange={(e) =>
                dispatch({ type: "setAllowAnswers", payload: e.target.checked })
              }
            />
          </Flex>

          <Text fontSize="2xl" mt="30px">
            Files
          </Text>

          <Button
            mt="30px"
            colorScheme="blue"
            variant="outline"
            onClick={onOpen}
          >
            Add file
          </Button>
          {files.length === 0 ? (
            <Text mt="30px">No files added</Text>
          ) : (
            <SimpleGrid minChildWidth="175px" spacing="40px">
              {files.map((file, index) => (
                <DisplayAnnFile file={file} index={index} setFiles={setFiles} />
              ))}
            </SimpleGrid>
          )}
          {/* This is the pop out that will appear to add a file information*/}
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Add File</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Input
                  mb="20px"
                  placeholder="File name"
                  onChange={(e) => setTempFileName(e.target.value)}
                />
                <input
                  type="file"
                  onChange={(e) => setTempFileFile(e.target.files[0])}
                />
              </ModalBody>

              <ModalFooter>
                <Button variant="green" mr={3} onClick={onClose}>
                  Close
                </Button>
                <Button
                  colorScheme="green"
                  onClick={() => {
                    if (
                      tempFileName === null ||
                      tempFileName === "" ||
                      tempFileFile === null
                    ) {
                      return;
                    }
                    const newMyFile: MyFile = {
                      file: tempFileFile,
                      name: tempFileName,
                    };
                    setFiles([...files, newMyFile]);
                    setTempFileName(null);
                    setTempFileFile(null);
                    onClose();
                  }}
                >
                  Add File
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Box>
        <Box w="45%" ml="10%">
          <Flex>
            <Box w="50%" pl="20px" pr="20px">
              <Text fontSize="2xl">Available tags</Text>
              <DisplayColumnCreate
                tags={tagList}
                displaySelected={false}
                setTagList={setTagList}
                setIndex={setIndex}
              />
            </Box>
            <Box w="50%" ml="10%" pl="20px" pr="20px">
              <Text fontSize="2xl">Selected tags</Text>
              <DisplayColumnCreate
                tags={tagList}
                displaySelected={true}
                setTagList={setTagList}
                setIndex={setIndex}
              />
            </Box>
          </Flex>
        </Box>
      </Flex>
      <Center>
        <Button
          colorScheme={checkForm(state) ? "green" : "red"}
          variant="solid"
          value="create"
          onClick={handleSubmit}
        >
          Create Announcement
        </Button>
      </Center>
    </Layout>
  );
}

export default CreateAnnouncementPage;
