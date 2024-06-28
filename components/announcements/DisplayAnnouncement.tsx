import { DeleteIcon } from "@chakra-ui/icons";
import {
  Box,
  Text,
  Divider,
  Flex,
  Heading,
  Spacer,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  Center,
  SimpleGrid,
  Tag,
  Avatar,
  TagLabel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Announcement,
  User,
  UserType,
  MyFile,
  Answer,
} from "../../pages/announcements";
import DisplayAnnFile from "./DisplayAnnFile";
import DisplayAnnAnswer from "./DisplayAnnAnswer";
import { FaUpload } from "react-icons/fa";

type Props = {
  user: User;
  ann: Announcement;
  index: number;
  setAnnouncements: Dispatch<SetStateAction<Announcement[]>>;
  setChangedIndex: Dispatch<SetStateAction<number>>;
};

type SmallFile = {
  name: string;
  file: File;
};

export const enum ActionType {
  None,
  DeleteFile,
  DeleteAnswer,
  AddFile,
  AddAnswer,
}

async function sendAddFileRequest(
  ann_id: string,
  file: SmallFile
): Promise<string | MyFile> {
  const formData = new FormData();

  formData.append("file", file.file);
  formData.append("file_name", file.name);

  const response = await fetch("http://localhost:3000/api/announcement/files", {
    method: "POST",
    headers: {
      announcement_id: ann_id,
    },
    body: formData,
  });

  if (response.status !== 201) {
    const response_json = await response.json();
    return response_json.error;
  }

  const response_json = await response.json();
  const response_file: MyFile = response_json as MyFile;

  return response_file;
}

async function sendAddAnswerRequest(
  ann_id: string,
  content: string
): Promise<string | Answer> {
  const response = await fetch(
    "http://localhost:3000/api/announcement/answers",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        announcement_id: ann_id,
        content: content,
      }),
    }
  );

  const response_json = await response.json();

  if (response.status !== 201) {
    return response_json.error;
  }

  const temp_answer: Answer = response_json as Answer;

  return temp_answer;
}

async function sendDeleteRequest(ann_id: string): Promise<string | null> {
  const response = await fetch("http://localhost:3000/api/announcement", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      announcement_id: ann_id,
    }),
  }).then((response) => {
    if (response.status !== 200) {
      return response.json().then((response_json) => {
        return response_json.error;
      });
    }
    return null;
  });

  return null;
}

function DisplayAnn({
  ann,
  user,
  setAnnouncements,
  index,
  setChangedIndex,
}: Props) {
  const date = new Date(ann.created_at * 1000);
  const string_date = date.toLocaleDateString("en-UK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const [tempFileName, setTempFileName] = useState<string | null>(null);
  const [tempFileFile, setTempFileFile] = useState<File | null>(null);
  const [tempShortFile, setTempShortFile] = useState<SmallFile | null>(null);

  const [action, setAction] = useState<ActionType>(ActionType.None);
  const [tempFile, setTempFile] = useState<MyFile>(null);
  const [files, setFiles] = useState<MyFile[]>(ann.files);
  const [tempAns, setTempAns] = useState<Answer>(null);
  const [tempAnsContent, setTempAnsContent] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>(ann.answers);
  const {
    isOpen: isOpenFile,
    onOpen: onOpenFile,
    onClose: onCloseFile,
  } = useDisclosure();
  const {
    isOpen: isOpenAns,
    onOpen: onOpenAns,
    onClose: onCloseAns,
  } = useDisclosure();

  useEffect(() => {
    if (action === ActionType.None || tempFile === null) return;

    async function delete_file(): Promise<string | null> {
      const response = await fetch(
        "http://localhost:3000/api/announcement/files",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_id: tempFile.id,
            announcement_id: ann.id,
          }),
        }
      );

      const response_json = await response.json();

      if (response.status !== 200) {
        return response_json.error;
      }

      return null;
    }

    if (action === ActionType.DeleteFile) {
      const file_delete_promise = delete_file();
      file_delete_promise
        .then((error) => {
          if (error !== null) {
            console.log(error);
          } else {
            setAction(ActionType.None);
            setTempFile(null);
            setAnnouncements((ann) => {
              const new_ann = [...ann];
              new_ann[index].files = files;
              return new_ann;
            });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else if (action === ActionType.AddFile) {
      console.log("Adding file");
      setAnnouncements((ann) => {
        const new_ann = [...ann];
        new_ann[index].files = files;
        return new_ann;
      });
    }

    setAction(ActionType.None);
    setTempFile(null);
  }, [files]);

  useEffect(() => {
    if (action === ActionType.None || tempShortFile === null) return;

    const add_file_promise = sendAddFileRequest(ann.id, tempShortFile);
    // If the promise has a string, it is the error
    add_file_promise
      .then((error) => {
        if (typeof error === "string") {
          console.log(error);
        } else {
          // Else it is the file
          const file = error as MyFile;
          setAction(ActionType.AddFile);
          setTempFile(file);
          setFiles((files) => {
            const new_files = [...files];
            new_files.push(file);
            return new_files;
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, [tempShortFile]);

  useEffect(() => {
    if (action === ActionType.None || tempAns === null) return;

    async function delete_answer(): Promise<string | null> {
      const response = await fetch(
        "http://localhost:3000/api/announcement/answers",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answer_id: tempAns.id,
            announcement_id: ann.id,
          }),
        }
      );

      const response_json = await response.json();

      if (response.status !== 200) {
        return response_json.error;
      }

      return null;
    }

    if (action === ActionType.DeleteAnswer) {
      const answer_delete_promise = delete_answer();
      answer_delete_promise
        .then((error) => {
          if (error !== null) {
            alert(error);
          } else {
            setAction(ActionType.None);
            setAnswers((ans) => {
              const new_ans = [...ans];
              new_ans.filter((ans) => ans.id !== tempAns.id);
              return new_ans;
            });
            setTempAns(null);
            setAnnouncements((ann) => {
              const new_ann = [...ann];
              new_ann[index].answers = answers;
              return new_ann;
            });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else if (action === ActionType.AddAnswer) {
      setAnnouncements((ann) => {
        const new_ann = [...ann];
        new_ann[index].answers = answers;
        return new_ann;
      });
    }

    setAction(ActionType.None);
    setTempAns(null);
    setTempAnsContent(null);
  }, [answers]);

  useEffect(() => {
    if (
      action === ActionType.None ||
      tempAnsContent === null ||
      tempAnsContent === ""
    )
      return;

    const add_answer_promise = sendAddAnswerRequest(ann.id, tempAnsContent);

    add_answer_promise
      .then((error) => {
        if (typeof error === "string") {
          console.log(error);
        } else {
          // Else it is the answer
          setAction(ActionType.AddAnswer);
          setTempAns(error);
          setAnswers((ans) => {
            const new_ans = [...ans];
            new_ans.push(error);
            return new_ans;
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });

    setAction(ActionType.None);
    setTempAnsContent(null);
  }, [tempAnsContent]);

  function delete_ann() {
    const delete_promise = sendDeleteRequest(ann.id);
    // If the promise has a string, it is the error
    delete_promise
      .then((error) => {
        if (error !== null) {
          console.log(error);
        } else {
          setAnnouncements((ann) => {
            const new_ann = [...ann];
            new_ann.splice(index, 1);
            return new_ann;
          });
          setChangedIndex(index);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  return (
    <>
      <Box mt="5vh" mb="5vh">
        <Flex>
          <Box
            width={ann.created_at > user?.last_time_online ? "3px" : 0}
            background="red"
          ></Box>
          <Box w="100%">
            <Flex m="10px">
              <Heading size="md">{ann.title}</Heading>
              <Spacer />
              <Text>{string_date}</Text>
            </Flex>
            <Box m="10px">
              {/* this is the content */}
              <Text>{ann.content}</Text>
            </Box>
            <Tabs align="end" variant="enclosed" m="10px">
              <TabList>
                {/* <Text> Created by: {ann.created_by_user_name} </Text> */}
                <Tag colorScheme="red" borderRadius="full">
                  <Avatar
                    size="xs"
                    name={ann.created_by_user_name}
                    ml={-1}
                    mr={2}
                  />
                  <TagLabel>{ann.created_by_user_name}</TagLabel>
                </Tag>
                <Spacer></Spacer>
                <Tab>Files</Tab>
                <Tab>Responses</Tab>
                {user?.user_type === UserType.Admin ||
                user?.user_id === ann.created_by_user_id ? (
                  <>
                    <Box w="30px"></Box>
                    {/* <Button colorScheme="red" onClick={}><DeleteIcon/></Button> */}
                    <Button colorScheme="red" onClick={delete_ann}>
                      <DeleteIcon />
                    </Button>
                  </>
                ) : (
                  <></>
                )}
              </TabList>
              <TabPanels>
                <TabPanel>
                  {user?.user_type === UserType.Admin ||
                  user?.user_id === ann.created_by_user_id ? (
                    <>
                      <Button
                        colorScheme="blue"
                        onClick={onOpenFile}
                        rightIcon={<FaUpload />}
                      >
                        Upload File
                      </Button>

                      <Modal isOpen={isOpenFile} onClose={onCloseFile}>
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
                              onChange={(e) =>
                                setTempFileFile(e.target.files[0])
                              }
                            />
                          </ModalBody>

                          <ModalFooter>
                            <Button
                              variant="green"
                              mr={3}
                              onClick={onCloseFile}
                            >
                              Close
                            </Button>
                            <Button
                              colorScheme="green"
                              onClick={() => {
                                if (
                                  tempFileName === "" ||
                                  tempFileFile === null
                                ) {
                                  return;
                                }
                                setAction(ActionType.AddFile);
                                setTempShortFile({
                                  file: tempFileFile,
                                  name: tempFileName,
                                });
                                onCloseFile();
                              }}
                            >
                              Add File
                            </Button>
                          </ModalFooter>
                        </ModalContent>
                      </Modal>
                    </>
                  ) : (
                    <></>
                  )}

                  {ann.files.length ? ( // if there are files
                    <SimpleGrid minChildWidth="200px" spacing="40px">
                      {ann.files.map((file, file_index) => (
                        <DisplayAnnFile
                          file={file}
                          index={file_index}
                          user={user}
                          setTempFile={setTempFile}
                          setFiles={setFiles}
                          setAction={setAction}
                        />
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Center>
                      <Text>No files</Text>
                    </Center>
                  )}
                </TabPanel>
                <TabPanel>
                  {user.user_type === UserType.Admin ||
                  ann.created_by_user_id === user.user_id ||
                  ann.allow_answers ? (
                    <>
                      <Button colorScheme="blue" mb="20px" onClick={onOpenAns}>
                        Add Response
                      </Button>

                      <Modal isOpen={isOpenAns} onClose={onCloseAns}>
                        <ModalOverlay />
                        <ModalContent>
                          <ModalHeader>Add Answer</ModalHeader>
                          <ModalCloseButton />
                          <ModalBody>
                            <Input
                              mb="20px"
                              placeholder="Answer message"
                              onChange={(e) =>
                                setTempAnsContent(e.target.value)
                              }
                            />
                          </ModalBody>

                          <ModalFooter>
                            <Button variant="green" mr={3} onClick={onCloseAns}>
                              Close
                            </Button>
                            <Button
                              colorScheme="green"
                              onClick={() => {
                                setAction(ActionType.AddAnswer);
                                setTempAnsContent(tempAnsContent + " ");
                                onCloseAns();
                              }}
                            >
                              Add Answer
                            </Button>
                          </ModalFooter>
                        </ModalContent>
                      </Modal>
                    </>
                  ) : null}

                  {ann.answers.length ? ( // if there are answers
                    ann.answers.map((answer, ans_index) => (
                      <DisplayAnnAnswer
                        answer={answer}
                        user={user}
                        index={ans_index}
                        setTempAns={setTempAns}
                        setAnswers={setAnswers}
                        setAction={setAction}
                      />
                    ))
                  ) : (
                    <Center>
                      <Text>No answers</Text>
                    </Center>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Flex>
      </Box>
      <Divider />
    </>
  );
}

export default DisplayAnn;
