import {
  Avatar,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  Input,
  Tag,
  TagLabel,
  Text,
  UseToastOptions,
  useToast,
} from "@chakra-ui/react";
import { withIronSessionSsr } from "iron-session/next";
import { GetServerSideProps } from "next";
import Layout from "../../../components/Layout";
import { User, iron_api_options } from "../../../lib/session";
import { Course } from "../index";
import Link from "next/link";
import { AiFillCaretRight, AiFillCaretLeft } from "react-icons/ai";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import useUser from "../../../hooks/useUser";
import { UserType } from "../../../lib/session";

type CourseStudent = {
  email: string;
  first_name: string;
  last_name: string;
  user_id: string;
  user_type: UserType;
};

type Props = {
  error: string;
  course: Course;
  course_students: CourseStudent[];
  school_students: CourseStudent[];
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
        course_students: null,
        school_students: null,
      },
    };
  }

  const course = (await response.json()) as Course;

  response = await fetch(
    process.env.BACKEND_URL + "/api/course/" + params.slug + "/users",
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
        course_students: null,
        school_students: null,
      },
    };
  }

  const course_students = (await response.json()) as CourseStudent[];

  response = await fetch(process.env.BACKEND_URL + "/api/users", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + req.session.user.token,
    },
  });

  if (response.status !== 200) {
    return {
      props: {
        error: (
          (await response.json()) as {
            error: string;
          }
        ).error,
        course: null,
        course_students: null,
        school_students: null,
      },
    };
  }

  const school_students = (await response.json()) as CourseStudent[];

  return {
    props: {
      error: null,
      course,
      course_students,
      school_students,
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

function AddStudents({
  course,
  current_students,
  possible_students,
  setCurrentStudents,
  setPossibleStudents,
  toast,
}: {
  course: Course;
  current_students: CourseStudent[];
  possible_students: CourseStudent[];
  setCurrentStudents: Dispatch<SetStateAction<CourseStudent[]>>;
  setPossibleStudents: Dispatch<SetStateAction<CourseStudent[]>>;
  toast: (props: UseToastOptions) => void;
}) {
  const addStudent = async (student: CourseStudent) => {
    const response = await fetch("http://localhost:3000/api/course/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course_id: course.id,
        user_id: student.user_id,
      }),
    });

    if (response.status !== 200) {
      toast({
        title: "Error adding student to course",
        description: (
          (await response.json()) as {
            error: string;
          }
        ).error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setCurrentStudents((current_students) => {
      return [...current_students, student];
    });
    setPossibleStudents((possible_students) => {
      return possible_students.filter((s) => s.user_id !== student.user_id);
    });
  };

  const removeStudent = async (student: CourseStudent) => {
    const response = await fetch("http://localhost:3000/api/course/users", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course_id: course.id,
        user_id: student.user_id,
      }),
    });

    if (response.status !== 200) {
      toast({
        title: "Error removing student from course",
        description: (
          (await response.json()) as {
            error: string;
          }
        ).error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setPossibleStudents((possible_students) => {
      return [...possible_students, student];
    });
    setCurrentStudents((current_students) => {
      return current_students.filter((s) => s.user_id !== student.user_id);
    });
  };

  const [search, setSearch] = useState("");

  return (
    <Box w="50%">
      <Center>
        <Heading mt="30px">Add Students</Heading>
      </Center>

      <HStack>
        <Box width="47%" mr="6%" mb="auto">
          <Center>
            <Text fontSize="3xl" mt="30px">
              Possible Students
            </Text>
          </Center>
          <Input
            mt="20px"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
          {possible_students
            .filter(
              (student) =>
                student.first_name
                  .toLowerCase()
                  .includes(search.toLowerCase()) ||
                student.last_name.toLowerCase().includes(search.toLowerCase())
            )
            .map((student) => {
              return (
                <Flex>
                  <Tag mt="20px" w="100%">
                    <Avatar
                      size="xs"
                      name={student.first_name + " " + student.last_name}
                    />
                    <TagLabel ml="10px">
                      {student.first_name + " " + student.last_name}
                    </TagLabel>
                  </Tag>
                  <Button
                    ml="10px"
                    mt="20px"
                    onClick={() => {
                      addStudent(student);
                    }}
                  >
                    <AiFillCaretRight />
                  </Button>
                </Flex>
              );
            })}
        </Box>
        <Box width="47%" mb="max">
          <Center>
            <Text fontSize="3xl" mt="30px">
              Current Students
            </Text>
          </Center>
          {current_students.map((student) => {
            return (
              <Flex>
                <Button
                  mr="10px"
                  mt="20px"
                  onClick={() => {
                    removeStudent(student);
                  }}
                >
                  <AiFillCaretLeft />
                </Button>
                <Tag mt="20px" w="100%">
                  <Avatar
                    size="xs"
                    name={student.first_name + " " + student.last_name}
                  />
                  <TagLabel ml="10px">
                    {student.first_name + " " + student.last_name}
                  </TagLabel>
                </Tag>
              </Flex>
            );
          })}
        </Box>
      </HStack>
    </Box>
  );
}

function CourseDetails({
  course,
  toast,
}: {
  course: Course;
  toast: (props: UseToastOptions) => void;
}) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const updateCourse = async () => {
    const response = await fetch("http://localhost:3000/api/course", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course_id: course.id,
        name: name,
        // If the user doesn't change the date, it will be an empty string
        // else it will be a date object that needs to be converted to a unix timestamp
        start_date:
          startDate !== ""
            ? Math.trunc(new Date(startDate).getTime().valueOf() / 1000)
            : "",
        end_date:
          endDate !== ""
            ? Math.trunc(new Date(endDate).getTime().valueOf() / 1000)
            : "",
      }),
    });

    if (response.status !== 200) {
      const error = ((await response.json()) as { error: string }).error;
      toast({
        title: "Error updating course.",
        description: error,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      return;
    }

    setName("");
    setStartDate("");
    setEndDate("");

    toast({
      title: "Course updated.",
      description: "The course has been updated.",
      status: "success",
      duration: 9000,
      isClosable: true,
    });
  };

  return (
    <Box w="35%" mr="6%">
      <Center>
        <Heading mt="30px">Course Details</Heading>
      </Center>
      <Center>
        <Box>
          <Flex w="100%" mt="30px">
            <Text fontSize="xl" mt="5px" mr="20px">
              Name
            </Text>
            <Input
              value={name}
              placeholder="Name"
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </Flex>

          <Flex w="100%" mt="30px">
            <Text fontSize="xl" mt="5px" mr="20px" w="auto">
              Start Date
            </Text>
            <Input
              w="auto"
              value={startDate}
              placeholder="Day"
              type="date"
              onChange={(e) => {
                setStartDate(e.target.value);
              }}
            />
          </Flex>

          <Flex w="100%" mt="30px">
            <Text fontSize="xl" mt="5px" mr="20px" w="auto">
              End Date
            </Text>
            <Input
              w="auto"
              value={endDate}
              placeholder="Month"
              type="date"
              onChange={(e) => {
                setEndDate(e.target.value);
              }}
            />
          </Flex>
          <Center>
            <Button
              mt="30px"
              w="100%"
              onClick={() => {
                updateCourse();
              }}
            >
              Save
            </Button>
          </Center>
        </Box>
      </Center>
    </Box>
  );
}

function CourseManagementPage({
  error,
  course,
  course_students,
  school_students,
}: Props) {
  const { user } = useUser();
  const toast = useToast();

  const [current_students, setCurrentStudents] =
    useState<CourseStudent[]>(course_students);
  const [possible_students, setPossibleStudents] = useState<CourseStudent[]>(
    school_students.filter((student) => {
      // If the student is not in the course and they are not admin, add them to the possible students
      return (
        !current_students.some((s) => s.user_id === student.user_id) &&
        student.user_type !== UserType.Admin
      );
    })
  );

  useEffect(() => {
    // Order the current students by last name alphabetically
    setCurrentStudents((current_students) => {
      return current_students.sort((a, b) => {
        if (a.last_name > b.last_name) {
          return -1;
        } else if (a.last_name < b.last_name) {
          return 1;
        } else {
          return 0;
        }
      });
    });
  }, [current_students]);

  useEffect(() => {
    // Order the possible students by last name
    setPossibleStudents((possible_students) => {
      return possible_students.sort((a, b) => {
        if (a.last_name > b.last_name) {
          return -1;
        } else if (a.last_name < b.last_name) {
          return 1;
        } else {
          return 0;
        }
      });
    });
  }, [possible_students]);

  if (error || !course || !course_students || !user) {
    return (
      <Layout>
        <Center>{error}</Center>
      </Layout>
    );
  }

  return (
    <CourseLayout course={course} user={user}>
      <Center>
        <Heading mr="25%" mt="30px">
          Course Management
        </Heading>
      </Center>
      <Flex>
        <CourseDetails course={course} toast={toast} />
        <AddStudents
          course={course}
          current_students={current_students}
          possible_students={possible_students}
          setCurrentStudents={setCurrentStudents}
          setPossibleStudents={setPossibleStudents}
          toast={toast}
        />
      </Flex>
    </CourseLayout>
  );
}

export default CourseManagementPage;
