import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Switch,
  Text,
  UseToastOptions,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { withIronSessionSsr } from "iron-session/next";
import { GetServerSideProps } from "next";
import Layout from "../../../components/Layout";
import { User, iron_api_options } from "../../../lib/session";
import { Course } from "../index";
import Link from "next/link";
import { AiFillFolderOpen, AiFillFile, AiOutlineFolder } from "react-icons/ai";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import useUser from "../../../hooks/useUser";
import { UserType } from "../../../lib/session";
import { DeleteIcon, DownloadIcon } from "@chakra-ui/icons";
import { FaUpload } from "react-icons/fa";

enum CourseFileType {
  File = 0,
  Folder = 1,
}

type CourseFile = {
  created_by_user_id: string;
  created_by_user_name: string;
  files: CourseFile[];
  id: string;
  name: string;
  path: string;
  students_can_add: boolean;
  type: CourseFileType;
  visible_to_students: boolean;
};

type Answer = {
  content: string;
  created_at: number;
  created_by: string;
  id: string;
  question_id: string;
};

type Props = {
  error: string;
  course: Course;
  course_files: CourseFile[];
};

const ssp: GetServerSideProps<Props> = async ({ req, params }) => {
  if (!req.session || !req.session.user || !req.session.user.token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  let response = await fetch(
    process.env.BACKEND_URL + "/api/course/" + params.slug,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + req.session.user.token,
      },
    }
  );

  if (response.status !== 200) {
    return {
      props: {
        error: (
          (await response.json()) as {
            error: string;
          }
        ).error,
        course: null,
        course_files: null,
      },
    };
  }

  const course = (await response.json()) as Course;

  response = await fetch(
    process.env.BACKEND_URL + "/api/course/" + params.slug + "/files",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + req.session.user.token,
      },
    }
  );

  if (response.status !== 200) {
    return {
      props: {
        error: (
          (await response.json()) as {
            error: string;
          }
        ).error,
        course: null,
        course_files: null,
      },
    };
  }

  const course_files = (await response.json()) as CourseFile[];
  if (course_files === null) {
    return {
      props: {
        error: "Error getting course files",
        course: course,
        course_files: [],
      },
    };
  }
  return {
    props: {
      error: null,
      course,
      course_files,
    },
  };
};

export const getServerSideProps = withIronSessionSsr(ssp, iron_api_options);

function CourseLayout({
  children,
  course,
  user,
}: {
  children: any;
  course: Course;
  user: User;
}) {
  // Have a left sidebar with links to files and questions
  return (
    <Layout>
      <Flex width="100%">
        <Box width="25%">
          <Center>
            <Heading mt="30px">Links</Heading>
          </Center>
          <Center>
            <Link href={"/courses/" + course.id + "/files"}>
              <Text mt="30px">Files</Text>
            </Link>
          </Center>
          <Center>
            <Link href={"/courses/" + course.id + "/questions"}>
              <Text mt="30px">Questions</Text>
            </Link>
          </Center>
          {user.user_type !== UserType.Student ? (
            <Center>
              <Link href={"/courses/" + course.id + "/grades"}>
                <Text mt="30px">Grades</Text>
              </Link>
            </Center>
          ) : null}
          {user.user_type !== UserType.Student ? (
            <Center>
              <Link href={"/courses/" + course.id + "/management"}>
                <Text mt="30px">Management</Text>
              </Link>
            </Center>
          ) : null}
        </Box>
        <Box width="75%">
          <Center mr="25%">
            <Heading mt="30px">{course.name}</Heading>
          </Center>
          {children}
        </Box>
      </Flex>
    </Layout>
  );
}

function UploadFile({
  course_id,
  setFiles,
  onClose,
  folder_id,
  toast,
}: {
  course_id: string;
  setFiles: Dispatch<SetStateAction<CourseFile[]>>;
  onClose: () => void;
  folder_id: string | null;
  toast: (props: UseToastOptions) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [file_name, setFileName] = useState<string>("");
  const [visible_to_students, setVisibleToStudents] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null) {
      setFile(null);
      console.log("No file selected");
      return;
    }

    if (event.target.files.length === 0) {
      setFile(null);
      console.log("No file selected");
      return;
    }

    const file = event.target.files[0];
    setFile(file);
  };

  const handleUpload = async () => {
    if (file === null) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:3000/api/course/files", {
      method: "POST",
      headers: {
        course_id,
        type: "FILE",
        file_name,
        visible_to_students: visible_to_students ? "true" : "false",
        students_can_add: "false",
        folder_id,
      },
      body: formData,
    });

    if (response.status !== 201) {
      const response_json = await response.json();
      toast({
        title: "Error uploading file",
        description: response_json.error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      onClose();
      return;
    }

    const new_file = (await response.json()) as CourseFile;

    setFiles((files) => [...files, new_file]);

    onClose();
  };

  return (
    <Box>
      <input type="file" onChange={handleFileChange} />
      <Input
        mt="20px"
        mb="20px"
        value={file_name}
        onChange={(e) => setFileName(e.target.value)}
      />
      <Switch
        mb="20px"
        onChange={(e) => setVisibleToStudents(e.target.checked)}
      >
        Visible to students
      </Switch>
      <Button onClick={handleUpload}>Upload</Button>
    </Box>
  );
}

function CreateFolder({
  course_id,
  setFiles,
  onClose,
  toast,
}: {
  course_id: string;
  setFiles: Dispatch<SetStateAction<CourseFile[]>>;
  onClose: () => void;
  folder_id: string;
  toast: (props: UseToastOptions) => void;
}) {
  const [folder_name, setFolderName] = useState<string>("");
  const [visible_to_students, setVisibleToStudents] = useState<boolean>(false);
  const [students_can_add, setStudentsCanAdd] = useState<boolean>(false);

  const handleUpload = async () => {
    const response = await fetch("http://localhost:3000/api/course/files", {
      method: "POST",
      headers: {
        course_id,
        type: "FOLDER",
        file_name: folder_name,
        visible_to_students: visible_to_students ? "true" : "false",
        students_can_add: students_can_add ? "true" : "false",
      },
      body: null,
    });

    if (response.status !== 201) {
      const response_json = await response.json();
      toast({
        title: "Error",
        description: response_json.error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      onClose();
      return;
    }

    const new_folder = (await response.json()) as CourseFile;

    setFiles((files) => [...files, new_folder]);

    onClose();
  };

  return (
    <Box>
      <Input
        mt="20px"
        mb="20px"
        value={folder_name}
        onChange={(e) => setFolderName(e.target.value)}
      />
      <Switch
        mb="20px"
        onChange={(e) => setVisibleToStudents(e.target.checked)}
      >
        Visible to students
      </Switch>
      <Switch mb="20px" onChange={(e) => setStudentsCanAdd(e.target.checked)}>
        Students can add files
      </Switch>
      <Button onClick={handleUpload}>Create</Button>
    </Box>
  );
}

function CourseFile({
  file,
  setFiles,
  user,
  course_id,
  toast,
}: {
  file: CourseFile;
  setFiles: Dispatch<SetStateAction<CourseFile[]>>;
  user: User;
  course_id: string;
  toast: (props: UseToastOptions) => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isDownloading === false) return;

    async function download_file(): Promise<void> {
      const response = await fetch("http://localhost:3000/api/course/files", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          file_path: file.path,
        },
      });

      if (response.status !== 200) {
        const response_json = await response.json();
        toast({
          title: "Error",
          description: response_json.error,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsDownloading(false);
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
    <Box mt="20px" mb="20px" width="75%">
      <HStack>
        <AiFillFile />
        <Text fontSize="2xl">{file.name}</Text>
        <Spacer />
        <Button
          colorScheme="blue"
          key="download"
          onClick={() => setIsDownloading(true)}
        >
          <DownloadIcon />
        </Button>
        {user.user_type === UserType.Student ? null : (
          <Button
            colorScheme="red"
            key="delete"
            onClick={async () => {
              const response = await fetch(
                "http://localhost:3000/api/course/files",
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    file_id: file.id,
                    course_id: course_id,
                  }),
                }
              );

              if (response.status !== 200) {
                const response_json = await response.json();
                toast({
                  title: "Error",
                  description: response_json.error,
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                });
                return;
              }

              setFiles((files) => {
                const new_files = files.filter((f) => f.id !== file.id);

                return new_files;
              });
            }}
          >
            <DeleteIcon />
          </Button>
        )}
      </HStack>
    </Box>
  );
}

function FolderFile({
  file,
  setFiles,
  user,
  course_id,
  toast,
}: {
  file: CourseFile;
  setFiles: Dispatch<SetStateAction<CourseFile[]>>;
  user: User;
  course_id: string;
  toast: (props: UseToastOptions) => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isDownloading === false) return;

    async function download_file(): Promise<void> {
      const response = await fetch("http://localhost:3000/api/course/files", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          file_path: file.path,
        },
      });

      if (response.status !== 200) {
        const response_json = await response.json();
        toast({
          title: "Error",
          description: response_json.error,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
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
    <Box mt="20px" mb="20px" width="75%">
      <HStack>
        <AiFillFile />
        <Text fontSize="2xl">{file.name}</Text>
        <Spacer />
        <Button
          colorScheme="blue"
          key="download"
          onClick={() => setIsDownloading(true)}
        >
          <DownloadIcon />
        </Button>
        {user.user_type !== UserType.Student ? (
          <Button
            colorScheme="red"
            key="delete"
            onClick={async () => {
              const response = await fetch(
                "http://localhost:3000/api/course/files",
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    file_id: file.id,
                    course_id: course_id,
                  }),
                }
              );

              if (response.status !== 200) {
                const response_json = await response.json();
                toast({
                  title: "Error",
                  description: response_json.error,
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                });
                return;
              }

              setFiles((files) => {
                const new_files = files.filter((f) => f.id !== file.id);

                return new_files;
              });
            }}
          >
            <DeleteIcon />
          </Button>
        ) : (
          <></>
        )}
      </HStack>
    </Box>
  );
}

function CourseFolder({
  folder,
  setFiles,
  user,
  course_id,
  toast,
}: {
  folder: CourseFile;
  setFiles: Dispatch<SetStateAction<CourseFile[]>>;
  user: User;
  course_id: string;
  toast: (props: UseToastOptions) => void;
}) {
  const [folderFiles, setFolderFiles] = useState<CourseFile[]>(folder.files);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deleteFolder, setDeleteFolder] = useState(false);

  useEffect(() => {
    setFiles((files) => {
      const new_files = files.map((file) => {
        if (file.path === folder.path) {
          return { ...file, files: folderFiles };
        } else {
          return file;
        }
      });

      return new_files;
    });
  }, [folderFiles]);

  useEffect(() => {
    if (deleteFolder === false) return;

    async function delete_folder(): Promise<void> {
      const response = await fetch("http://localhost:3000/api/course/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_id: folder.id,
          course_id: course_id,
        }),
      });

      if (response.status !== 200) {
        const response_json = await response.json();
        toast({
          title: "Error",
          description: response_json.error,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }

    const delete_promise = delete_folder();

    setFiles((files) => {
      const new_files = files.filter((f) => f.id !== folder.id);

      return new_files;
    });

    delete_promise.then(() => {
      setDeleteFolder(false);
    });
  }, [deleteFolder]);

  return (
    <Box mt="20px" mb="20px">
      <Accordion defaultIndex={[0]} allowMultiple>
        <AccordionItem>
          <h2>
            <AccordionButton width="75%">
              <HStack flex="1">
                <AiFillFolderOpen />
                <Box flex="1" textAlign="left" fontSize="2xl">
                  {folder.name}
                </Box>
              </HStack>
              <Button
                mr="20px"
                colorScheme="red"
                onClick={() => {
                  setDeleteFolder(true);
                }}
              >
                <DeleteIcon />
              </Button>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4} ml="40px">
            {folderFiles.map((file) => {
              return (
                <FolderFile
                  file={file}
                  setFiles={setFolderFiles}
                  user={user}
                  course_id={course_id}
                  toast={toast}
                />
              );
            })}
            {user.user_type !== UserType.Student ? (
              <Button
                colorScheme="blue"
                mt="20px"
                onClick={onOpen}
                key="upload"
              >
                <Text mr="10px">Upload file</Text>
                <FaUpload />
              </Button>
            ) : (
              <></>
            )}
          </AccordionPanel>
          <AccordionPanel pb={4} ml="40px"></AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload File</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <UploadFile
              folder_id={folder.id}
              course_id={course_id}
              setFiles={setFolderFiles}
              onClose={onClose}
              toast={toast}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default function DrawFilesPage({ course, course_files, error }: Props) {
  const { user, isLoading } = useUser();
  const [files, setFiles] = useState<CourseFile[]>(course_files);
  const {
    isOpen: isOpenFile,
    onOpen: onOpenFile,
    onClose: onCloseFile,
  } = useDisclosure();

  const toast = useToast();

  const {
    isOpen: isOpenFolder,
    onOpen: onOpenFolder,
    onClose: onCloseFolder,
  } = useDisclosure();

  if (error) {
    toast({
      title: "Error",
      description: error,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  }

  if (isLoading) {
    return <></>;
  }

  return (
    <CourseLayout course={course} user={user}>
      <Center mb="30px" mr="25%">
        <Heading mt="30px">Files</Heading>
      </Center>

      {files.length === 0 ? (
        <Center mr="25%">
          <Text>No files</Text>
        </Center>
      ) : (
        <></>
      )}

      {files.map((file) => {
        if (
          file.visible_to_students === false &&
          user.type === UserType.Student
        )
          return null;

        if (file.type === CourseFileType.File) {
          return (
            <CourseFile
              file={file}
              setFiles={setFiles}
              user={user}
              course_id={course.id}
              toast={toast}
            />
          );
        } else {
          return (
            <CourseFolder
              folder={file}
              setFiles={setFiles}
              user={user}
              course_id={course.id}
              toast={toast}
            />
          );
        }
      })}
      {user.user_type !== UserType.Student ? (
        <Flex w="75%" mt="20px" mb="20px">
          <Button w="45%" mr="10%" colorScheme="blue" onClick={onOpenFile}>
            <Text mr="10px">Upload File</Text>
            <FaUpload />
          </Button>
          <Button w="45%" colorScheme="blue" onClick={onOpenFolder}>
            <Text mr="10px">Create Folder</Text>
            <AiOutlineFolder />
          </Button>
        </Flex>
      ) : (
        <></>
      )}
      <Modal isOpen={isOpenFile} onClose={onCloseFile}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload File</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <UploadFile
              setFiles={setFiles}
              course_id={course.id}
              onClose={onCloseFile}
              folder_id={null}
              toast={toast}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal isOpen={isOpenFolder} onClose={onCloseFolder}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Folder</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <CreateFolder
              setFiles={setFiles}
              course_id={course.id}
              onClose={onCloseFolder}
              folder_id={null}
              toast={toast}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </CourseLayout>
  );
}
